package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.dto.FactureCreateDto;
import ma.eai.daf.facture.dto.FactureUpdateDto;
import ma.eai.daf.facture.dto.PaiementDto;
import ma.eai.daf.facture.dto.ValidationDto;
import ma.eai.daf.facture.entities.Facture;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.StatutFacture;
import ma.eai.daf.facture.mappers.FactureMapper;
import ma.eai.daf.facture.services.FactureService;
import ma.eai.daf.facture.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/factures")
@RequiredArgsConstructor
@Slf4j
public class FactureController {

    private final FactureService factureService;
    private final UserService userService;
    private final FactureMapper factureMapper;
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> createFactureTest(
            @Valid @RequestBody FactureCreateDto factureDto,
            @RequestParam(defaultValue = "1") Long userId) {

        try {
            Facture facture = factureMapper.toEntity(factureDto);
            Facture savedFacture = factureService.createFacture(facture, userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture créée avec succès (mode test)",
                    "factureId", savedFacture.getId(),
                    "numero", savedFacture.getNumero()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    Map.of("success", false, "message", e.getMessage())
            );
        }
    }
    // ===== ENDPOINTS POUR U1 (Saisie) =====

    @GetMapping("/donnees-reference")
    //@PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<Map<String, Object>> getDonneesReferenceSaisie() {
        try {
            Map<String, Object> donnees = Map.of(
                    "validateursV1", userService.getValidateursV1().stream()
                            .map(this::mapUserForSelection)
                            .toList(),
                    "validateursV2", userService.getValidateursV2().stream()
                            .map(this::mapUserForSelection)
                            .toList(),
                    "tresoriers", userService.getTresoriers().stream()
                            .map(this::mapUserForSelection)
                            .toList()
            );

            log.debug("Données de référence récupérées avec succès");
            return ResponseEntity.ok(donnees);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des données de référence", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur lors de la récupération des données de référence")
            );
        }
    }

    @PostMapping
    //@PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<Map<String, Object>> createFacture(
            @Valid @RequestBody FactureCreateDto factureDto,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            log.info("Création d'une nouvelle facture par l'utilisateur {}", userId);

            Facture facture = factureMapper.toEntity(factureDto);
            Facture savedFacture = factureService.createFacture(facture, userId);

            log.info("Facture {} créée avec succès par l'utilisateur {}",
                    savedFacture.getNumero(), userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture créée avec succès",
                    "factureId", savedFacture.getId(),
                    "numero", savedFacture.getNumero()
            ));

        } catch (IllegalArgumentException e) {
            log.warn("Données invalides pour la création de facture: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (SecurityException e) {
            log.warn("Tentative d'accès non autorisé pour la création de facture: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la création de la facture", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la création de la facture:" + e.getMessage())
            );
        }
    }

    @GetMapping("/mes-factures")
   // @PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<List<Map<String, Object>>> getMesFactures(Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);
            List<Facture> factures = factureService.getFacturesParCreateur(userId);
            List<Map<String, Object>> result = factureMapper.toListDtoList(factures);

            log.debug("Récupération de {} factures pour l'utilisateur {}", result.size(), userId);
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            log.warn("Utilisateur non trouvé: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(List.of());
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des factures", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @PutMapping("/{id}")
   // @PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<Map<String, Object>> updateFacture(
            @PathVariable Long id,
            @Valid @RequestBody FactureUpdateDto factureUpdateDto,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            log.info("Mise à jour de la facture {} par l'utilisateur {}", id, userId);

            Facture facture = factureService.getFactureById(id)
                    .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

            if (!facture.getCreateur().getId().equals(userId)) {
                log.warn("Tentative de modification non autorisée de la facture {} par l'utilisateur {}", id, userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        createErrorResponse("Vous ne pouvez modifier que vos propres factures"));
            }

            factureMapper.updateEntityFromDto(facture, factureUpdateDto);
            Facture updatedFacture = factureService.updateFacture(id, facture);

            log.info("Facture {} mise à jour avec succès", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture mise à jour avec succès",
                    "factureId", updatedFacture.getId()
            ));

        } catch (RuntimeException e) {
            if (e.getMessage().contains("non trouvée")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour de la facture {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la mise à jour")
            );
        }
    }

    @PostMapping("/{id}/soumettre-v1")
   // @PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<Map<String, Object>> soumettreValidationV1(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            log.info("Soumission de la facture {} pour validation V1 par l'utilisateur {}", id, userId);

            factureService.soumettreValidationV1(id, userId);

            log.info("Facture {} soumise pour validation V1 avec succès", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture soumise pour validation V1"
            ));

        } catch (RuntimeException e) {
            if (e.getMessage().contains("non trouvée")) {
                return ResponseEntity.notFound().build();
            }
            if (e.getMessage().contains("autorisé") || e.getMessage().contains("créateur")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse(e.getMessage()));
            }
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la soumission pour validation V1 de la facture {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la soumission")
            );
        }
    }

    // ===== ENDPOINTS POUR V1 (Validation Niveau 1) =====

    @GetMapping("/en-attente-v1")
   // @PreAuthorize("hasAuthority('ROLE_V1')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesEnAttenteV1(Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);
            List<Facture> factures = factureService.getFacturesEnAttenteV1(userId);
            List<Map<String, Object>> result = factureMapper.toListDtoList(factures);

            log.debug("Récupération de {} factures en attente V1 pour l'utilisateur {}", result.size(), userId);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des factures en attente V1", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @PostMapping("/{id}/valider-v1")
   // @PreAuthorize("hasAuthority('ROLE_V1')")
    public ResponseEntity<Map<String, Object>> validerParV1(
            @PathVariable Long id,
            @Valid @RequestBody ValidationDto validationDto,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            String action = validationDto.isApprouve() ? "validation" : "rejet";
            log.info("{} de la facture {} par le validateur V1 {}", action, id, userId);

            factureService.validerParV1(id, userId, validationDto.getCommentaire(), validationDto.isApprouve());

            String message = validationDto.isApprouve() ? "Facture validée par V1" : "Facture rejetée par V1";
            log.info("Facture {} {} par V1 avec succès", id, validationDto.isApprouve() ? "validée" : "rejetée");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", message
            ));

        } catch (RuntimeException e) {
            return handleValidationException(e, id);
        } catch (Exception e) {
            log.error("Erreur lors de la validation V1 de la facture {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la validation")
            );
        }
    }

    // ===== ENDPOINTS POUR V2 (Validation Niveau 2) =====

    @GetMapping("/en-attente-v2")
   // @PreAuthorize("hasAuthority('ROLE_V2')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesEnAttenteV2(Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);
            List<Facture> factures = factureService.getFacturesEnAttenteV2(userId);
            List<Map<String, Object>> result = factureMapper.toListDtoList(factures);

            log.debug("Récupération de {} factures en attente V2 pour l'utilisateur {}", result.size(), userId);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des factures en attente V2", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @PostMapping("/{id}/valider-v2")
  //  @PreAuthorize("hasAuthority('ROLE_V2')")
    public ResponseEntity<Map<String, Object>> validerParV2(
            @PathVariable Long id,
            @Valid @RequestBody ValidationDto validationDto,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            String action = validationDto.isApprouve() ? "validation" : "rejet";
            log.info("{} de la facture {} par le validateur V2 {}", action, id, userId);

            factureService.validerParV2(id, userId, validationDto.getCommentaire(), validationDto.isApprouve());

            String message = validationDto.isApprouve() ? "Facture validée par V2" : "Facture rejetée par V2";
            log.info("Facture {} {} par V2 avec succès", id, validationDto.isApprouve() ? "validée" : "rejetée");

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", message
            ));

        } catch (RuntimeException e) {
            return handleValidationException(e, id);
        } catch (Exception e) {
            log.error("Erreur lors de la validation V2 de la facture {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la validation")
            );
        }
    }

    // ===== ENDPOINTS POUR T1 (Trésorerie) =====

    @GetMapping("/en-attente-tresorerie")
   // @PreAuthorize("hasAuthority('ROLE_T1')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesEnAttenteTresorerie(Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);
            List<Facture> factures = factureService.getFacturesEnAttenteTresorerie(userId);
            List<Map<String, Object>> result = factureMapper.toListDtoList(factures);

            log.debug("Récupération de {} factures en attente trésorerie pour l'utilisateur {}", result.size(), userId);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des factures en attente trésorerie", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @PostMapping("/{id}/payer")
   // @PreAuthorize("hasAuthority('ROLE_T1')")
    public ResponseEntity<Map<String, Object>> payerFacture(
            @PathVariable Long id,
            @Valid @RequestBody PaiementDto paiementDto,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            log.info("Paiement de la facture {} par le trésorier {}", id, userId);

            factureService.traiterParTresorier(id, userId,
                    paiementDto.getReferencePaiement(),
                    paiementDto.getDatePaiement(),
                    paiementDto.getCommentaire());

            log.info("Facture {} payée avec succès - Référence: {}", id, paiementDto.getReferencePaiement());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture payée avec succès"
            ));

        } catch (RuntimeException e) {
            return handleValidationException(e, id);
        } catch (Exception e) {
            log.error("Erreur lors du paiement de la facture {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors du paiement")
            );
        }
    }

    // ===== ENDPOINTS COMMUNS =====

    @GetMapping("/{id}")
  //  @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getFactureById(@PathVariable Long id) {
        try {
            return factureService.getFactureById(id)
                    .map(facture -> {
                        log.debug("Récupération des détails de la facture {}", id);
                        return ResponseEntity.ok(factureMapper.toDetailDto(facture));
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de la facture {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur lors de la récupération de la facture")
            );
        }
    }

    @GetMapping("/mes-taches")
   // @PreAuthorize("hasAnyAuthority('ROLE_V1', 'ROLE_V2', 'ROLE_T1')")
    public ResponseEntity<List<Map<String, Object>>> getMesTaches(Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);
            List<Facture> factures = factureService.getFacturesEnAttenteForUser(userId);
            List<Map<String, Object>> result = factureMapper.toListDtoList(factures);

            log.debug("Récupération de {} tâches pour l'utilisateur {}", result.size(), userId);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des tâches", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/urgentes")
   // @PreAuthorize("hasAnyAuthority('ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesUrgentes() {
        try {
            List<Facture> factures = factureService.getFacturesUrgentes();
            List<Map<String, Object>> result = factureMapper.toListDtoList(factures);

            log.debug("Récupération de {} factures urgentes", result.size());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des factures urgentes", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/en-retard")
   // @PreAuthorize("hasAnyAuthority('ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getFacturesEnRetard() {
        try {
            List<Facture> factures = factureService.getFacturesEnRetard();
            List<Map<String, Object>> result = factureMapper.toListDtoList(factures);

            log.debug("Récupération de {} factures en retard", result.size());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des factures en retard", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/tableau-bord")
   // @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getTableauBord(Authentication authentication) {
        try {
            Long userId = getCurrentUserId(authentication);

            Map<String, Object> tableau = Map.of(
                    "facturesEnSaisie", factureService.countFacturesParStatut(StatutFacture.SAISIE),
                    "facturesEnValidationV1", factureService.countFacturesParStatut(StatutFacture.EN_VALIDATION_V1),
                    "facturesEnValidationV2", factureService.countFacturesParStatut(StatutFacture.EN_VALIDATION_V2),
                    "facturesEnTresorerie", factureService.countFacturesParStatut(StatutFacture.EN_TRESORERIE),
                    "facturesValidees", factureService.countFacturesParStatut(StatutFacture.VALIDEE),
                    "facturesPayees", factureService.countFacturesParStatut(StatutFacture.PAYEE),
                    "facturesRejetees", factureService.countFacturesParStatut(StatutFacture.REJETEE),
                    "mesTaches", factureService.getFacturesEnAttenteForUser(userId).size(),
                    "facturesUrgentes", factureService.getFacturesUrgentes().size(),
                    "facturesEnRetard", factureService.getFacturesEnRetard().size()
            );

            log.debug("Génération du tableau de bord pour l'utilisateur {}", userId);
            return ResponseEntity.ok(tableau);

        } catch (Exception e) {
            log.error("Erreur lors de la génération du tableau de bord", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur lors de la génération du tableau de bord")
            );
        }
    }

    @DeleteMapping("/{id}")
   // @PreAuthorize("hasAuthority('ROLE_U1')")
    public ResponseEntity<Map<String, Object>> deleteFacture(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);
            log.info("Suppression de la facture {} par l'utilisateur {}", id, userId);

            Facture facture = factureService.getFactureById(id)
                    .orElseThrow(() -> new RuntimeException("Facture non trouvée"));

            if (!facture.getCreateur().getId().equals(userId)) {
                log.warn("Tentative de suppression non autorisée de la facture {} par l'utilisateur {}", id, userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        createErrorResponse("Vous ne pouvez supprimer que vos propres factures"));
            }

            factureService.deleteFacture(id);

            log.info("Facture {} supprimée avec succès", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Facture supprimée avec succès"
            ));

        } catch (RuntimeException e) {
            if (e.getMessage().contains("non trouvée")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la suppression de la facture {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la suppression")
            );
        }
    }

    // ===== MÉTHODES UTILITAIRES =====

    private Long getCurrentUserId(Authentication authentication) {
        try {
            String email = authentication.getName();
            return userService.getUserByEmail(email)
                    .map(User::getId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'utilisateur connecté", e);
            throw new RuntimeException("Impossible de récupérer les informations de l'utilisateur connecté");
        }
    }

    private Map<String, Object> mapUserForSelection(User user) {
        return Map.of(
                "id", user.getId(),
                "nomComplet", user.getNomComplet(),
                "email", user.getEmail(),
                "role", user.getRole().name()
        );
    }

    private Map<String, Object> createErrorResponse(String message) {
        return Map.of(
                "success", false,
                "message", message,
                "timestamp", System.currentTimeMillis()
        );
    }

    private ResponseEntity<Map<String, Object>> handleValidationException(RuntimeException e, Long factureId) {
        if (e.getMessage().contains("non trouvée")) {
            return ResponseEntity.notFound().build();
        }
        if (e.getMessage().contains("autorisé") || e.getMessage().contains("assigné") || e.getMessage().contains("validateur")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse(e.getMessage()));
        }
        return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
    }

}