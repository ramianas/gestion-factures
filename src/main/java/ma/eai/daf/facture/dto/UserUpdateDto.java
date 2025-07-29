package ma.eai.daf.facture.dto;

import ma.eai.daf.facture.enums.RoleType;
import lombok.Data;
import lombok.Builder;
import jakarta.validation.constraints.*;

@Data
@Builder
public class UserUpdateDto {

    @NotBlank(message = "Le nom est obligatoire")
    @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères")
    private String nom;

    @Size(max = 100, message = "Le prénom ne peut pas dépasser 100 caractères")
    private String prenom;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "L'email doit être valide")
    @Size(max = 150, message = "L'email ne peut pas dépasser 150 caractères")
    private String email;

    @NotNull(message = "Le rôle est obligatoire")
    private RoleType role;

    private boolean actif = true;

    // Mot de passe optionnel pour la mise à jour
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String nouveauMotDePasse;
}