package ma.eai.daf.facture.controllers;

import ma.eai.daf.facture.dto.UserCreateDto;
import ma.eai.daf.facture.dto.UserDto;
import ma.eai.daf.facture.dto.UserUpdateDto;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.RoleType;
import ma.eai.daf.facture.mappers.UserMapper;
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
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    // ===== ENDPOINTS ADMIN =====

    @GetMapping
    //@PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            List<UserDto> userDtos = userMapper.toDtoList(users);

            log.debug("Récupération de {} utilisateurs", userDtos.size());
            return ResponseEntity.ok(userDtos);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des utilisateurs", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/{id}")
    //@PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        try {
            return userService.getUserById(id)
                    .map(user -> {
                        UserDto userDto = userMapper.toDto(user);
                        log.debug("Récupération de l'utilisateur {}", id);
                        return ResponseEntity.ok(userDto);
                    })
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'utilisateur {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
   // @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody UserCreateDto userCreateDto) {
        try {
            log.info("Création d'un nouvel utilisateur: {}", userCreateDto.getEmail());

            User user = userMapper.toEntity(userCreateDto);
            User savedUser = userService.createUser(user);

            log.info("Utilisateur {} créé avec succès", savedUser.getEmail());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur créé avec succès",
                    "userId", savedUser.getId()
            ));

        } catch (IllegalArgumentException e) {
            log.warn("Données invalides pour la création d'utilisateur: {}", e.getMessage());
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'utilisateur", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la création de l'utilisateur")
            );
        }
    }

    @PutMapping("/{id}")
   // @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateDto userUpdateDto) {

        try {
            log.info("Mise à jour de l'utilisateur {}", id);

            User updatedUser = userService.updateUser(id, userUpdateDto);

            log.info("Utilisateur {} mis à jour avec succès", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur mis à jour avec succès",
                    "userId", updatedUser.getId()
            ));

        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("non trouvé")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour de l'utilisateur {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la mise à jour")
            );
        }
    }

    @DeleteMapping("/{id}")
   // @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        try {
            log.info("Suppression de l'utilisateur {}", id);

            userService.deleteUser(id);

            log.info("Utilisateur {} supprimé avec succès", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Utilisateur supprimé avec succès"
            ));

        } catch (IllegalArgumentException e) {
            if (e.getMessage().contains("non trouvé")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur lors de la suppression de l'utilisateur {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur interne lors de la suppression")
            );
        }
    }

    // ===== ENDPOINTS DE CONSULTATION =====

    @GetMapping("/by-role/{role}")
  //  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1')")
    public ResponseEntity<List<UserDto>> getUsersByRole(@PathVariable RoleType role) {
        try {
            List<User> users = userService.getUsersByRole(role);
            List<UserDto> userDtos = userMapper.toSelectionDtoList(users);

            log.debug("Récupération de {} utilisateurs avec le rôle {}", userDtos.size(), role);
            return ResponseEntity.ok(userDtos);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération des utilisateurs par rôle {}", role, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/validateurs-v1")
  //  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_U1')")
    public ResponseEntity<List<UserDto>> getValidateursV1() {
        try {
            List<User> users = userService.getValidateursV1();
            List<UserDto> userDtos = userMapper.toSelectionDtoList(users);
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des validateurs V1", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/validateurs-v2")
   // @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_U1')")
    public ResponseEntity<List<UserDto>> getValidateursV2() {
        try {
            List<User> users = userService.getValidateursV2();
            List<UserDto> userDtos = userMapper.toSelectionDtoList(users);
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des validateurs V2", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/tresoriers")
  //  @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_U1')")
    public ResponseEntity<List<UserDto>> getTresoriers() {
        try {
            List<User> users = userService.getTresoriers();
            List<UserDto> userDtos = userMapper.toSelectionDtoList(users);
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des trésoriers", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    @GetMapping("/search")
   // @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1')")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam String terme) {
        try {
            if (terme == null || terme.trim().length() < 2) {
                return ResponseEntity.badRequest().body(List.of());
            }

            List<User> users = userService.searchUsers(terme.trim());
            List<UserDto> userDtos = userMapper.toSelectionDtoList(users);

            log.debug("Recherche '{}' - {} utilisateurs trouvés", terme, userDtos.size());
            return ResponseEntity.ok(userDtos);

        } catch (Exception e) {
            log.error("Erreur lors de la recherche d'utilisateurs avec le terme: {}", terme, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(List.of());
        }
    }

    // ===== PROFIL UTILISATEUR =====

    @GetMapping("/me")
   // @PreAuthorize("hasAnyAuthority('ROLE_U1', 'ROLE_V1', 'ROLE_V2', 'ROLE_T1', 'ROLE_ADMIN')")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        try {
            String email = authentication.getName();
            return userService.getUserByEmail(email)
                    .map(user -> {
                        UserDto userDto = userMapper.toDto(user);
                        log.debug("Récupération du profil pour {}", email);
                        return ResponseEntity.ok(userDto);
                    })
                    .orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            log.error("Erreur lors de la récupération du profil utilisateur", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===== STATISTIQUES =====

    @GetMapping("/statistiques")
    //@PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatistiques() {
        try {
            Map<String, Object> stats = Map.of(
                    "totalUtilisateurs", userService.getTotalActiveUsers(),
                    "utilisateursSaisie", userService.countUsersByRole(RoleType.U1),
                    "validateursV1", userService.countUsersByRole(RoleType.V1),
                    "validateursV2", userService.countUsersByRole(RoleType.V2),
                    "tresoriers", userService.countUsersByRole(RoleType.T1)
            );

            log.debug("Génération des statistiques utilisateurs");
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            log.error("Erreur lors de la génération des statistiques", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    createErrorResponse("Erreur lors de la génération des statistiques")
            );
        }
    }

    // ===== MÉTHODES UTILITAIRES =====

    private Map<String, Object> createErrorResponse(String message) {
        return Map.of(
                "success", false,
                "message", message,
                "timestamp", System.currentTimeMillis()
        );
    }
}