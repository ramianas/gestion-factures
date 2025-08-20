package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/simple")
@RequiredArgsConstructor
@Slf4j
public class SimpleUserController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1')")
    public ResponseEntity<List<Map<String, Object>>> getSimpleUsers() {
        try {
            log.info("🔍 Récupération simple des utilisateurs");

            List<User> users = userRepository.findAllExceptAdmin();

            List<Map<String, Object>> result = users.stream()
                    .map(this::mapUserSimple)
                    .toList();

            log.info("✅ {} utilisateurs récupérés (simple)", result.size());
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ Erreur dans getSimpleUsers", e);
            return ResponseEntity.internalServerError().body(List.of());
        }
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1')")
    public ResponseEntity<Map<String, Object>> getSimpleUser(@PathVariable Long id) {
        try {
            log.info("🔍 Récupération simple de l'utilisateur {}", id);

            return userRepository.findById(id)
                    .map(user -> {
                        Map<String, Object> result = mapUserSimple(user);
                        log.info("✅ Utilisateur {} récupéré (simple)", id);
                        return ResponseEntity.ok(result);
                    })
                    .orElseGet(() -> {
                        log.warn("⚠️ Utilisateur {} non trouvé", id);
                        return ResponseEntity.notFound().build();
                    });

        } catch (Exception e) {
            log.error("❌ Erreur dans getSimpleUser {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/debug/count")
    public ResponseEntity<Map<String, Object>> getDebugCount() {
        try {
            log.info("🔍 Debug: Comptage des utilisateurs");

            long totalUsers = userRepository.count();
            long activeUsers = userRepository.findByActifTrue().size();
            long exceptAdmin = userRepository.findAllExceptAdmin().size();

            Map<String, Object> result = Map.of(
                    "totalUsers", totalUsers,
                    "activeUsers", activeUsers,
                    "exceptAdmin", exceptAdmin,
                    "timestamp", System.currentTimeMillis()
            );

            log.info("✅ Debug count: {}", result);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ Erreur debug count", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/debug/raw/{id}")
    public ResponseEntity<Map<String, Object>> getDebugRawUser(@PathVariable Long id) {
        try {
            log.info("🔍 Debug: Utilisateur raw {}", id);

            User user = userRepository.findById(id).orElse(null);

            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            Map<String, Object> result = new HashMap<>();
            result.put("id", user.getId());
            result.put("nom", user.getNom());
            result.put("prenom", user.getPrenom());
            result.put("email", user.getEmail());
            result.put("role", user.getRole().name());
            result.put("actif", user.isActif());
            result.put("nomComplet_method", user.getNomComplet());

            // Test sécurisé des collections
            try {
                result.put("facturesCreees_size", user.getFacturesCreees().size());
            } catch (Exception e) {
                result.put("facturesCreees_error", "Lazy loading error: " + e.getMessage());
            }

            try {
                result.put("nb_methode_creees", user.getNombreFacturesCreees());
            } catch (Exception e) {
                result.put("nb_methode_creees_error", "Method error: " + e.getMessage());
            }

            log.info("✅ Debug raw user: {}", result);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ Erreur debug raw user {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/test/connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        try {
            log.info("🔗 Test de connexion simple");

            // Test très basique
            long count = userRepository.count();

            Map<String, Object> result = Map.of(
                    "success", true,
                    "message", "Connexion OK",
                    "userCount", count,
                    "timestamp", System.currentTimeMillis()
            );

            log.info("✅ Test connexion OK: {} utilisateurs", count);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("❌ Erreur test connexion", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    // ===== MAPPING SIMPLIFIÉ SANS LAZY LOADING =====

    private Map<String, Object> mapUserSimple(User user) {
        Map<String, Object> userMap = new HashMap<>();

        try {
            // Données de base (toujours sûres)
            userMap.put("id", user.getId());
            userMap.put("nom", user.getNom() != null ? user.getNom() : "");
            userMap.put("prenom", user.getPrenom() != null ? user.getPrenom() : "");
            userMap.put("email", user.getEmail() != null ? user.getEmail() : "");
            userMap.put("role", user.getRole() != null ? user.getRole().name() : "");
            userMap.put("actif", user.isActif());

            // Nom complet calculé (sûr)
            try {
                userMap.put("nomComplet", user.getNomComplet());
            } catch (Exception e) {
                String nomComplet = (user.getPrenom() != null ? user.getPrenom() + " " : "") +
                        (user.getNom() != null ? user.getNom() : "");
                userMap.put("nomComplet", nomComplet.trim());
            }

            // Statistiques avec valeurs par défaut sécurisées
            userMap.put("nbFacturesCreees", 0);
            userMap.put("nbFacturesValideesN1", 0);
            userMap.put("nbFacturesValideesN2", 0);
            userMap.put("nbFacturesTraitees", 0);

            // Essayer de récupérer les vraies statistiques si possible
            try {
                userMap.put("nbFacturesCreees", user.getNombreFacturesCreees());
                userMap.put("nbFacturesValideesN1", user.getNombreFacturesValideesN1());
                userMap.put("nbFacturesValideesN2", user.getNombreFacturesValideesN2());
                userMap.put("nbFacturesTraitees", user.getNombreFacturesTraitees());
            } catch (Exception e) {
                log.debug("⚠️ Impossible de récupérer les stats pour l'utilisateur {}: {}",
                        user.getId(), e.getMessage());
                // Garder les valeurs par défaut (0)
            }

        } catch (Exception e) {
            log.error("❌ Erreur lors du mapping simple de l'utilisateur {}: {}",
                    user.getId(), e.getMessage());

            // En cas d'erreur totale, retourner au minimum les infos de base
            userMap.clear();
            userMap.put("id", user.getId());
            userMap.put("nom", "Erreur de chargement");
            userMap.put("prenom", "");
            userMap.put("email", user.getEmail() != null ? user.getEmail() : "");
            userMap.put("role", "U1");
            userMap.put("actif", true);
            userMap.put("nomComplet", "Erreur de chargement");
            userMap.put("nbFacturesCreees", 0);
            userMap.put("nbFacturesValideesN1", 0);
            userMap.put("nbFacturesValideesN2", 0);
            userMap.put("nbFacturesTraitees", 0);
        }

        return userMap;
    }
}