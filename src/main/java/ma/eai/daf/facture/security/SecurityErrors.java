package ma.eai.daf.facture.security;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.Map;

@RestControllerAdvice
public class SecurityErrors {

    // Mauvais identifiants
    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    public ResponseEntity<?> badCredentials(Exception e) {
        return ResponseEntity
                .status(401)
                .body(Map.of("message", "Bad credentials"));
    }

    // Token invalide ou non fourni
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<?> accessDenied(Exception e) {
        return ResponseEntity
                .status(403)
                .body(Map.of("message", "Access denied"));
    }
}
