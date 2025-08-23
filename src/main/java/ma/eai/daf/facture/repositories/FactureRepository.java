package ma.eai.daf.facture.repositories;

import ma.eai.daf.facture.entities.Facture;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.StatutFacture;
import ma.eai.daf.facture.enums.ModaliteType;
import ma.eai.daf.facture.enums.FormeJuridiqueType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {

    // ===== RECHERCHE PAR STATUT =====
    List<Facture> findByStatut(StatutFacture statut);

    List<Facture> findByStatutOrderByDateCreationDesc(StatutFacture statut);

    @Query("SELECT COUNT(f) FROM Facture f WHERE f.statut = :statut")
    long countByStatut(@Param("statut") StatutFacture statut);

    // ===== RECHERCHE PAR UTILISATEURS =====

    // Factures créées par un utilisateur
    List<Facture> findByCreateur(User createur);

    List<Facture> findByCreateurOrderByDateCreationDesc(User createur);

    @Query("SELECT COUNT(f) FROM Facture f WHERE f.createur = :createur")
    long countByCreateur(@Param("createur") User createur);

    // Factures assignées à un validateur V1
    List<Facture> findByValidateur1(User validateur1);

    List<Facture> findByValidateur1OrderByDateCreationDesc(User validateur1);

    /**
     * Factures en attente V1 pour un validateur spécifique
     * REQUÊTE CORRIGÉE
     */
    @Query("SELECT f FROM Facture f WHERE f.statut = 'EN_VALIDATION_V1' AND " +
            "(f.validateur1 = :validateur OR f.validateur1 IS NULL) " +
            "ORDER BY f.dateCreation DESC")
    List<Facture> findFacturesEnAttenteV1(@Param("validateur") User validateur);

    /**
     * Factures en attente V2 pour un validateur spécifique
     * REQUÊTE CORRIGÉE
     */
    @Query("SELECT f FROM Facture f WHERE f.statut = 'EN_VALIDATION_V2' AND " +
            "(f.validateur2 = :validateur OR f.validateur2 IS NULL) " +
            "ORDER BY f.dateCreation DESC")
    List<Facture> findFacturesEnAttenteV2(@Param("validateur") User validateur);

    // Factures assignées à un validateur V2
    List<Facture> findByValidateur2(User validateur2);

    List<Facture> findByValidateur2OrderByDateCreationDesc(User validateur2);


    // Factures assignées à un trésorier
    List<Facture> findByTresorier(User tresorier);

    List<Facture> findByTresorierOrderByDateCreationDesc(User tresorier);

    /**
     * Factures en attente trésorerie pour un trésorier spécifique
     * REQUÊTE CORRIGÉE avec gestion nullable
     */
    @Query("SELECT f FROM Facture f WHERE f.statut = 'EN_TRESORERIE' AND " +
            "(f.tresorier = :tresorier OR f.tresorier IS NULL) " +
            "ORDER BY f.dateCreation DESC")
    List<Facture> findFacturesEnAttenteTresorerie(@Param("tresorier") User tresorier);
    /**
     * Toutes les factures en attente trésorerie (sans filtre par trésorier)
     */
    @Query("SELECT f FROM Facture f WHERE f.statut = 'EN_TRESORERIE' " +
            "ORDER BY f.dateCreation DESC")
    List<Facture> findToutesFacturesEnAttenteTresorerie();
    // ===== RECHERCHE PAR COMBINAISONS STATUT/UTILISATEUR =====

    List<Facture> findByStatutAndCreateur(StatutFacture statut, User createur);

    List<Facture> findByStatutAndValidateur1(StatutFacture statut, User validateur1);

    List<Facture> findByStatutAndValidateur2(StatutFacture statut, User validateur2);

    List<Facture> findByStatutAndTresorier(StatutFacture statut, User tresorier);

    // ===== RECHERCHE PAR NUMÉRO =====

    Optional<Facture> findByNumero(String numero);

    boolean existsByNumero(String numero);

    // ===== RECHERCHE PAR DATES =====

    @Query("SELECT f FROM Facture f WHERE f.dateFacture BETWEEN :dateDebut AND :dateFin")
    List<Facture> findByDateFactureBetween(@Param("dateDebut") LocalDate dateDebut,
                                           @Param("dateFin") LocalDate dateFin);

    @Query("SELECT f FROM Facture f WHERE f.dateEcheance BETWEEN :dateDebut AND :dateFin")
    List<Facture> findByDateEcheanceBetween(@Param("dateDebut") LocalDate dateDebut,
                                            @Param("dateFin") LocalDate dateFin);

    @Query("SELECT f FROM Facture f WHERE f.dateCreation BETWEEN :dateDebut AND :dateFin")
    List<Facture> findByDateCreationBetween(@Param("dateDebut") LocalDateTime dateDebut,
                                            @Param("dateFin") LocalDateTime dateFin);

    // Factures arrivant à échéance
    @Query("SELECT f FROM Facture f WHERE f.dateEcheance BETWEEN :dateDebut AND :dateFin AND f.statut != 'PAYEE'")
    List<Facture> findFacturesEcheanceProche(@Param("dateDebut") LocalDate dateDebut,
                                             @Param("dateFin") LocalDate dateFin);

    // Factures en retard
    @Query("SELECT f FROM Facture f WHERE f.dateEcheance < :dateActuelle AND f.statut != 'PAYEE'")
    List<Facture> findFacturesEnRetard(@Param("dateActuelle") LocalDate dateActuelle);

    // ===== RECHERCHE PAR FOURNISSEUR =====

    List<Facture> findByNomFournisseurContainingIgnoreCase(String nomFournisseur);

    List<Facture> findByFormeJuridique(FormeJuridiqueType formeJuridique);

    @Query("SELECT f FROM Facture f WHERE " +
            "(:nomFournisseur IS NULL OR LOWER(f.nomFournisseur) LIKE LOWER(CONCAT('%', :nomFournisseur, '%'))) AND " +
            "(:formeJuridique IS NULL OR f.formeJuridique = :formeJuridique)")
    List<Facture> findByFournisseurAndFormeJuridique(@Param("nomFournisseur") String nomFournisseur,
                                                     @Param("formeJuridique") FormeJuridiqueType formeJuridique);

    // ===== RECHERCHE PAR MODALITÉ =====

    List<Facture> findByModalite(ModaliteType modalite);

    @Query("SELECT f FROM Facture f WHERE f.modalite = :modalite")
    List<Facture> findByModaliteType(@Param("modalite") ModaliteType modalite);

    // ===== RECHERCHES COMPLEXES =====

    // Factures en attente pour un utilisateur (toutes ses responsabilités)
    @Query("SELECT f FROM Facture f WHERE " +
            "(f.statut = 'EN_VALIDATION_V1' AND f.validateur1 = :user) OR " +
            "(f.statut = 'EN_VALIDATION_V2' AND f.validateur2 = :user) OR " +
            "(f.statut = 'EN_TRESORERIE' AND f.tresorier = :user)")
    List<Facture> findFacturesEnAttenteForUser(@Param("user") User user);

    // Recherche avancée avec filtres multiples
    @Query("SELECT f FROM Facture f WHERE " +
            "(:statut IS NULL OR f.statut = :statut) AND " +
            "(:createurId IS NULL OR f.createur.id = :createurId) AND " +
            "(:validateur1Id IS NULL OR f.validateur1.id = :validateur1Id) AND " +
            "(:validateur2Id IS NULL OR f.validateur2.id = :validateur2Id) AND " +
            "(:tresorierIdId IS NULL OR f.tresorier.id = :tresorierIdId) AND " +
            "(:nomFournisseur IS NULL OR LOWER(f.nomFournisseur) LIKE LOWER(CONCAT('%', :nomFournisseur, '%'))) AND " +
            "(:dateDebut IS NULL OR f.dateFacture >= :dateDebut) AND " +
            "(:dateFin IS NULL OR f.dateFacture <= :dateFin) AND " +
            "(:modalite IS NULL OR f.modalite = :modalite)")
    List<Facture> findFacturesWithFilters(@Param("statut") StatutFacture statut,
                                          @Param("createurId") Long createurId,
                                          @Param("validateur1Id") Long validateur1Id,
                                          @Param("validateur2Id") Long validateur2Id,
                                          @Param("tresorierIdId") Long tresorierIdId,
                                          @Param("nomFournisseur") String nomFournisseur,
                                          @Param("dateDebut") LocalDate dateDebut,
                                          @Param("dateFin") LocalDate dateFin,
                                          @Param("modalite") ModaliteType modalite);

    // ===== STATISTIQUES AVANCÉES =====

    // Tableau de bord pour un utilisateur
    @Query("SELECT " +
            "COUNT(CASE WHEN f.statut = 'SAISIE' THEN 1 END) as enSaisie, " +
            "COUNT(CASE WHEN f.statut = 'EN_VALIDATION_V1' THEN 1 END) as enValidationV1, " +
            "COUNT(CASE WHEN f.statut = 'EN_VALIDATION_V2' THEN 1 END) as enValidationV2, " +
            "COUNT(CASE WHEN f.statut = 'EN_TRESORERIE' THEN 1 END) as enTresorerie, " +
            "COUNT(CASE WHEN f.statut = 'VALIDEE' THEN 1 END) as validees, " +
            "COUNT(CASE WHEN f.statut = 'PAYEE' THEN 1 END) as payees, " +
            "COUNT(CASE WHEN f.statut = 'REJETEE' THEN 1 END) as rejetees " +
            "FROM Facture f WHERE f.createur = :user")
    Object[] getStatistiquesFacturesParCreateur(@Param("user") User user);

    // Factures urgentes (échéance dans les 7 jours)
    @Query("SELECT f FROM Facture f WHERE " +
            "f.dateEcheance BETWEEN :dateActuelle AND :dateLimite AND " +
            "f.statut IN ('EN_VALIDATION_V1', 'EN_VALIDATION_V2', 'EN_TRESORERIE')")
    List<Facture> findFacturesUrgentes(@Param("dateActuelle") LocalDate dateActuelle,
                                       @Param("dateLimite") LocalDate dateLimite);

    // Top fournisseurs par nombre de factures
    @Query("SELECT f.nomFournisseur, COUNT(f) as nombreFactures, SUM(f.montantTTC) as montantTotal " +
            "FROM Facture f " +
            "GROUP BY f.nomFournisseur " +
            "ORDER BY COUNT(f) DESC")
    List<Object[]> getTopFournisseursParNombreFactures();

    // Performance des validateurs
    @Query("SELECT u.nom, u.prenom, COUNT(f) as nombreValidations " +
            "FROM User u LEFT JOIN u.facturesValideesN1 f " +
            "WHERE u.role = 'V1' " +
            "GROUP BY u.id, u.nom, u.prenom " +
            "ORDER BY COUNT(f) DESC")
    List<Object[]> getPerformanceValidateursV1();

    @Query("SELECT u.nom, u.prenom, COUNT(f) as nombreValidations " +
            "FROM User u LEFT JOIN u.facturesValideesN2 f " +
            "WHERE u.role = 'V2' " +
            "GROUP BY u.id, u.nom, u.prenom " +
            "ORDER BY COUNT(f) DESC")
    List<Object[]> getPerformanceValidateursV2();
    /**
     * Statistiques pour le tableau de bord trésorerie
     */
    @Query("SELECT " +
            "COUNT(CASE WHEN f.statut = 'EN_TRESORERIE' THEN 1 END) as enAttente, " +
            "COUNT(CASE WHEN f.statut = 'EN_TRESORERIE' AND f.dateEcheance <= :dateLimiteUrgent THEN 1 END) as urgent, " +
            "COALESCE(SUM(CASE WHEN f.statut = 'EN_TRESORERIE' THEN f.montantTTC ELSE 0 END), 0) as montantTotal, " +
            "COUNT(CASE WHEN f.statut = 'PAYEE' AND f.datePaiement >= :debutMois THEN 1 END) as traitees " +
            "FROM Facture f")
    Object[] getStatistiquesTresorerie(@Param("dateLimiteUrgent") LocalDate dateLimiteUrgent,
                                       @Param("debutMois") LocalDate debutMois);

    /**
     * Factures par montant pour la trésorerie (pour priorisation)
     */
    @Query("SELECT f FROM Facture f WHERE f.statut = 'EN_TRESORERIE' AND " +
            "f.montantTTC >= :montantMin " +
            "ORDER BY f.montantTTC DESC, f.dateEcheance ASC")
    List<Facture> findFacturesTresorerieParMontant(@Param("montantMin") BigDecimal montantMin);

    /**
     * Recherche de factures pour la trésorerie avec filtres
     */
    @Query("SELECT f FROM Facture f WHERE f.statut = 'EN_TRESORERIE' AND " +
            "(:recherche IS NULL OR " +
            " LOWER(f.numero) LIKE LOWER(CONCAT('%', :recherche, '%')) OR " +
            " LOWER(f.nomFournisseur) LIKE LOWER(CONCAT('%', :recherche, '%'))) AND " +
            "(:montantMin IS NULL OR f.montantTTC >= :montantMin) AND " +
            "(:montantMax IS NULL OR f.montantTTC <= :montantMax) AND " +
            "(:dateEcheanceDebut IS NULL OR f.dateEcheance >= :dateEcheanceDebut) AND " +
            "(:dateEcheanceFin IS NULL OR f.dateEcheance <= :dateEcheanceFin) AND " +
            "(:urgentesOnly = false OR f.dateEcheance <= :dateLimiteUrgent) " +
            "ORDER BY f.dateEcheance ASC, f.dateCreation DESC")
    List<Facture> findFacturesTresorerieAvecFiltres(@Param("recherche") String recherche,
                                                    @Param("montantMin") BigDecimal montantMin,
                                                    @Param("montantMax") BigDecimal montantMax,
                                                    @Param("dateEcheanceDebut") LocalDate dateEcheanceDebut,
                                                    @Param("dateEcheanceFin") LocalDate dateEcheanceFin,
                                                    @Param("urgentesOnly") boolean urgentesOnly,
                                                    @Param("dateLimiteUrgent") LocalDate dateLimiteUrgent);

    /**
     * Performance des trésoriers (nombre de factures traitées)
     */
    @Query("SELECT u.nom, u.prenom, COUNT(f) as nombrePaiements, " +
            "COALESCE(SUM(f.montantTTC), 0) as montantTotal " +
            "FROM User u LEFT JOIN u.facturesTraitees f " +
            "WHERE u.role = 'T1' AND u.actif = true AND " +
            "(f.datePaiement IS NULL OR f.datePaiement >= :dateDebut) " +
            "GROUP BY u.id, u.nom, u.prenom " +
            "ORDER BY COUNT(f) DESC")
    List<Object[]> getPerformanceTresoriers(@Param("dateDebut") LocalDate dateDebut);

    /**
     * Top fournisseurs par montant en attente trésorerie
     */
    @Query("SELECT f.nomFournisseur, COUNT(f) as nombreFactures, " +
            "COALESCE(SUM(f.montantTTC), 0) as montantTotal " +
            "FROM Facture f " +
            "WHERE f.statut = 'EN_TRESORERIE' " +
            "GROUP BY f.nomFournisseur " +
            "ORDER BY SUM(f.montantTTC) DESC")
    List<Object[]> getTopFournisseursEnAttenteTresorerie();

    /**
     * Évolution des paiements par mois
     */
    @Query("SELECT " +
            "YEAR(f.datePaiement) as annee, " +
            "MONTH(f.datePaiement) as mois, " +
            "COUNT(f) as nombrePaiements, " +
            "COALESCE(SUM(f.montantTTC), 0) as montantTotal " +
            "FROM Facture f " +
            "WHERE f.statut = 'PAYEE' AND f.datePaiement >= :dateDebut " +
            "GROUP BY YEAR(f.datePaiement), MONTH(f.datePaiement) " +
            "ORDER BY YEAR(f.datePaiement) DESC, MONTH(f.datePaiement) DESC")
    List<Object[]> getEvolutionPaiementsParMois(@Param("dateDebut") LocalDate dateDebut);

    /**
     * Délai moyen de paiement
     */
    @Query("SELECT AVG(EXTRACT(DAY FROM (f.datePaiement - f.dateValidationV2))) as delaiMoyen " +
            "FROM Facture f " +
            "WHERE f.statut = 'PAYEE' AND f.datePaiement IS NOT NULL AND f.dateValidationV2 IS NOT NULL " +
            "AND f.datePaiement >= :dateDebut")
    Double getDelaiMoyenPaiement(@Param("dateDebut") LocalDate dateDebut);

    /**
     * Factures avec pièces jointes pour la trésorerie
     */
    @Query("SELECT f FROM Facture f WHERE f.statut = 'EN_TRESORERIE' AND " +
            "f.pieceJointeNom IS NOT NULL " +
            "ORDER BY f.dateCreation DESC")
    List<Facture> findFacturesTresorerieAvecPiecesJointes();

    /**
     * Vérification si une facture peut être payée
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END " +
            "FROM Facture f " +
            "WHERE f.id = :factureId AND f.statut = 'EN_TRESORERIE'")
    boolean peutEtrePayee(@Param("factureId") Long factureId);

    /**
     * Factures assignées à un trésorier spécifique
     */
    @Query("SELECT f FROM Facture f WHERE f.tresorier = :tresorier AND " +
            "f.statut IN ('EN_TRESORERIE', 'PAYEE') " +
            "ORDER BY f.dateCreation DESC")
    List<Facture> findFacturesAssigneesAuTresorier(@Param("tresorier") User tresorier);

    /**
     * Nombre de factures en attente par trésorier
     */
    @Query("SELECT u.id, u.nom, u.prenom, COUNT(f) as nombreEnAttente " +
            "FROM User u LEFT JOIN u.facturesTraitees f " +
            "WHERE u.role = 'T1' AND u.actif = true AND " +
            "(f.statut IS NULL OR f.statut = 'EN_TRESORERIE') " +
            "GROUP BY u.id, u.nom, u.prenom " +
            "ORDER BY COUNT(f) ASC")
    List<Object[]> getNombreFacturesParTresorier();
    /**
     * Données pour export trésorerie
     */
    @Query("SELECT f.numero, f.nomFournisseur, f.designation, f.montantHT, f.montantTTC, " +
            "f.dateFacture, f.dateEcheance, f.dateValidationV2, " +
            "f.createur.nom, f.createur.prenom, " +
            "f.validateur1.nom, f.validateur1.prenom, " +
            "f.validateur2.nom, f.validateur2.prenom " +
            "FROM Facture f " +
            "WHERE f.statut = 'EN_TRESORERIE' " +
            "ORDER BY f.dateEcheance ASC, f.dateCreation DESC")
    List<Object[]> getDonneesExportTresorerie();

    // ===== REQUÊTES DE NETTOYAGE =====

    /**
     * Factures orphelines (sans trésorier assigné)
     */
    @Query("SELECT f FROM Facture f WHERE f.statut = 'EN_TRESORERIE' AND f.tresorier IS NULL")
    List<Facture> findFacturesOrphelinesTresorerie();

}