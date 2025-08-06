package ma.eai.daf.facture.mappers;

import ma.eai.daf.facture.dto.NotificationDto;
import ma.eai.daf.facture.entities.Notification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class NotificationMapper {

    // ===== ENTITY TO DTO =====

    public NotificationDto toDto(Notification notification) {
        if (notification == null) {
            return null;
        }

        NotificationDto.NotificationDtoBuilder builder = NotificationDto.builder()
                .id(notification.getId())
                .titre(notification.getTitre())
                .message(notification.getMessage())
                .dateEnvoi(notification.getDateEnvoi())
                .dateLecture(notification.getDateLecture())
                .lue(notification.estLue())
                .urgence(notification.getUrgence() != null ? notification.getUrgence() : false);

        // Informations sur la facture liée
        if (notification.getFacture() != null) {
            builder.factureId(notification.getFacture().getId())
                    .factureNumero(notification.getFacture().getNumero() != null ?
                            notification.getFacture().getNumero() : "");
        }

        // Informations sur le destinataire
        if (notification.getDestinataire() != null) {
            builder.destinataireId(notification.getDestinataire().getId())
                    .destinataireNom(notification.getDestinataire().getNomComplet());
        }

        return builder.build();
    }

    public List<NotificationDto> toDtoList(List<Notification> notifications) {
        if (notifications == null) {
            return null;
        }
        return notifications.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ===== DTO SIMPLIFIÉ POUR LISTES =====

    /**
     * Conversion simplifiée pour les listes de notifications
     */
    public NotificationDto toSimpleDto(Notification notification) {
        if (notification == null) {
            return null;
        }

        return NotificationDto.builder()
                .id(notification.getId())
                .titre(notification.getTitre())
                .message(notification.getMessage())
                .dateEnvoi(notification.getDateEnvoi())
                .lue(notification.estLue())
                .urgence(notification.getUrgence() != null ? notification.getUrgence() : false)
                .factureId(notification.getFacture() != null ? notification.getFacture().getId() : null)
                .factureNumero(notification.getFacture() != null && notification.getFacture().getNumero() != null ?
                        notification.getFacture().getNumero() : "")
                .build();
    }

    public List<NotificationDto> toSimpleDtoList(List<Notification> notifications) {
        if (notifications == null) {
            return null;
        }
        return notifications.stream()
                .map(this::toSimpleDto)
                .collect(Collectors.toList());
    }
}