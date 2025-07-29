package ma.eai.daf.facture.enums;

public enum StatutFacture {
    SAISIE,           // Facture saisie par U1
    EN_VALIDATION_V1, // En attente de validation par V1
    EN_VALIDATION_V2, // En attente de validation par V2
    EN_TRESORERIE,    // En attente de traitement par T1
    VALIDEE,          // Facture entièrement validée
    REJETEE,          // Facture rejetée à un niveau
    PAYEE             // Facture payée
}