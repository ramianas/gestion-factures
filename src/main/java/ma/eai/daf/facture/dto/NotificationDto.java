package ma.eai.daf.facture.dto;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;

@Data
@Builder
public class NotificationDto {

    private Long id;
    private String titre;
    private String message;
    private LocalDateTime dateEnvoi;
    private LocalDateTime dateLecture;
    private boolean lue;
    private boolean urgence;

    // Informations sur la facture liée
    private Long factureId;
    private String factureNumero;

    // Informations sur le destinataire
    private Long destinataireId;
    private String destinataireNom;
}