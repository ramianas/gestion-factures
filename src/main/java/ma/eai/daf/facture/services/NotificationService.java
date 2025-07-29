package ma.eai.daf.facture.services;

import ma.eai.daf.facture.entities.Facture;
import ma.eai.daf.facture.entities.Notification;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // ===== NOTIFICATIONS WORKFLOW =====

    public void notifierValidationV1(Facture facture) {
        if (facture.getValidateur1() == null) return;

        String titre = "Nouvelle facture à valider (V1)";
        String message = String.format("La facture %s de %s (montant: %.2f€) est prête pour votre validation niveau 1.",
                facture.getNumero(), facture.getNomFournisseur(), facture.getMontantTTC());

        createNotification(facture.getValidateur1(), facture, titre, message, "VALIDATION_V1", false);
        log.info("Notification V1 envoyée à {} pour facture {}",
                facture.getValidateur1().getNomComplet(), facture.getNumero());
    }

    public void notifierValidationV2(Facture facture) {
        if (facture.getValidateur2() == null) return;

        String titre = "Nouvelle facture à valider (V2)";
        String message = String.format("La facture %s de %s (montant: %.2f€) a été validée par V1 et est prête pour votre validation niveau 2.",
                facture.getNumero(), facture.getNomFournisseur(), facture.getMontantTTC());

        createNotification(facture.getValidateur2(), facture, titre, message, "VALIDATION_V2", false);
        log.info("Notification V2 envoyée à {} pour facture {}",
                facture.getValidateur2().getNomComplet(), facture.getNumero());
    }

    public void notifierTresorerie(Facture facture) {
        if (facture.getTresorier() == null) return;

        String titre = "Nouvelle facture à traiter (Trésorerie)";
        String message = String.format("La facture %s de %s (montant: %.2f€) a été entièrement validée et est prête pour le paiement. Échéance: %s",
                facture.getNumero(), facture.getNomFournisseur(), facture.getMontantTTC(),
                facture.getDateEcheance() != null ? facture.getDateEcheance().toString() : "Non définie");

        boolean urgente = facture.getJoursAvantEcheance() <= 7;
        createNotification(facture.getTresorier(), facture, titre, message, "TRESORERIE", urgente);
        log.info("Notification trésorerie envoyée à {} pour facture {}",
                facture.getTresorier().getNomComplet(), facture.getNumero());
    }

    public void notifierRejet(Facture facture, String niveauRejet, String motif) {
        String titre = String.format("Facture rejetée par %s", niveauRejet);
        String message = String.format("Votre facture %s de %s a été rejetée par le validateur %s. Motif: %s",
                facture.getNumero(), facture.getNomFournisseur(), niveauRejet, motif);

        createNotification(facture.getCreateur(), facture, titre, message, "REJET", true);
        log.info("Notification rejet {} envoyée à {} pour facture {}",
                niveauRejet, facture.getCreateur().getNomComplet(), facture.getNumero());
    }

    public void notifierPaiement(Facture facture) {
        String titre = "Facture payée";
        String message = String.format("La facture %s de %s (montant: %.2f€) a été payée le %s. Référence: %s",
                facture.getNumero(), facture.getNomFournisseur(), facture.getMontantTTC(),
                facture.getDatePaiement().toString(), facture.getReferencePaiement());

        // Notifier le créateur
        createNotification(facture.getCreateur(), facture, titre, message, "PAIEMENT", false);

        // Notifier les validateurs
        if (facture.getValidateur1() != null) {
            createNotification(facture.getValidateur1(), facture, titre, message, "PAIEMENT", false);
        }
        if (facture.getValidateur2() != null) {
            createNotification(facture.getValidateur2(), facture, titre, message, "PAIEMENT", false);
        }

        log.info("Notifications paiement envoyées pour facture {}", facture.getNumero());
    }

    public void notifierEcheanceProche(Facture facture) {
        if (facture.getTresorier() == null) return;

        long joursRestants = facture.getJoursAvantEcheance();
        String titre = String.format("Échéance proche (%d jours)", joursRestants);
        String message = String.format("La facture %s de %s (montant: %.2f€) arrive à échéance dans %d jours (%s).",
                facture.getNumero(), facture.getNomFournisseur(), facture.getMontantTTC(),
                joursRestants, facture.getDateEcheance().toString());

        createNotification(facture.getTresorier(), facture, titre, message, "ECHEANCE_PROCHE", true);
        log.info("Notification échéance proche envoyée pour facture {}", facture.getNumero());
    }

    // ===== GESTION DES NOTIFICATIONS =====

    public List<Notification> getNotificationsNonLues(Long userId) {
        return notificationRepository.findNotificationsNonLuesByDestinataireId(userId);
    }

    public List<Notification> getNotificationsUser(Long userId) {
        return notificationRepository.findByDestinataireIdOrderByDateEnvoiDesc(userId);
    }

    public long countNotificationsNonLues(Long userId) {
        return notificationRepository.countByDestinataireIdAndLueFalse(userId);
    }

    public void marquerCommeLue(Long notificationId) {
        notificationRepository.findById(notificationId)
                .ifPresent(notification -> {
                    notification.marquerCommeLue();
                    notificationRepository.save(notification);
                });
    }

    public void marquerToutesCommeLues(Long userId) {
        List<Notification> notifications = notificationRepository.findNotificationsNonLuesByDestinataireId(userId);
        notifications.forEach(notification -> {
            notification.marquerCommeLue();
            notificationRepository.save(notification);
        });
    }

    // ===== MÉTHODES PRIVÉES =====

    private void createNotification(User destinataire, Facture facture, String titre,
                                    String message, String typeNotification, boolean urgente) {
        Notification notification = Notification.builder()
                .destinataire(destinataire)
                .facture(facture)
                .titre(titre)
                .message(message)
                .typeNotification(typeNotification)
                .urgence(urgente)
                .lue(false)
                .build();

        notificationRepository.save(notification);
    }
}