package ma.eai.daf.facture.repositories;

import ma.eai.daf.facture.entities.Notification;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.entities.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Recherche par destinataire
    List<Notification> findByDestinataireOrderByDateEnvoiDesc(User destinataire);

    List<Notification> findByDestinataireIdOrderByDateEnvoiDesc(Long destinataireId);

    // Notifications non lues
    @Query("SELECT n FROM Notification n WHERE n.destinataire = :destinataire AND n.lue = false ORDER BY n.dateEnvoi DESC")
    List<Notification> findNotificationsNonLues(@Param("destinataire") User destinataire);

    @Query("SELECT n FROM Notification n WHERE n.destinataire.id = :destinataireId AND n.lue = false ORDER BY n.dateEnvoi DESC")
    List<Notification> findNotificationsNonLuesByDestinataireId(@Param("destinataireId") Long destinataireId);

    // Notifications lues
    @Query("SELECT n FROM Notification n WHERE n.destinataire = :destinataire AND n.lue = true ORDER BY n.dateEnvoi DESC")
    List<Notification> findNotificationsLues(@Param("destinataire") User destinataire);

    // Recherche par facture
    List<Notification> findByFactureOrderByDateEnvoiDesc(Facture facture);

    List<Notification> findByFactureIdOrderByDateEnvoiDesc(Long factureId);

    // Notifications urgentes
    @Query("SELECT n FROM Notification n WHERE n.urgence = true AND n.lue = false ORDER BY n.dateEnvoi DESC")
    List<Notification> findNotificationsUrgentesNonLues();

    @Query("SELECT n FROM Notification n WHERE n.destinataire = :destinataire AND n.urgence = true AND n.lue = false ORDER BY n.dateEnvoi DESC")
    List<Notification> findNotificationsUrgentesNonLuesByDestinataire(@Param("destinataire") User destinataire);

    // Compteurs
    long countByDestinataireAndLueFalse(User destinataire);

    long countByDestinataireIdAndLueFalse(Long destinataireId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.destinataire = :destinataire AND n.urgence = true AND n.lue = false")
    long countNotificationsUrgentesNonLuesByDestinataire(@Param("destinataire") User destinataire);

    // Recherche par période
    @Query("SELECT n FROM Notification n WHERE n.dateEnvoi BETWEEN :dateDebut AND :dateFin ORDER BY n.dateEnvoi DESC")
    List<Notification> findByDateEnvoiBetween(@Param("dateDebut") LocalDateTime dateDebut,
                                              @Param("dateFin") LocalDateTime dateFin);

    // Nettoyage des anciennes notifications
    @Query("SELECT n FROM Notification n WHERE n.lue = true AND n.dateEnvoi < :dateLimit")
    List<Notification> findOldReadNotifications(@Param("dateLimit") LocalDateTime dateLimit);
}