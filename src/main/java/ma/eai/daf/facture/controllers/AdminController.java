package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.services.UserService;
import lombok.RequiredArgsConstructor;
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
//@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {

    private final UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<Map<String, Object>> result = users.stream()
                .map(this::mapUserToDto)
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(mapUserToDto(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody User user) {
        try {
            User savedUser = userService.createUser(user);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur créé avec succès",
                    "userId", savedUser.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(id, user);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur mis à jour avec succès",
                    "userId", updatedUser.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur supprimé avec succès"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiques() {
        Map<String, Object> stats = Map.of(
                "totalUsers", userService.getTotalActiveUsers(),
                "utilisateursSaisie", userService.countUsersByRole(ma.eai.daf.facture.enums.RoleType.U1),
                "validateursV1", userService.countUsersByRole(ma.eai.daf.facture.enums.RoleType.V1),
                "validateursV2", userService.countUsersByRole(ma.eai.daf.facture.enums.RoleType.V2),
                "tresoriers", userService.countUsersByRole(ma.eai.daf.facture.enums.RoleType.T1)
        );
        return ResponseEntity.ok(stats);
    }

    private Map<String, Object> mapUserToDto(User user) {
        Map<String, Object> userMap = new HashMap<>();

        userMap.put("id", user.getId());
        userMap.put("nom", user.getNom());
        userMap.put("prenom", user.getPrenom() != null ? user.getPrenom() : "");
        userMap.put("email", user.getEmail());
        userMap.put("nomComplet", user.getNomComplet());
        userMap.put("role", user.getRole().name());
        userMap.put("actif", user.isActif());
        userMap.put("nbFacturesCreees", user.getNombreFacturesCreees());
        userMap.put("nbFacturesValideesV1", user.getNombreFacturesValideesN1()); // ✅ Corrigé V1
        userMap.put("nbFacturesValideesV2", user.getNombreFacturesValideesN2()); // ✅ Corrigé V2
        userMap.put("nbFacturesTraitees", user.getNombreFacturesTraitees());

        return userMap;
    }
}