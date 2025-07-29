package ma.eai.daf.facture.repositories;

import ma.eai.daf.facture.entities.ValidationFacture;
import ma.eai.daf.facture.entities.Facture;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.StatutFacture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ValidationFactureRepository extends JpaRepository<ValidationFacture, Long> {

    // Recherche par facture
    List<ValidationFacture> findByFactureOrderByDateValidationDesc(Facture facture);

    List<ValidationFacture> findByFactureIdOrderByDateValidationDesc(Long factureId);

    // Recherche par utilisateur
    List<ValidationFacture> findByUtilisateurOrderByDateValidationDesc(User utilisateur);

    List<ValidationFacture> findByUtilisateurIdOrderByDateValidationDesc(Long utilisateurId);

    // Recherche par niveau de validation
    List<ValidationFacture> findByNiveauValidation(String niveauValidation);

    @Query("SELECT v FROM ValidationFacture v WHERE v.niveauValidation = :niveau AND v.utilisateur = :utilisateur")
    List<ValidationFacture> findByNiveauValidationAndUtilisateur(@Param("niveau") String niveau,
                                                                 @Param("utilisateur") User utilisateur);

    // Recherche par statut
    List<ValidationFacture> findByStatutPrecedent(StatutFacture statutPrecedent);

    List<ValidationFacture> findByStatutNouveau(StatutFacture statutNouveau);

    // Recherche par approbation
    List<ValidationFacture> findByApprouve(Boolean approuve);

    @Query("SELECT v FROM ValidationFacture v WHERE v.approuve = :approuve AND v.utilisateur = :utilisateur")
    List<ValidationFacture> findByApprouveAndUtilisateur(@Param("approuve") Boolean approuve,
                                                         @Param("utilisateur") User utilisateur);

    // Recherche par date
    @Query("SELECT v FROM ValidationFacture v WHERE v.dateValidation BETWEEN :dateDebut AND :dateFin")
    List<ValidationFacture> findByDateValidationBetween(@Param("dateDebut") LocalDateTime dateDebut,
                                                        @Param("dateFin") LocalDateTime dateFin);

    // Statistiques
    @Query("SELECT COUNT(v) FROM ValidationFacture v WHERE v.utilisateur = :utilisateur AND v.approuve = true")
    long countValidationsApprouveesByUtilisateur(@Param("utilisateur") User utilisateur);

    @Query("SELECT COUNT(v) FROM ValidationFacture v WHERE v.utilisateur = :utilisateur AND v.approuve = false")
    long countValidationsRejeteesByUtilisateur(@Param("utilisateur") User utilisateur);

    // Dernière validation d'une facture
    @Query("SELECT v FROM ValidationFacture v WHERE v.facture = :facture ORDER BY v.dateValidation DESC")
    List<ValidationFacture> findLastValidationByFacture(@Param("facture") Facture facture);

    // Historique complet d'une facture
    @Query("SELECT v FROM ValidationFacture v WHERE v.facture.id = :factureId ORDER BY v.dateValidation ASC")
    List<ValidationFacture> findHistoriqueValidationByFactureId(@Param("factureId") Long factureId);
}
