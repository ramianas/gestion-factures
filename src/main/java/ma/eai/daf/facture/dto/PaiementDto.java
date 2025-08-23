// Fichier: src/main/java/ma/eai/daf/facture/dto/PaiementDto.java
// VERSION CORRIGÉE avec constructeurs et getters/setters

package ma.eai.daf.facture.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaiementDto {

    @NotBlank(message = "La référence de paiement est obligatoire")
    @Size(max = 200, message = "La référence de paiement ne peut pas dépasser 200 caractères")
    private String referencePaiement;

    private LocalDate datePaiement; // Optionnel, sera la date actuelle si non fournie

    @Size(max = 500, message = "Le commentaire ne peut pas dépasser 500 caractères")
    private String commentaire;

    // ===== CONSTRUCTEUR AVEC PARAMÈTRES ESSENTIELS =====

    public PaiementDto(String referencePaiement) {
        this.referencePaiement = referencePaiement;
        this.datePaiement = LocalDate.now();
        this.commentaire = "";
    }

    public PaiementDto(String referencePaiement, String commentaire) {
        this.referencePaiement = referencePaiement;
        this.datePaiement = LocalDate.now();
        this.commentaire = commentaire;
    }

    // ===== MÉTHODES UTILITAIRES =====

    /**
     * Initialise la date de paiement si elle est nulle
     */
    public LocalDate getDatePaiementOrDefault() {
        return datePaiement != null ? datePaiement : LocalDate.now();
    }

    /**
     * Initialise le commentaire si il est nul
     */
    public String getCommentaireOrDefault() {
        return commentaire != null ? commentaire : "";
    }

    /**
     * Vérifie si les données obligatoires sont présentes
     */
    public boolean isValid() {
        return referencePaiement != null && !referencePaiement.trim().isEmpty();
    }

    /**
     * Crée un PaiementDto avec une référence générée automatiquement
     */
    public static PaiementDto withGeneratedReference(Long factureId) {
        String reference = generateReference(factureId);
        return PaiementDto.builder()
                .referencePaiement(reference)
                .datePaiement(LocalDate.now())
                .commentaire("")
                .build();
    }

    private static String generateReference(Long factureId) {
        LocalDate now = LocalDate.now();
        return String.format("PAY%d%02d%02d-%d",
                now.getYear(),
                now.getMonthValue(),
                now.getDayOfMonth(),
                factureId);
    }

    @Override
    public String toString() {
        return String.format("PaiementDto{referencePaiement='%s', datePaiement=%s, commentaire='%s'}",
                referencePaiement, datePaiement, commentaire);
    }
}