package ma.eai.daf.facture.dto;

import ma.eai.daf.facture.enums.ModaliteType;
import ma.eai.daf.facture.enums.FormeJuridiqueType;
import lombok.Data;
import lombok.Builder;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class FactureCreateDto {

    // === INFORMATIONS FOURNISSEUR ===
    @NotBlank(message = "Le nom du fournisseur est obligatoire")
    @Size(max = 200, message = "Le nom du fournisseur ne peut pas dépasser 200 caractères")
    private String nomFournisseur;

    private FormeJuridiqueType formeJuridique;

    // === DATES ===
    @NotNull(message = "La date de facture est obligatoire")
    private LocalDate dateFacture;

    private LocalDate dateReception;
    private LocalDate dateLivraison;

    // === MONTANTS ===
    @NotNull(message = "Le montant HT est obligatoire")
    @DecimalMin(value = "0.01", message = "Le montant HT doit être positif")
    @Digits(integer = 12, fraction = 2, message = "Le montant HT doit avoir au maximum 12 chiffres avant la virgule et 2 après")
    private BigDecimal montantHT;

    @DecimalMin(value = "0", message = "Le taux TVA doit être positif")
    @DecimalMax(value = "100", message = "Le taux TVA ne peut pas dépasser 100%")
    @Digits(integer = 3, fraction = 2, message = "Le taux TVA doit avoir au maximum 3 chiffres avant la virgule et 2 après")
    private BigDecimal tauxTVA;

    @DecimalMin(value = "0", message = "La RAS TVA doit être positive")
    @Digits(integer = 12, fraction = 2, message = "La RAS TVA doit avoir au maximum 12 chiffres avant la virgule et 2 après")
    private BigDecimal rasTVA;

    // === MODALITÉ ET RÉFÉRENCES ===
    private ModaliteType modalite;

    private Boolean refacturable = false;

    @Size(max = 500, message = "La désignation ne peut pas dépasser 500 caractères")
    private String designation;

    @Size(max = 100, message = "La référence commande ne peut pas dépasser 100 caractères")
    private String refCommande;

    @Size(max = 50, message = "La période ne peut pas dépasser 50 caractères")
    private String periode;

    @Size(max = 100, message = "Le numéro de facture ne peut pas dépasser 100 caractères")
    private String numero;

    // === VALIDATEURS - IDs sélectionnés ===
    @NotNull(message = "Un validateur V1 doit être sélectionné")
    private Long validateur1Id;

    @NotNull(message = "Un validateur V2 doit être sélectionné")
    private Long validateur2Id;

    private Long tresorierIdId; // Optionnel lors de la saisie

    // === COMMENTAIRES ===
    @Size(max = 1000, message = "Les commentaires ne peuvent pas dépasser 1000 caractères")
    private String commentaires;
}