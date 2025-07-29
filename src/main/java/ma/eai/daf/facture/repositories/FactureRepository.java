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

    // ✅ CORRIGER
    @Query("SELECT f FROM Facture f WHERE f.validateur1 = :validateur AND f.statut = 'EN_VALIDATION_V1'")
    List<Facture> findFacturesEnAttenteV1(@Param("validateur") User validateur);

    @Query("SELECT f FROM Facture f WHERE f.validateur2 = :validateur AND f.statut = 'EN_VALIDATION_V2'")
    List<Facture> findFacturesEnAttenteV2(@Param("validateur") User validateur);

    // Factures assignées à un validateur V2
    List<Facture> findByValidateur2(User validateur2);

    List<Facture> findByValidateur2OrderByDateCreationDesc(User validateur2);


    // Factures assignées à un trésorier
    List<Facture> findByTresorier(User tresorier);

    List<Facture> findByTresorierOrderByDateCreationDesc(User tresorier);

    @Query("SELECT f FROM Facture f WHERE f.tresorier = :tresorier AND f.statut = 'EN_TRESORERIE'")
    List<Facture> findFacturesEnAttenteTresorerie(@Param("tresorier") User tresorier);

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
}