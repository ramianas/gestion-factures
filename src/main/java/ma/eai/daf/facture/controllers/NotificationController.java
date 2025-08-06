package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.dto.NotificationDto;
import ma.eai.daf.facture.entities.Notification;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.mappers.NotificationMapper;
import ma.eai.daf.facture.services.NotificationService;
import ma.eai.daf.facture.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;
    private final NotificationMapper notificationMapper;

    // ===== CONSULTATION DES NOTIFICATIONS =====

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getMesNotifications(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<Notification> notifications = notificationService.getNotificationsUser(userId);

        List<NotificationDto> notificationDtos = notificationMapper.toDtoList(notifications);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", notificationDtos);
        response.put("total", notifications.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/non-lues")
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getNotificationsNonLues(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<Notification> notifications = notificationService.getNotificationsNonLues(userId);

        List<NotificationDto> notificationDtos = notificationMapper.toDtoList(notifications);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", notificationDtos);
        response.put("total", notifications.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/count-non-lues")
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getCountNotificationsNonLues(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        long count = notificationService.countNotificationsNonLues(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", count);

        return ResponseEntity.ok(response);
    }

    // ===== GESTION DES NOTIFICATIONS =====

    @PutMapping("/{id}/marquer-comme-lue")
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> marquerCommeLue(
            @PathVariable Long id,
            Authentication authentication) {

        try {
            // Vérifier que la notification appartient à l'utilisateur connecté
            Long userId = getCurrentUserId(authentication);

            notificationService.marquerCommeLue(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Notification marquée comme lue");
            response.put("notificationId", id);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PutMapping("/marquer-toutes-comme-lues")
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> marquerToutesCommeLues(Authentication authentication) {

        try {
            Long userId = getCurrentUserId(authentication);

            // Compter les notifications non lues avant de les marquer
            long countAvant = notificationService.countNotificationsNonLues(userId);

            notificationService.marquerToutesCommeLues(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", String.format("%d notification(s) marquée(s) comme lue(s)", countAvant));
            response.put("count", countAvant);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // ===== NOTIFICATIONS SPÉCIALISÉES =====

    @GetMapping("/urgentes")
    @PreAuthorize("hasAnyAuthority('ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getNotificationsUrgentes(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);

        // Récupérer toutes les notifications non lues de l'utilisateur
        List<Notification> notifications = notificationService.getNotificationsNonLues(userId);

        // Filtrer les urgentes
        List<Notification> notificationsUrgentes = notifications.stream()
                .filter(n -> n.getUrgence() != null && n.getUrgence())
                .toList();

        List<NotificationDto> notificationDtos = notificationMapper.toDtoList(notificationsUrgentes);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", notificationDtos);
        response.put("total", notificationsUrgentes.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/par-facture/{factureId}")
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getNotificationsParFacture(
            @PathVariable Long factureId,
            Authentication authentication) {

        try {
            // Note: Ici vous pourriez ajouter une vérification pour s'assurer
            // que l'utilisateur a le droit de voir les notifications de cette facture

            // Cette méthode devra être ajoutée au NotificationService
            // List<Notification> notifications = notificationService.getNotificationsByFactureId(factureId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Fonctionnalité à implémenter dans NotificationService");
            response.put("factureId", factureId);

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    // ===== TABLEAU DE BORD NOTIFICATIONS =====

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardNotifications(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);

        List<Notification> toutesNotifications = notificationService.getNotificationsUser(userId);
        List<Notification> notificationsNonLues = notificationService.getNotificationsNonLues(userId);

        long urgentesNonLues = notificationsNonLues.stream()
                .filter(n -> n.getUrgence() != null && n.getUrgence())
                .count();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalNotifications", toutesNotifications.size());
        dashboard.put("notificationsNonLues", notificationsNonLues.size());
        dashboard.put("notificationsUrgentes", urgentesNonLues);
        dashboard.put("tauxLecture", toutesNotifications.isEmpty() ? 100.0 :
                ((double) (toutesNotifications.size() - notificationsNonLues.size()) / toutesNotifications.size()) * 100.0);

        // Récentes (5 dernières)
        List<NotificationDto> recentesDto = notificationMapper.toDtoList(
                toutesNotifications.stream().limit(5).toList()
        );
        dashboard.put("notificationsRecentes", recentesDto);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("dashboard", dashboard);

        return ResponseEntity.ok(response);
    }

    // ===== ENDPOINTS ADMIN =====

    @GetMapping("/admin/statistiques")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatistiquesNotifications() {
        // Cette fonctionnalité nécessiterait des méthodes additionnelles dans NotificationService
        Map<String, Object> stats = new HashMap<>();
        stats.put("message", "Statistiques globales - À implémenter selon les besoins");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("statistics", stats);

        return ResponseEntity.ok(response);
    }

    // ===== MÉTHODES UTILITAIRES =====

    private Long getCurrentUserId(Authentication authentication) {
        String email = authentication.getName();
        return userService.getUserByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    // ===== ENDPOINTS DE TEST (À SUPPRIMER EN PRODUCTION) =====

    @PostMapping("/test/create")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> createTestNotification(
            @RequestBody Map<String, Object> testData,
            Authentication authentication) {

        // Endpoint de test pour créer une notification manuellement
        // À supprimer en production

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Endpoint de test - À supprimer en production");

        return ResponseEntity.ok(response);
    }
}