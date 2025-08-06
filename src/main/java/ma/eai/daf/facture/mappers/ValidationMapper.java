package ma.eai.daf.facture.mappers;

import ma.eai.daf.facture.entities.ValidationFacture;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ValidationMapper {

    // ===== ENTITY TO DTO MAP =====

    public Map<String, Object> toDto(ValidationFacture validation) {
        if (validation == null) {
            return null;
        }

        Map<String, Object> dto = new HashMap<>();

        dto.put("id", validation.getId());
        dto.put("dateValidation", validation.getDateValidation() != null ?
                validation.getDateValidation().toString() : "");
        dto.put("commentaire", validation.getCommentaire() != null ?
                validation.getCommentaire() : "");
        dto.put("approuve", validation.getApprouve() != null ?
                validation.getApprouve() : false);
        dto.put("niveauValidation", validation.getNiveauValidation() != null ?
                validation.getNiveauValidation() : "");

        // Statuts
        dto.put("statutPrecedent", validation.getStatutPrecedent() != null ?
                validation.getStatutPrecedent().name() : "");
        dto.put("statutNouveau", validation.getStatutNouveau() != null ?
                validation.getStatutNouveau().name() : "");

        // Informations sur la facture
        if (validation.getFacture() != null) {
            dto.put("factureId", validation.getFacture().getId());
            dto.put("factureNumero", validation.getFacture().getNumero() != null ?
                    validation.getFacture().getNumero() : "");
            dto.put("factureNomFournisseur", validation.getFacture().getNomFournisseur());
            dto.put("factureMontantTTC", validation.getFacture().getMontantTTC() != null ?
                    validation.getFacture().getMontantTTC() : 0);
        }

        // Informations sur l'utilisateur validateur
        if (validation.getUtilisateur() != null) {
            dto.put("validateurId", validation.getUtilisateur().getId());
            dto.put("validateurNom", validation.getUtilisateur().getNomComplet());
            dto.put("validateurEmail", validation.getUtilisateur().getEmail());
            dto.put("validateurRole", validation.getUtilisateur().getRole().name());
        }

        return dto;
    }

    public List<Map<String, Object>> toDtoList(List<ValidationFacture> validations) {
        if (validations == null) {
            return null;
        }
        return validations.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ===== DTO SIMPLIFIÉ POUR HISTORIQUE =====

    /**
     * Conversion simplifiée pour l'historique des validations
     */
    public Map<String, Object> toHistoriqueDto(ValidationFacture validation) {
        if (validation == null) {
            return null;
        }

        Map<String, Object> dto = new HashMap<>();

        dto.put("id", validation.getId());
        dto.put("dateValidation", validation.getDateValidation() != null ?
                validation.getDateValidation().toString() : "");
        dto.put("niveauValidation", validation.getNiveauValidation() != null ?
                validation.getNiveauValidation() : "");
        dto.put("approuve", validation.getApprouve() != null ?
                validation.getApprouve() : false);
        dto.put("commentaire", validation.getCommentaire() != null ?
                validation.getCommentaire() : "");
        dto.put("validateurNom", validation.getUtilisateur() != null ?
                validation.getUtilisateur().getNomComplet() : "");
        dto.put("statutPrecedent", validation.getStatutPrecedent() != null ?
                validation.getStatutPrecedent().name() : "");
        dto.put("statutNouveau", validation.getStatutNouveau() != null ?
                validation.getStatutNouveau().name() : "");

        return dto;
    }

    public List<Map<String, Object>> toHistoriqueDtoList(List<ValidationFacture> validations) {
        if (validations == null) {
            return null;
        }
        return validations.stream()
                .map(this::toHistoriqueDto)
                .collect(Collectors.toList());
    }

    // ===== DTO POUR STATISTIQUES =====

    /**
     * Conversion pour les statistiques de validation
     */
    public Map<String, Object> toStatDto(ValidationFacture validation) {
        if (validation == null) {
            return null;
        }

        Map<String, Object> dto = new HashMap<>();

        dto.put("dateValidation", validation.getDateValidation() != null ?
                validation.getDateValidation().toString() : "");
        dto.put("niveauValidation", validation.getNiveauValidation() != null ?
                validation.getNiveauValidation() : "");
        dto.put("approuve", validation.getApprouve() != null ?
                validation.getApprouve() : false);
        dto.put("validateurId", validation.getUtilisateur() != null ?
                validation.getUtilisateur().getId() : null);
        dto.put("validateurNom", validation.getUtilisateur() != null ?
                validation.getUtilisateur().getNomComplet() : "");
        dto.put("factureId", validation.getFacture() != null ?
                validation.getFacture().getId() : null);

        return dto;
    }

    public List<Map<String, Object>> toStatDtoList(List<ValidationFacture> validations) {
        if (validations == null) {
            return null;
        }
        return validations.stream()
                .map(this::toStatDto)
                .collect(Collectors.toList());
    }
}