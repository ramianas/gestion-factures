package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.dto.FactureCreateDto;
import ma.eai.daf.facture.dto.FactureUpdateDto;
import ma.eai.daf.facture.dto.ValidationDto;
import ma.eai.daf.facture.entities.Facture;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.StatutFacture;
import ma.eai.daf.facture.services.FactureService;
import ma.eai.daf.facture.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/factures")
@RequiredArgsConstructor
public class FactureController {

    private final FactureService factureService;
    private final UserService userService;

    // ===== ENDPOINTS POUR U1 (Saisie) =====

    @GetMapping("/donnees-reference")
    @PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<Map<String, Object>> getDonneesReferenceSaisie() {
        Map<String, Object> donnees = Map.of(
                "validateursV1", userService.getValidateursV1().stream()
                        .map(this::mapUserForSelection)
                        .toList(),
                "validateursV2", userService.getValidateursV2().stream()
                        .map(this::mapUserForSelection)
                        .toList(),
                "tresoriers", userService.getTresoriers().stream()
                        .map(this::mapUserForSelection)
                        .toList()
        );
        return ResponseEntity.ok(donnees);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<Map<String, Object>> createFacture(
            @Valid @RequestBody FactureCreateDto factureDto,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);

            // Conversion DTO vers entité
            Facture facture = convertCreateDtoToEntity(factureDto);

            Facture savedFacture = factureService.createFacture(facture, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture créée avec succès",
                    "factureId", savedFacture.getId(),
                    "numero", savedFacture.getNumero()
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/mes-factures")
    @PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<List<Map<String, Object>>> getMesFactures(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<Facture> factures = factureService.getFacturesParCreateur(userId);

        List<Map<String, Object>> result = factures.stream()
                .map(this::mapFactureToDto)
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/soumettre-v1")
    @PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<Map<String, Object>> soumettreValidationV1(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            factureService.soumettreValidationV1(id, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture soumise pour validation V1"
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ===== ENDPOINTS POUR V1 (Validation Niveau 1) =====

    @GetMapping("/en-attente-v1")
    @PreAuthorize("hasAuthority('ROLE_V1')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesEnAttenteV1(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<Facture> factures = factureService.getFacturesEnAttenteV1(userId);

        List<Map<String, Object>> result = factures.stream()
                .map(this::mapFactureToDto)
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/valider-v1")
    @PreAuthorize("hasAuthority('ROLE_V1')")
    public ResponseEntity<Map<String, Object>> validerParV1(
            @PathVariable Long id,
            @Valid @RequestBody ValidationDto validationDto,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            factureService.validerParV1(id, userId, validationDto.getCommentaire(), validationDto.isApprouve());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", validationDto.isApprouve() ? "Facture validée par V1" : "Facture rejetée par V1"
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ===== ENDPOINTS POUR V2 (Validation Niveau 2) =====

    @GetMapping("/en-attente-v2")
    @PreAuthorize("hasAuthority('ROLE_V2')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesEnAttenteV2(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<Facture> factures = factureService.getFacturesEnAttenteV2(userId);

        List<Map<String, Object>> result = factures.stream()
                .map(this::mapFactureToDto)
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/valider-v2")
    @PreAuthorize("hasAuthority('ROLE_V2')")
    public ResponseEntity<Map<String, Object>> validerParV2(
            @PathVariable Long id,
            @Valid @RequestBody ValidationDto validationDto,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            factureService.validerParV2(id, userId, validationDto.getCommentaire(), validationDto.isApprouve());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", validationDto.isApprouve() ? "Facture validée par V2" : "Facture rejetée par V2"
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ===== ENDPOINTS POUR T1 (Trésorerie) =====

    @GetMapping("/en-attente-tresorerie")
    @PreAuthorize("hasAuthority('ROLE_T1')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesEnAttenteTresorerie(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<Facture> factures = factureService.getFacturesEnAttenteTresorerie(userId);

        List<Map<String, Object>> result = factures.stream()
                .map(this::mapFactureToDto)
                .toList();

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/payer")
    @PreAuthorize("hasAuthority('ROLE_T1')")
    public ResponseEntity<Map<String, Object>> payerFacture(
            @PathVariable Long id,
            @Valid @RequestBody Map<String, Object> paiementData,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            String referencePaiement = (String) paiementData.get("referencePaiement");
            String commentaire = (String) paiementData.get("commentaire");

            factureService.traiterParTresorier(id, userId, referencePaiement, null, commentaire);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture payée avec succès"
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ===== ENDPOINTS COMMUNS =====

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getFactureById(@PathVariable Long id) {
        return factureService.getFactureById(id)
                .map(facture -> ResponseEntity.ok(mapFactureToDetailDto(facture)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/mes-taches")
    @PreAuthorize("hasAnyAuthority('ROLE_V1', 'ROLE_V2', 'ROLE_T1')")
    public ResponseEntity<List<Map<String, Object>>> getMesTaches(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<Facture> factures = factureService.getFacturesEnAttenteForUser(userId);

        List<Map<String, Object>> result = factures.stream()
                .map(this::mapFactureToDto)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/urgentes")
    @PreAuthorize("hasAnyAuthority('ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesUrgentes() {
        List<Facture> factures = factureService.getFacturesUrgentes();

        List<Map<String, Object>> result = factures.stream()
                .map(this::mapFactureToDto)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/en-retard")
    @PreAuthorize("hasAnyAuthority('ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesEnRetard() {
        List<Facture> factures = factureService.getFacturesEnRetard();

        List<Map<String, Object>> result = factures.stream()
                .map(this::mapFactureToDto)
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/tableau-bord")
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getTableauBord(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);

        Map<String, Object> tableau = Map.of(
                "facturesEnSaisie", factureService.countFacturesParStatut(StatutFacture.SAISIE),
                "facturesEnValidationV1", factureService.countFacturesParStatut(StatutFacture.EN_VALIDATION_V1),
                "facturesEnValidationV2", factureService.countFacturesParStatut(StatutFacture.EN_VALIDATION_V2),
                "facturesEnTresorerie", factureService.countFacturesParStatut(StatutFacture.EN_TRESORERIE),
                "facturesValidees", factureService.countFacturesParStatut(StatutFacture.VALIDEE),
                "facturesPayees", factureService.countFacturesParStatut(StatutFacture.PAYEE),
                "facturesRejetees", factureService.countFacturesParStatut(StatutFacture.REJETEE),
                "mesTaches", factureService.getFacturesEnAttenteForUser(userId).size(),
                "facturesUrgentes", factureService.getFacturesUrgentes().size(),
                "facturesEnRetard", factureService.getFacturesEnRetard().size()
        );

        return ResponseEntity.ok(tableau);
    }

    // ===== MÉTHODES UTILITAIRES =====

    private Long getCurrentUserId(Authentication authentication) {
        // TODO: Implémenter la récupération de l'ID utilisateur depuis l'authentification
        // Pour l'instant, retourner un ID fictif
        String email = authentication.getName();
        return userService.getUserByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    private Map<String, Object> mapUserForSelection(User user) {
        return Map.of(
                "id", user.getId(),
                "nomComplet", user.getNomComplet(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        );
    }

    private Map<String, Object> mapFactureToDto(Facture facture) {
        return Map.of(
                "id", facture.getId(),
                "numero", facture.getNumero() != null ? facture.getNumero() : "",
                "nomFournisseur", facture.getNomFournisseur(),
                "montantTTC", facture.getMontantTTC() != null ? facture.getMontantTTC() : 0,
                "dateFacture", facture.getDateFacture() != null ? facture.getDateFacture().toString() : "",
                "dateEcheance", facture.getDateEcheance() != null ? facture.getDateEcheance().toString() : "",
                "statut", facture.getStatut().name(),
                "createurNom", facture.getCreateur().getNomComplet(),
                "joursAvantEcheance", facture.getJoursAvantEcheance(),
                "estEnRetard", facture.estEnRetard()
        );
    }

    private Map<String, Object> mapFactureToDetailDto(Facture facture) {
        Map<String, Object> result = Map.ofe(
                "id", facture.getId(),
                "numero", facture.getNumero() != null ? facture.getNumero() : "",
                "nomFournisseur", facture.getNomFournisseur(),
                "formeJuridique", facture.getFormeJuridique() != null ? facture.getFormeJuridique().name() : null,
                "dateFacture", facture.getDateFacture() != null ? facture.getDateFacture().toString() : "",
                "dateReception", facture.getDateReception() != null ? facture.getDateReception().toString() : "",
                "dateEcheance", facture.getDateEcheance() != null ? facture.getDateEcheance().toString() : "",
                "dateLivraison", facture.getDateLivraison() != null ? facture.getDateLivraison().toString() : "",
                "montantHT", facture.getMontantHT() != null ? facture.getMontantHT() : 0,
                "tauxTVA", facture.getTauxTVA() != null ? facture.getTauxTVA() : 0,
                "montantTVA", facture.getMontantTVA() != null ? facture.getMontantTVA() : 0,
                "montantTTC", facture.getMontantTTC() != null ? facture.getMontantTTC() : 0,
                "rasTVA", facture.getRasTVA() != null ? facture.getRasTVA() : 0,
                "modalite", facture.getModalite() != null ? facture.getModalite().name() : null,
                "refacturable", facture.getRefacturable() != null ? facture.getRefacturable() : false,
                "designation", facture.getDesignation() != null ? facture.getDesignation() : "",
                "refCommande", facture.getRefCommande() != null ? facture.getRefCommande() : "",
                "periode", facture.getPeriode() != null ? facture.getPeriode() : "",
                "statut", facture.getStatut().name(),
                "dateCreation", facture.getDateCreation() != null ? facture.getDateCreation().toString() : "",
                "dateModification", facture.getDateModification() != null ? facture.getDateModification().toString() : "",
                "commentaires", facture.getCommentaires() != null ? facture.getCommentaires() : "",
                "createur", facture.getCreateur() != null ? mapUserForSelection(facture.getCreateur()) : null,
                "validateur1", facture.getValidateur1() != null ? mapUserForSelection(facture.getValidateur1()) : null,
                "validateur2", facture.getValidateur2() != null ? mapUserForSelection(facture.getValidateur2()) : null,
                "tresorier", facture.getTresorier() != null ? mapUserForSelection(facture.getTresorier()) : null,
                "dateValidationV1", facture.getDateValidationV1() != null ? facture.getDateValidationV1().toString() : "",
                "dateValidationV2", facture.getDateValidationV2() != null ? facture.getDateValidationV2().toString() : "",
                "referencePaiement", facture.getReferencePaiement() != null ? facture.getReferencePaiement() : "",
                "datePaiement", facture.getDatePaiement() != null ? facture.getDatePaiement().toString() : "",
                "joursAvantEcheance", facture.getJoursAvantEcheance(),
                "estEnRetard", facture.estEnRetard(),
                "peutEtreModifiee", facture.peutEtreModifiee(),
                "peutEtreValideeParV1", facture.peutEtreValideeParV1(),
                "peutEtreValideeParV2", facture.peutEtreValideeParV2(),
                "peutEtreTraiteeParTresorier", facture.peutEtreTraiteeParTresorier()
        );

        return result;
    }

    private Facture convertCreateDtoToEntity(FactureCreateDto dto) {
        Facture facture = new Facture();

        facture.setNomFournisseur(dto.getNomFournisseur());
        facture.setFormeJuridique(dto.getFormeJuridique());
        facture.setDateFacture(dto.getDateFacture());
        facture.setDateReception(dto.getDateReception());
        facture.setDateLivraison(dto.getDateLivraison());
        facture.setMontantHT(dto.getMontantHT());
        facture.setTauxTVA(dto.getTauxTVA());
        facture.setRasTVA(dto.getRasTVA());
        facture.setModalite(dto.getModalite());
        facture.setRefacturable(dto.getRefacturable());
        facture.setDesignation(dto.getDesignation());
        facture.setRefCommande(dto.getRefCommande());
        facture.setPeriode(dto.getPeriode());
        facture.setNumero(dto.getNumero());
        facture.setCommentaires(dto.getCommentaires());

        // Assignation des validateurs
        if (dto.getValidateur1Id() != null) {
            User validateur1 = userService.getUserById(dto.getValidateur1Id())
                    .orElseThrow(() -> new RuntimeException("Validateur V1 non trouvé"));
            facture.setValidateur1(validateur1);
        }

        if (dto.getValidateur2Id() != null) {
            User validateur2 = userService.getUserById(dto.getValidateur2Id())
                    .orElseThrow(() -> new RuntimeException("Validateur V2 non trouvé"));
            facture.setValidateur2(validateur2);
        }

        if (dto.getTresorierIdId() != null) {
            User tresorier = userService.getUserById(dto.getTresorierIdId())
                    .orElseThrow(() -> new RuntimeException("Trésorier non trouvé"));
            facture.setTresorier(tresorier);
        }

        return facture;
    }
}