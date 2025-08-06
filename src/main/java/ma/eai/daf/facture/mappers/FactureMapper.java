package ma.eai.daf.facture.mappers;

import ma.eai.daf.facture.dto.FactureCreateDto;
import ma.eai.daf.facture.dto.FactureUpdateDto;
import ma.eai.daf.facture.entities.Facture;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FactureMapper {

    private final UserService userService;

    // ===== CREATE DTO TO ENTITY =====

   public Facture toEntity(FactureCreateDto createDto) {
        if (createDto == null) {
            return null;
        }

        Facture facture = Facture.builder()
                .numero(createDto.getNumero())
                .nomFournisseur(createDto.getNomFournisseur())
                .formeJuridique(createDto.getFormeJuridique())
                .dateFacture(createDto.getDateFacture())
                .dateReception(createDto.getDateReception())
                .dateLivraison(createDto.getDateLivraison())
                .montantHT(createDto.getMontantHT())
                .tauxTVA(createDto.getTauxTVA())
                .rasTVA(createDto.getRasTVA())
                .modalite(createDto.getModalite())
                .refacturable(createDto.getRefacturable())
                .designation(createDto.getDesignation())
                .refCommande(createDto.getRefCommande())
                .periode(createDto.getPeriode())
                .commentaires(createDto.getCommentaires())
                .build();

        // Assignation des validateurs via le service
        if (createDto.getValidateur1Id() != null) {
            User validateur1 = userService.getUserById(createDto.getValidateur1Id())
                    .orElseThrow(() -> new RuntimeException("Validateur V1 non trouvé"));
            facture.setValidateur1(validateur1);
        }

        if (createDto.getValidateur2Id() != null) {
            User validateur2 = userService.getUserById(createDto.getValidateur2Id())
                    .orElseThrow(() -> new RuntimeException("Validateur V2 non trouvé"));
            facture.setValidateur2(validateur2);
        }

        if (createDto.getTresorierIdId() != null) {
            User tresorier = userService.getUserById(createDto.getTresorierIdId())
                    .orElseThrow(() -> new RuntimeException("Trésorier non trouvé"));
            facture.setTresorier(tresorier);
        }

        return facture;
    }

    // ===== UPDATE DTO TO ENTITY =====

    public void updateEntityFromDto(Facture facture, FactureUpdateDto updateDto) {
        if (facture == null || updateDto == null) {
            return;
        }

        facture.setNomFournisseur(updateDto.getNomFournisseur());
        facture.setFormeJuridique(updateDto.getFormeJuridique());
        facture.setDateFacture(updateDto.getDateFacture());
        facture.setDateReception(updateDto.getDateReception());
        facture.setDateLivraison(updateDto.getDateLivraison());
        facture.setMontantHT(updateDto.getMontantHT());
        facture.setTauxTVA(updateDto.getTauxTVA());
        facture.setRasTVA(updateDto.getRasTVA());
        facture.setModalite(updateDto.getModalite());
        facture.setRefacturable(updateDto.getRefacturable());
        facture.setDesignation(updateDto.getDesignation());
        facture.setRefCommande(updateDto.getRefCommande());
        facture.setPeriode(updateDto.getPeriode());
        facture.setCommentaires(updateDto.getCommentaires());

        // Mise à jour des validateurs si fournis
        if (updateDto.getValidateur1Id() != null) {
            User validateur1 = userService.getUserById(updateDto.getValidateur1Id())
                    .orElseThrow(() -> new RuntimeException("Validateur V1 non trouvé"));
            facture.setValidateur1(validateur1);
        }

        if (updateDto.getValidateur2Id() != null) {
            User validateur2 = userService.getUserById(updateDto.getValidateur2Id())
                    .orElseThrow(() -> new RuntimeException("Validateur V2 non trouvé"));
            facture.setValidateur2(validateur2);
        }

        if (updateDto.getTresorierIdId() != null) {
            User tresorier = userService.getUserById(updateDto.getTresorierIdId())
                    .orElseThrow(() -> new RuntimeException("Trésorier non trouvé"));
            facture.setTresorier(tresorier);
        }
    }

    // ===== ENTITY TO DTO MAPS =====

    /**
     * Conversion pour les listes de factures (vue simplifiée)
     */
    public Map<String, Object> toListDto(Facture facture) {
        if (facture == null) {
            return null;
        }

        Map<String, Object> dto = new HashMap<>();
        dto.put("id", facture.getId());
        dto.put("numero", facture.getNumero() != null ? facture.getNumero() : "");
        dto.put("nomFournisseur", facture.getNomFournisseur());
        dto.put("montantTTC", facture.getMontantTTC() != null ? facture.getMontantTTC() : 0);
        dto.put("dateFacture", facture.getDateFacture() != null ? facture.getDateFacture().toString() : "");
        dto.put("dateEcheance", facture.getDateEcheance() != null ? facture.getDateEcheance().toString() : "");
        dto.put("statut", facture.getStatut().name());
        dto.put("createurNom", facture.getCreateur().getNomComplet());
        dto.put("joursAvantEcheance", facture.getJoursAvantEcheance());
        dto.put("estEnRetard", facture.estEnRetard());

        return dto;
    }

    public List<Map<String, Object>> toListDtoList(List<Facture> factures) {
        if (factures == null) {
            return null;
        }
        return factures.stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    /**
     * Conversion pour les détails complets de facture
     */
    public Map<String, Object> toDetailDto(Facture facture) {
        if (facture == null) {
            return null;
        }

        Map<String, Object> dto = new HashMap<>();

        // Informations de base
        dto.put("id", facture.getId());
        dto.put("numero", facture.getNumero() != null ? facture.getNumero() : "");
        dto.put("nomFournisseur", facture.getNomFournisseur());
        dto.put("formeJuridique", facture.getFormeJuridique() != null ? facture.getFormeJuridique().name() : null);

        // Dates
        dto.put("dateFacture", facture.getDateFacture() != null ? facture.getDateFacture().toString() : "");
        dto.put("dateReception", facture.getDateReception() != null ? facture.getDateReception().toString() : "");
        dto.put("dateEcheance", facture.getDateEcheance() != null ? facture.getDateEcheance().toString() : "");
        dto.put("dateLivraison", facture.getDateLivraison() != null ? facture.getDateLivraison().toString() : "");

        // Montants
        dto.put("montantHT", facture.getMontantHT() != null ? facture.getMontantHT() : 0);
        dto.put("tauxTVA", facture.getTauxTVA() != null ? facture.getTauxTVA() : 0);
        dto.put("montantTVA", facture.getMontantTVA() != null ? facture.getMontantTVA() : 0);
        dto.put("montantTTC", facture.getMontantTTC() != null ? facture.getMontantTTC() : 0);
        dto.put("rasTVA", facture.getRasTVA() != null ? facture.getRasTVA() : 0);

        // Modalité et références
        dto.put("modalite", facture.getModalite() != null ? facture.getModalite().name() : null);
        dto.put("refacturable", facture.getRefacturable() != null ? facture.getRefacturable() : false);
        dto.put("designation", facture.getDesignation() != null ? facture.getDesignation() : "");
        dto.put("refCommande", facture.getRefCommande() != null ? facture.getRefCommande() : "");
        dto.put("periode", facture.getPeriode() != null ? facture.getPeriode() : "");

        // Statut et commentaires
        dto.put("statut", facture.getStatut().name());
        dto.put("commentaires", facture.getCommentaires() != null ? facture.getCommentaires() : "");

        // Dates de traçabilité
        dto.put("dateCreation", facture.getDateCreation() != null ? facture.getDateCreation().toString() : "");
        dto.put("dateModification", facture.getDateModification() != null ? facture.getDateModification().toString() : "");

        // Utilisateurs
        dto.put("createur", facture.getCreateur() != null ? mapUserForSelection(facture.getCreateur()) : null);
        dto.put("validateur1", facture.getValidateur1() != null ? mapUserForSelection(facture.getValidateur1()) : null);
        dto.put("validateur2", facture.getValidateur2() != null ? mapUserForSelection(facture.getValidateur2()) : null);
        dto.put("tresorier", facture.getTresorier() != null ? mapUserForSelection(facture.getTresorier()) : null);

        // Dates de validation
        dto.put("dateValidationV1", facture.getDateValidationV1() != null ? facture.getDateValidationV1().toString() : "");
        dto.put("dateValidationV2", facture.getDateValidationV2() != null ? facture.getDateValidationV2().toString() : "");

        // Paiement
        dto.put("referencePaiement", facture.getReferencePaiement() != null ? facture.getReferencePaiement() : "");
        dto.put("datePaiement", facture.getDatePaiement() != null ? facture.getDatePaiement().toString() : "");

        // Métriques et statuts
        dto.put("joursAvantEcheance", facture.getJoursAvantEcheance());
        dto.put("estEnRetard", facture.estEnRetard());
        dto.put("peutEtreModifiee", facture.peutEtreModifiee());
        dto.put("peutEtreValideeParV1", facture.peutEtreValideeParV1());
        dto.put("peutEtreValideeParV2", facture.peutEtreValideeParV2());
        dto.put("peutEtreTraiteeParTresorier", facture.peutEtreTraiteeParTresorier());

        return dto;
    }

    // ===== UTILITY METHODS =====

    private Map<String, Object> mapUserForSelection(User user) {
        if (user == null) {
            return null;
        }

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("nomComplet", user.getNomComplet());
        userMap.put("email", user.getEmail());
        userMap.put("role", user.getRole().name());

        return userMap;
    }
}