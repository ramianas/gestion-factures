package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.security.JwtTokenProvider;
import ma.eai.daf.facture.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

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

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            log.info("Tentative de connexion pour l'utilisateur: {}", loginRequest.getEmail());

            // Vérifier si l'utilisateur existe et le mot de passe est correct
            Optional<User> userOpt = userService.getUserByEmail(loginRequest.getEmail());

            if (userOpt.isEmpty()) {
                log.warn("Utilisateur non trouvé: {}", loginRequest.getEmail());
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email ou mot de passe incorrect"
                ));
            }
// ...
            User user = userOpt.get();

            if (!user.isActif()) {
                log.warn("Utilisateur inactif: {}", loginRequest.getEmail());
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Compte utilisateur désactivé"
                ));
            }

// 🔎 DEBUG: voir le hash stocké et le résultat de la comparaison
            log.info("Hash en base pour {} = {}", user.getEmail(), user.getMotDePasse());
            log.info("BCrypt matches? {}", passwordEncoder.matches(loginRequest.getPassword(), user.getMotDePasse()));

// Vérifier le mot de passe
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getMotDePasse())) {
                log.warn("Mot de passe incorrect pour: {}", loginRequest.getEmail());
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email ou mot de passe incorrect"
                ));
            }
// ...


            // Générer le token JWT
            String token = jwtTokenProvider.generateToken(user.getEmail());

            log.info("Connexion réussie pour l'utilisateur: {} ({})", user.getNomComplet(), user.getRole());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Connexion réussie",
                    "token", token,
                    "user", Map.of(
                            "id", user.getId(),
                            "nom", user.getNom(),
                            "prenom", user.getPrenom() != null ? user.getPrenom() : "",
                            "email", user.getEmail(),
                            "nomComplet", user.getNomComplet(),
                            "role", user.getRole().name(),
                            "actif", user.isActif()
                    )
            ));

        } catch (Exception e) {
            log.error("Erreur lors de la connexion", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur interne lors de la connexion"
            ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        // Dans un vrai système, vous pourriez invalider le token côté serveur
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Déconnexion réussie"
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        try {
            if (authentication == null || authentication.getName() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Token invalide ou expiré"
                ));
            }

            String email = authentication.getName();
            Optional<User> userOpt = userService.getUserByEmail(email);

            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Utilisateur non trouvé"
                ));
            }

            User user = userOpt.get();

            // ✅ SOLUTION : Utiliser HashMap au lieu de Map.of() pour éviter la limite
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
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Erreur lors de la récupération du profil"
            ));
        }
    }

    // Classe interne pour la requête de login
    public static class LoginRequest {
        private String email;
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