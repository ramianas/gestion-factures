package ma.eai.daf.facture.services;

import ma.eai.daf.facture.entities.Facture;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.entities.ValidationFacture;
import ma.eai.daf.facture.enums.StatutFacture;
import ma.eai.daf.facture.repositories.FactureRepository;
import ma.eai.daf.facture.repositories.UserRepository;
import ma.eai.daf.facture.repositories.ValidationFactureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FactureService {

    private final FactureRepository factureRepository;
    private final UserRepository userRepository;
    private final ValidationFactureRepository validationRepository;
    private final NotificationService notificationService;

    // ===== CRUD DE BASE =====

    public List<Facture> getAllFactures() {
        return factureRepository.findAll();
    }

    public Optional<Facture> getFactureById(Long id) {
        return factureRepository.findById(id);
    }

    public Optional<Facture> getFactureByNumero(String numero) {
        return factureRepository.findByNumero(numero);
    }

    public Facture createFacture(Facture facture, Long createurId) {
        User createur = userRepository.findById(createurId)
                .orElseThrow(() -> new RuntimeException("Créateur non trouvé"));

        if (!createur.isUtilisateurSaisie()) {
            throw new RuntimeException("Seuls les utilisateurs U1 peuvent créer des factures");
        }

        // Validation des validateurs
        validateValidateurs(facture);

        // Génération automatique du numéro si pas fourni
        if (facture.getNumero() == null || facture.getNumero().trim().isEmpty()) {
            facture.setNumero(generateNumeroFacture());
        }

        facture.setCreateur(createur);
        facture.setStatut(StatutFacture.SAISIE);

        Facture savedFacture = factureRepository.save(facture);
        log.info("Nouvelle facture créée: {} par {}", savedFacture.getNumero(), createur.getNomComplet());

        // Envoyer notification V1 après 24h (à implémenter avec un scheduler)
        // notificationService.scheduleNotificationV1(savedFacture);

        return savedFacture;
    }

    public Facture updateFacture(Long id, Facture factureUpdate) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        if (!facture.peutEtreModifiee()) {
            throw new RuntimeException("Cette facture ne peut plus être modifiée");
        }

        // Mise à jour des champs modifiables
        facture.setNomFournisseur(factureUpdate.getNomFournisseur());
        facture.setFormeJuridique(factureUpdate.getFormeJuridique());
        facture.setDateFacture(factureUpdate.getDateFacture());
        facture.setDateReception(factureUpdate.getDateReception());
        facture.setDateLivraison(factureUpdate.getDateLivraison());
        facture.setMontantHT(factureUpdate.getMontantHT());
        facture.setTauxTVA(factureUpdate.getTauxTVA());
        facture.setRasTVA(factureUpdate.getRasTVA());
        facture.setModalite(factureUpdate.getModalite());
        facture.setRefacturable(factureUpdate.getRefacturable());
        facture.setDesignation(factureUpdate.getDesignation());
        facture.setRefCommande(factureUpdate.getRefCommande());
        facture.setPeriode(factureUpdate.getPeriode());
        facture.setCommentaires(factureUpdate.getCommentaires());

        // Validation des nouveaux validateurs
        if (factureUpdate.getValidateur1() != null) {
            facture.setValidateur1(factureUpdate.getValidateur1());
        }
        if (factureUpdate.getValidateur2() != null) {
            facture.setValidateur2(factureUpdate.getValidateur2());
        }
        if (factureUpdate.getTresorier() != null) {
            facture.setTresorier(factureUpdate.getTresorier());
        }

        validateValidateurs(facture);

        return factureRepository.save(facture);
    }

    public void deleteFacture(Long id) {
        Facture facture = factureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        if (!facture.peutEtreModifiee()) {
            throw new RuntimeException("Cette facture ne peut plus être supprimée");
        }

        factureRepository.deleteById(id);
        log.info("Facture supprimée: {}", facture.getNumero());
    }

    // ===== WORKFLOW DE VALIDATION =====

    public Facture soumettreValidationV1(Long factureId, Long createurId) {
        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        if (!facture.getCreateur().getId().equals(createurId)) {
            throw new RuntimeException("Seul le créateur peut soumettre la facture");
        }

        if (facture.getStatut() != StatutFacture.SAISIE) {
            throw new RuntimeException("La facture doit être en statut SAISIE");
        }

        if (facture.getValidateur1() == null) {
            throw new RuntimeException("Aucun validateur V1 assigné");
        }

        facture.setStatut(StatutFacture.EN_VALIDATION_V1);
        Facture savedFacture = factureRepository.save(facture);

        // Créer trace de validation
        createValidationTrace(facture, facture.getCreateur(), StatutFacture.SAISIE,
                StatutFacture.EN_VALIDATION_V1, "Soumission pour validation V1", true, "U1");

        // Notification au validateur V1
        notificationService.notifierValidationV1(facture);

        log.info("Facture {} soumise pour validation V1 à {}",
                facture.getNumero(), facture.getValidateur1().getNomComplet());

        return savedFacture;
    }

    public Facture validerParV1(Long factureId, Long validateurId, String commentaire, boolean approuve) {
        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        User validateur = userRepository.findById(validateurId)
                .orElseThrow(() -> new RuntimeException("Validateur non trouvé"));

        if (!validateur.isValidateurV1()) {
            throw new RuntimeException("L'utilisateur n'est pas un validateur V1");
        }

        if (!facture.peutEtreValideeParV1()) {
            throw new RuntimeException("La facture ne peut pas être validée par V1 dans son état actuel");
        }

        if (!facture.getValidateur1().getId().equals(validateurId)) {
            throw new RuntimeException("Vous n'êtes pas le validateur assigné à cette facture");
        }

        StatutFacture ancienStatut = facture.getStatut();
        StatutFacture nouveauStatut;

        if (approuve) {
            if (facture.getValidateur2() == null) {
                throw new RuntimeException("Aucun validateur V2 assigné");
            }
            nouveauStatut = StatutFacture.EN_VALIDATION_V2;
            facture.setDateValidationV1(LocalDateTime.now());

            // Notification au validateur V2
            notificationService.notifierValidationV2(facture);
        } else {
            nouveauStatut = StatutFacture.REJETEE;
            facture.setSortOuStatut("Rejetée par V1: " + commentaire);

            // Notification au créateur
            notificationService.notifierRejet(facture, "V1", commentaire);
        }

        facture.setStatut(nouveauStatut);
        Facture savedFacture = factureRepository.save(facture);

        // Créer trace de validation
        createValidationTrace(facture, validateur, ancienStatut, nouveauStatut, commentaire, approuve, "V1");

        log.info("Facture {} {} par V1 {}", facture.getNumero(),
                approuve ? "validée" : "rejetée", validateur.getNomComplet());

        return savedFacture;
    }

    public Facture validerParV2(Long factureId, Long validateurId, String commentaire, boolean approuve) {
        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        User validateur = userRepository.findById(validateurId)
                .orElseThrow(() -> new RuntimeException("Validateur non trouvé"));

        if (!validateur.isValidateurV2()) {
            throw new RuntimeException("L'utilisateur n'est pas un validateur V2");
        }

        if (!facture.peutEtreValideeParV2()) {
            throw new RuntimeException("La facture ne peut pas être validée par V2 dans son état actuel");
        }

        if (!facture.getValidateur2().getId().equals(validateurId)) {
            throw new RuntimeException("Vous n'êtes pas le validateur assigné à cette facture");
        }

        StatutFacture ancienStatut = facture.getStatut();
        StatutFacture nouveauStatut;

        if (approuve) {
            nouveauStatut = StatutFacture.EN_TRESORERIE;
            facture.setDateValidationV2(LocalDateTime.now());

            // Assigner automatiquement un trésorier si pas déjà fait
            if (facture.getTresorier() == null) {
                User tresorier = assignerTresorierAutomatiquement();
                facture.setTresorier(tresorier);
            }

            // Notification au trésorier
            notificationService.notifierTresorerie(facture);
        } else {
            nouveauStatut = StatutFacture.REJETEE;
            facture.setSortOuStatut("Rejetée par V2: " + commentaire);

            // Notification au créateur
            notificationService.notifierRejet(facture, "V2", commentaire);
        }

        facture.setStatut(nouveauStatut);
        Facture savedFacture = factureRepository.save(facture);

        // Créer trace de validation
        createValidationTrace(facture, validateur, ancienStatut, nouveauStatut, commentaire, approuve, "V2");

        log.info("Facture {} {} par V2 {}", facture.getNumero(),
                approuve ? "validée" : "rejetée", validateur.getNomComplet());

        return savedFacture;
    }

    public Facture traiterParTresorier(Long factureId, Long tresorierIdId, String referencePaiement,
                                       LocalDate datePaiement, String commentaire) {
        Facture facture = factureRepository.findById(factureId)
                .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

        User tresorier = userRepository.findById(tresorierIdId)
                .orElseThrow(() -> new RuntimeException("Trésorier non trouvé"));

        if (!tresorier.isTresorier()) {
            throw new RuntimeException("L'utilisateur n'est pas un trésorier");
        }

        if (!facture.peutEtreTraiteeParTresorier()) {
            throw new RuntimeException("La facture ne peut pas être traitée par la trésorerie dans son état actuel");
        }

        StatutFacture ancienStatut = facture.getStatut();

        facture.setStatut(StatutFacture.PAYEE);
        facture.setReferencePaiement(referencePaiement);
        facture.setDatePaiement(datePaiement != null ? datePaiement : LocalDate.now());
        facture.setTresorier(tresorier);

        Facture savedFacture = factureRepository.save(facture);

        // Créer trace de validation
        createValidationTrace(facture, tresorier, ancienStatut, StatutFacture.PAYEE,
                commentaire, true, "T1");

        // Notification au créateur et validateurs
        notificationService.notifierPaiement(facture);

        log.info("Facture {} payée par trésorier {} - Référence: {}",
                facture.getNumero(), tresorier.getNomComplet(), referencePaiement);

        return savedFacture;
    }

    // ===== RECHERCHES SPÉCIALISÉES =====

    public List<Facture> getFacturesParCreateur(Long createurId) {
        User createur = userRepository.findById(createurId)
                .orElseThrow(() -> new RuntimeException("Créateur non trouvé"));
        return factureRepository.findByCreateurOrderByDateCreationDesc(createur);
    }

    public List<Facture> getFacturesEnAttenteV1(Long validateur1Id) {
        User validateur = userRepository.findById(validateur1Id)
                .orElseThrow(() -> new RuntimeException("Validateur non trouvé"));
        return factureRepository.findFacturesEnAttenteV1(validateur);
    }

    public List<Facture> getFacturesEnAttenteV2(Long validateur2Id) {
        User validateur = userRepository.findById(validateur2Id)
                .orElseThrow(() -> new RuntimeException("Validateur non trouvé"));
        return factureRepository.findFacturesEnAttenteV2(validateur);
    }

    public List<Facture> getFacturesEnAttenteTresorerie(Long tresorierIdId) {
        User tresorier = userRepository.findById(tresorierIdId)
                .orElseThrow(() -> new RuntimeException("Trésorier non trouvé"));
        return factureRepository.findFacturesEnAttenteTresorerie(tresorier);
    }

    public List<Facture> getFacturesEnAttenteForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        return factureRepository.findFacturesEnAttenteForUser(user);
    }

    public List<Facture> getFacturesUrgentes() {
        LocalDate dateActuelle = LocalDate.now();
        LocalDate dateLimite = dateActuelle.plusDays(7);
        return factureRepository.findFacturesUrgentes(dateActuelle, dateLimite);
    }

    public List<Facture> getFacturesEnRetard() {
        return factureRepository.findFacturesEnRetard(LocalDate.now());
    }

    public List<Facture> getFacturesParStatut(StatutFacture statut) {
        return factureRepository.findByStatutOrderByDateCreationDesc(statut);
    }

    // ===== MÉTHODES UTILITAIRES PRIVÉES =====

    private void validateValidateurs(Facture facture) {
        if (facture.getValidateur1() != null && !facture.getValidateur1().isValidateurV1()) {
            throw new RuntimeException("Le validateur 1 doit avoir le rôle V1");
        }

        if (facture.getValidateur2() != null && !facture.getValidateur2().isValidateurV2()) {
            throw new RuntimeException("Le validateur 2 doit avoir le rôle V2");
        }

        if (facture.getTresorier() != null && !facture.getTresorier().isTresorier()) {
            throw new RuntimeException("Le trésorier doit avoir le rôle T1");
        }

        if (facture.getValidateur1() != null && facture.getValidateur2() != null &&
                facture.getValidateur1().getId().equals(facture.getValidateur2().getId())) {
            throw new RuntimeException("Les validateurs V1 et V2 doivent être différents");
        }
    }

    private String generateNumeroFacture() {
        String prefix = "FACT-" + LocalDate.now().getYear() + "-";

        // Trouver le dernier numéro de l'année
        LocalDate debutAnnee = LocalDate.of(LocalDate.now().getYear(), 1, 1);
        LocalDate finAnnee = LocalDate.of(LocalDate.now().getYear(), 12, 31);

        List<Facture> facturesAnnee = factureRepository.findByDateFactureBetween(debutAnnee, finAnnee);

        int prochainNumero = facturesAnnee.size() + 1;

        return prefix + String.format("%04d", prochainNumero);
    }

    private User assignerTresorierAutomatiquement() {
        List<User> tresoriers = userRepository.findTresoriersActifs();

        if (tresoriers.isEmpty()) {
            throw new RuntimeException("Aucun trésorier actif disponible");
        }

        // Sélectionner le trésorier avec le moins de factures en cours
        return tresoriers.stream()
                .min((t1, t2) -> Integer.compare(
                        factureRepository.findFacturesEnAttenteTresorerie(t1).size(),
                        factureRepository.findFacturesEnAttenteTresorerie(t2).size()
                ))
                .orElse(tresoriers.get(0));
    }

    private void createValidationTrace(Facture facture, User utilisateur, StatutFacture statutPrecedent,
                                       StatutFacture statutNouveau, String commentaire, boolean approuve,
                                       String niveauValidation) {
        ValidationFacture validation = ValidationFacture.builder()
                .facture(facture)
                .utilisateur(utilisateur)
                .statutPrecedent(statutPrecedent)
                .statutNouveau(statutNouveau)
                .commentaire(commentaire)
                .approuve(approuve)
                .niveauValidation(niveauValidation)
                .build();

        validationRepository.save(validation);
    }

    // ===== STATISTIQUES =====

    public long countFacturesParStatut(StatutFacture statut) {
        return factureRepository.countByStatut(statut);
    }

    public Object[] getStatistiquesFacturesParCreateur(Long createurId) {
        User createur = userRepository.findById(createurId)
                .orElseThrow(() -> new RuntimeException("Créateur non trouvé"));
        return factureRepository.getStatistiquesFacturesParCreateur(createur);
    }

    public List<Object[]> getTopFournisseurs() {
        return factureRepository.getTopFournisseursParNombreFactures();
    }

    public List<Object[]> getPerformanceValidateursV1() {
        return factureRepository.getPerformanceValidateursV1();
    }

    public List<Object[]> getPerformanceValidateursV2() {
        return factureRepository.getPerformanceValidateursV2();
    }
}
