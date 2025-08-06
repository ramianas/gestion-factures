package ma.eai.daf.facture.dto;

import lombok.Data;
import lombok.Builder;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
@Builder
public class PaiementDto {

    @NotBlank(message = "La référence de paiement est obligatoire")
    @Size(max = 200, message = "La référence de paiement ne peut pas dépasser 200 caractères")
    private String referencePaiement;

    private LocalDate datePaiement; // Optionnel, sera la date actuelle si non fournie

    @Size(max = 500, message = "Le commentaire ne peut pas dépasser 500 caractères")
    private String commentaire;
}