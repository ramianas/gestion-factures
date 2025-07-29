package ma.eai.daf.facture.repositories;

import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Recherche de base
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(RoleType role);

    List<User> findByActifTrue();

    // Recherche par rôle et statut actif
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.actif = true ORDER BY u.nom, u.prenom")
    List<User> findActiveUsersByRole(@Param("role") RoleType role);

    // Recherche des validateurs V1 actifs
    @Query("SELECT u FROM User u WHERE u.role = 'V1' AND u.actif = true ORDER BY u.nom, u.prenom")
    List<User> findValidateursV1Actifs();

    // Recherche des validateurs V2 actifs
    @Query("SELECT u FROM User u WHERE u.role = 'V2' AND u.actif = true ORDER BY u.nom, u.prenom")
    List<User> findValidateursV2Actifs();

    // Recherche des trésoriers actifs
    @Query("SELECT u FROM User u WHERE u.role = 'T1' AND u.actif = true ORDER BY u.nom, u.prenom")
    List<User> findTresoriersActifs();

    // Recherche des utilisateurs de saisie actifs
    @Query("SELECT u FROM User u WHERE u.role = 'U1' AND u.actif = true ORDER BY u.nom, u.prenom")
    List<User> findUtilisateursSaisieActifs();

    // Exclure l'admin de la liste
    @Query("SELECT u FROM User u WHERE u.email != 'admin@admin.com' AND u.actif = true ORDER BY u.nom, u.prenom")
    List<User> findAllExceptAdmin();

    // Statistiques
    long countByRole(RoleType role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.actif = true")
    long countActiveUsersByRole(@Param("role") RoleType role);

    // Recherche par rôles multiples
    @Query("SELECT u FROM User u WHERE u.actif = true AND u.role IN :roles ORDER BY u.nom, u.prenom")
    List<User> findByActiveAndRoleIn(@Param("roles") List<RoleType> roles);

    // Recherche par nom ou prénom
    @Query("SELECT u FROM User u WHERE u.actif = true AND " +
            "(LOWER(u.nom) LIKE LOWER(CONCAT('%', :terme, '%')) OR " +
            "LOWER(u.prenom) LIKE LOWER(CONCAT('%', :terme, '%'))) ORDER BY u.nom, u.prenom")
    List<User> findByNomOrPrenomContaining(@Param("terme") String terme);
}