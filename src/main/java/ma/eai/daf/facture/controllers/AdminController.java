package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Slf4j
public class AdminController {

    private final UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        try {
            log.info("📋 Récupération de tous les utilisateurs pour l'admin");

            List<User> users = userService.getAllUsers();
            List<Map<String, Object>> result = users.stream()
                    .map(this::mapUserToDto)
                    .toList();

            log.info("✅ {} utilisateurs récupérés", result.size());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des utilisateurs", e);
            return ResponseEntity.internalServerError().body(List.of());
        }
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        try {
            log.info("📋 Récupération de l'utilisateur {}", id);

            return userService.getUserById(id)
                    .map(user -> {
                        Map<String, Object> result = mapUserToDto(user);
                        log.info("✅ Utilisateur {} récupéré", id);
                        return ResponseEntity.ok(result);
                    })
                    .orElseGet(() -> {
                        log.warn("⚠️ Utilisateur {} non trouvé", id);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération de l'utilisateur {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody User user) {
        try {
            log.info("🆕 Création d'un nouvel utilisateur: {}", user.getEmail());

            User savedUser = userService.createUser(user);

            log.info("✅ Utilisateur {} créé avec succès", savedUser.getEmail());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur créé avec succès",
                    "userId", savedUser.getId()
            ));

        } catch (RuntimeException e) {
            log.warn("⚠️ Erreur lors de la création de l'utilisateur: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("❌ Erreur technique lors de la création de l'utilisateur", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur interne du serveur"
            ));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        try {
            log.info("🔄 Mise à jour de l'utilisateur {}", id);

            User updatedUser = userService.updateUser(id, user);

            log.info("✅ Utilisateur {} mis à jour avec succès", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur mis à jour avec succès",
                    "userId", updatedUser.getId()
            ));

        } catch (RuntimeException e) {
            log.warn("⚠️ Erreur lors de la mise à jour de l'utilisateur {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("❌ Erreur technique lors de la mise à jour de l'utilisateur {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur interne du serveur"
            ));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        try {
            log.info("🗑️ Suppression de l'utilisateur {}", id);

            userService.deleteUser(id);

            log.info("✅ Utilisateur {} supprimé avec succès", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur supprimé avec succès"
            ));

        } catch (RuntimeException e) {
            log.warn("⚠️ Erreur lors de la suppression de l'utilisateur {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("❌ Erreur technique lors de la suppression de l'utilisateur {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur interne du serveur"
            ));
        }
    }

    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiques() {
        try {
            log.info("📊 Génération des statistiques utilisateurs");

            Map<String, Object> stats = Map.of(
                    "totalUsers", userService.getTotalActiveUsers(),
                    "utilisateursSaisie", userService.countUsersByRole(ma.eai.daf.facture.enums.RoleType.U1),
                    "validateursV1", userService.countUsersByRole(ma.eai.daf.facture.enums.RoleType.V1),
                    "validateursV2", userService.countUsersByRole(ma.eai.daf.facture.enums.RoleType.V2),
                    "tresoriers", userService.countUsersByRole(ma.eai.daf.facture.enums.RoleType.T1)
            );

            log.info("✅ Statistiques générées: {}", stats);
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("❌ Erreur lors de la génération des statistiques", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur lors de la génération des statistiques"
            ));
        }
    }

    // ===== MÉTHODE DE MAPPING CORRIGÉE =====

    private Map<String, Object> mapUserToDto(User user) {
        Map<String, Object> userMap = new HashMap<>();

        try {
            userMap.put("id", user.getId());
            userMap.put("nom", user.getNom() != null ? user.getNom() : "");
            userMap.put("prenom", user.getPrenom() != null ? user.getPrenom() : "");
            userMap.put("email", user.getEmail() != null ? user.getEmail() : "");
            userMap.put("nomComplet", user.getNomComplet() != null ? user.getNomComplet() : "");
            userMap.put("role", user.getRole() != null ? user.getRole().name() : "");
            userMap.put("actif", user.isActif());

            // ✅ CORRECTION : Utilisation des bonnes méthodes
            userMap.put("nbFacturesCreees", safeGetInteger(user.getNombreFacturesCreees()));
            userMap.put("nbFacturesValideesN1", safeGetInteger(user.getNombreFacturesValideesN1()));
            userMap.put("nbFacturesValideesN2", safeGetInteger(user.getNombreFacturesValideesN2()));
            userMap.put("nbFacturesTraitees", safeGetInteger(user.getNombreFacturesTraitees()));

        } catch (Exception e) {
            log.error("❌ Erreur lors du mapping de l'utilisateur {}: {}", user.getId(), e.getMessage());
            // Valeurs par défaut en cas d'erreur
            userMap.put("nbFacturesCreees", 0);
            userMap.put("nbFacturesValideesN1", 0);
            userMap.put("nbFacturesValideesN2", 0);
            userMap.put("nbFacturesTraitees", 0);
        }

        return userMap;
    }

    // ===== MÉTHODE UTILITAIRE =====

    private Integer safeGetInteger(int value) {
        try {
            return value;
        } catch (Exception e) {
            log.warn("⚠️ Erreur lors de la récupération d'une valeur entière: {}", e.getMessage());
            return 0;
        }
    }
}