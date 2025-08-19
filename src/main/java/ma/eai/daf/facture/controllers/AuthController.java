// Fichier: src/main/java/ma/eai/daf/facture/controllers/AuthController.java

package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.security.JwtTokenProvider;
import ma.eai.daf.facture.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            log.info("Tentative de connexion pour l'utilisateur: {}", loginRequest.getEmail());

            // Authentification avec Spring Security
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            // Générer le token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // Récupérer les informations utilisateur
            User user = userService.getUserByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            log.info("Connexion réussie pour l'utilisateur: {} ({})", user.getNomComplet(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Connexion réussie");
            response.put("token", token);
            response.put("tokenType", "Bearer");
            response.put("expiresIn", 86400); // 24 heures en secondes

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("nom", user.getNom());
            userInfo.put("prenom", user.getPrenom() != null ? user.getPrenom() : "");
            userInfo.put("email", user.getEmail());
            userInfo.put("nomComplet", user.getNomComplet());
            userInfo.put("role", user.getRole().name());
            userInfo.put("actif", user.isActif());

            response.put("user", userInfo);

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            log.warn("Échec de connexion - Identifiants incorrects pour: {}", loginRequest.getEmail());
            return ResponseEntity.badRequest().body(createErrorResponse("Email ou mot de passe incorrect"));
        } catch (Exception e) {
            log.error("Erreur lors de la connexion pour: {}", loginRequest.getEmail(), e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Erreur interne lors de la connexion"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body(createErrorResponse("Token manquant ou format invalide"));
            }

            String token = authHeader.substring(7);

            if (!jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.badRequest().body(createErrorResponse("Token invalide ou expiré"));
            }

            String email = jwtTokenProvider.getUsernameFromToken(token);
            User user = userService.getUserByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (!user.isActif()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Compte utilisateur désactivé"));
            }

            // Générer un nouveau token
            String newToken = jwtTokenProvider.generateToken(email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Token rafraîchi avec succès");
            response.put("token", newToken);
            response.put("tokenType", "Bearer");
            response.put("expiresIn", 86400);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur lors du rafraîchissement du token", e);
            return ResponseEntity.badRequest().body(createErrorResponse("Impossible de rafraîchir le token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        // Nettoyer le contexte de sécurité
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Déconnexion réussie"
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Token invalide ou expiré"));
            }

            String email = authentication.getName();
            Optional<User> userOpt = userService.getUserByEmail(email);

            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Utilisateur non trouvé"));
            }

            User user = userOpt.get();

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("nom", user.getNom());
            userInfo.put("prenom", user.getPrenom() != null ? user.getPrenom() : "");
            userInfo.put("email", user.getEmail());
            userInfo.put("nomComplet", user.getNomComplet());
            userInfo.put("role", user.getRole().name());
            userInfo.put("actif", user.isActif());
            userInfo.put("nbFacturesCreees", user.getNombreFacturesCreees());
            userInfo.put("nbFacturesValideesN1", user.getNombreFacturesValideesN1());
            userInfo.put("nbFacturesValideesN2", user.getNombreFacturesValideesN2());
            userInfo.put("nbFacturesTraitees", user.getNombreFacturesTraitees());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", userInfo);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération du profil utilisateur", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Erreur lors de la récupération du profil"));
        }
    }

    @PostMapping("/validate-token")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.badRequest().body(createErrorResponse("Token manquant ou format invalide"));
            }

            String token = authHeader.substring(7);
            boolean isValid = jwtTokenProvider.validateToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("valid", isValid);

            if (isValid) {
                String email = jwtTokenProvider.getUsernameFromToken(token);
                response.put("email", email);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(createErrorResponse("Erreur lors de la validation du token"));
        }
    }
    // Ajout à AuthController.java
// Ajoutez cette méthode dans votre AuthController

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.badRequest().body(createErrorResponse("Token invalide ou expiré"));
            }

            String email = authentication.getName();
            Optional<User> userOpt = userService.getUserByEmail(email);

            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Utilisateur non trouvé"));
            }

            User user = userOpt.get();

            // Vérifier l'ancien mot de passe
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getMotDePasse())) {
                return ResponseEntity.badRequest().body(createErrorResponse("Mot de passe actuel incorrect"));
            }

            // Valider le nouveau mot de passe
            if (request.getNewPassword().length() < 6) {
                return ResponseEntity.badRequest().body(createErrorResponse("Le nouveau mot de passe doit contenir au moins 6 caractères"));
            }

            // Mettre à jour le mot de passe
            user.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));
            userService.saveUser(user);

            log.info("Mot de passe modifié pour l'utilisateur: {}", email);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Mot de passe modifié avec succès");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur lors du changement de mot de passe", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Erreur lors du changement de mot de passe"));
        }
    }

    // DTO pour le changement de mot de passe
    public static class ChangePasswordRequest {
        @NotBlank(message = "Le mot de passe actuel est obligatoire")
        private String currentPassword;

        @NotBlank(message = "Le nouveau mot de passe est obligatoire")
        @Size(min = 6, message = "Le nouveau mot de passe doit contenir au moins 6 caractères")
        private String newPassword;

        // Constructeurs
        public ChangePasswordRequest() {}

        public ChangePasswordRequest(String currentPassword, String newPassword) {
            this.currentPassword = currentPassword;
            this.newPassword = newPassword;
        }

        // Getters et setters
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    // ===== MÉTHODES UTILITAIRES =====

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("message", message);
        errorResponse.put("timestamp", System.currentTimeMillis());
        return errorResponse;
    }

    // ===== DTO CLASSES =====

    public static class LoginRequest {
        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format d'email invalide")
        private String email;

        @NotBlank(message = "Le mot de passe est obligatoire")
        @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
        private String password;

        // Constructeurs
        public LoginRequest() {}

        public LoginRequest(String email, String password) {
            this.email = email;
            this.password = password;
        }

        // Getters et setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}