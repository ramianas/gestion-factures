package ma.eai.daf.facture.dto;

import ma.eai.daf.facture.enums.StatutFacture;
import ma.eai.daf.facture.enums.ModaliteType;
import ma.eai.daf.facture.enums.FormeJuridiqueType;
import lombok.Data;
import lombok.Builder;
import java.time.LocalDate;

@Data
@Builder
public class FactureSearchDto {

    private StatutFacture statut;
    private Long createurId;
    private Long validateur1Id;
    private Long validateur2Id;
    private Long tresorierIdId;
    private String nomFournisseur;
    private FormeJuridiqueType formeJuridique;
    private ModaliteType modalite;
    private LocalDate dateFactureDebut;
    private LocalDate dateFactureFin;
    private LocalDate dateEcheanceDebut;
    private LocalDate dateEcheanceFin;
    private String numeroFacture;

    // Pagination
    private int page = 0;
    private int size = 20;
    private String sortBy = "dateCreation";
    private String sortDirection = "DESC";
}