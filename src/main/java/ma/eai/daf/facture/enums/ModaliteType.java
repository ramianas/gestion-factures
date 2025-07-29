package ma.eai.daf.facture.enums;

public enum ModaliteType {
    DELAI_30(30, "30 jours"),
    DELAI_60(60, "60 jours"),
    DELAI_90(90, "90 jours"),
    DELAI_120(120, "120 jours");

    private final int delaiJours;
    private final String description;

    ModaliteType(int delaiJours, String description) {
        this.delaiJours = delaiJours;
        this.description = description;
    }

    public int getDelaiJours() {
        return delaiJours;
    }

    public String getDescription() {
        return description;
    }
}