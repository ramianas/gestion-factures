// Fichier: src/main/java/ma/eai/daf/facture/controllers/TestController.java

package ma.eai.daf.facture.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@Slf4j
public class TestController {

    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> testPublic() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Endpoint public accessible");
        response.put("timestamp", LocalDateTime.now());
        response.put("requiresAuth", false);

        log.info("Test endpoint public appelé");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> testAuth(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Endpoint authentifié accessible");
        response.put("timestamp", LocalDateTime.now());
        response.put("requiresAuth", true);
        response.put("user", authentication != null ? authentication.getName() : "anonymous");

        log.info("Test endpoint authentifié appelé par: {}",
                authentication != null ? authentication.getName() : "anonymous");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> testAdmin(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Endpoint admin accessible");
        response.put("timestamp", LocalDateTime.now());
        response.put("requiresAuth", true);
        response.put("requiresRole", "ADMIN");
        response.put("user", authentication.getName());

        log.info("Test endpoint admin appelé par: {}", authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('U1')")
    public ResponseEntity<Map<String, Object>> testUser(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Endpoint utilisateur de saisie accessible");
        response.put("timestamp", LocalDateTime.now());
        response.put("requiresAuth", true);
        response.put("requiresRole", "U1");
        response.put("user", authentication.getName());

        log.info("Test endpoint U1 appelé par: {}", authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validator1")
    @PreAuthorize("hasRole('V1')")
    public ResponseEntity<Map<String, Object>> testValidator1(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Endpoint validateur V1 accessible");
        response.put("timestamp", LocalDateTime.now());
        response.put("requiresAuth", true);
        response.put("requiresRole", "V1");
        response.put("user", authentication.getName());

        log.info("Test endpoint V1 appelé par: {}", authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/validator2")
    @PreAuthorize("hasRole('V2')")
    public ResponseEntity<Map<String, Object>> testValidator2(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Endpoint validateur V2 accessible");
        response.put("timestamp", LocalDateTime.now());
        response.put("requiresAuth", true);
        response.put("requiresRole", "V2");
        response.put("user", authentication.getName());

        log.info("Test endpoint V2 appelé par: {}", authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/treasurer")
    @PreAuthorize("hasRole('T1')")
    public ResponseEntity<Map<String, Object>> testTreasurer(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Endpoint trésorier accessible");
        response.put("timestamp", LocalDateTime.now());
        response.put("requiresAuth", true);
        response.put("requiresRole", "T1");
        response.put("user", authentication.getName());

        log.info("Test endpoint T1 appelé par: {}", authentication.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cors")
    public ResponseEntity<Map<String, Object>> testCors() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Test CORS - si vous voyez ce message, CORS fonctionne");
        response.put("timestamp", LocalDateTime.now());
        response.put("origin", "Backend Spring Boot");

        log.info("Test CORS appelé");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cors")
    public ResponseEntity<Map<String, Object>> testCorsPost(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Test CORS POST - requête reçue");
        response.put("timestamp", LocalDateTime.now());
        response.put("receivedData", body);

        log.info("Test CORS POST appelé avec données: {}", body);
        return ResponseEntity.ok(response);
    }
}