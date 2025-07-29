package ma.eai.daf.facture.dto;

import lombok.Data;
import lombok.Builder;
import jakarta.validation.constraints.*;

@Data
@Builder
public class ValidationDto {

    @NotNull(message = "La décision d'approbation est obligatoire")
    private boolean approuve;

    @Size(max = 500, message = "Le commentaire ne peut pas dépasser 500 caractères")
    private String commentaire;

    // Champ optionnel pour indiquer le niveau de validation
    private String niveauValidation; // "V1", "V2", "T1"
}
