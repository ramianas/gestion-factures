package ma.eai.daf.facture.services;

import ma.eai.daf.facture.dto.UserUpdateDto;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.RoleType;
import ma.eai.daf.facture.mappers.UserMapper;
import ma.eai.daf.facture.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    // ===== CRUD DE BASE =====

    public List<User> getAllUsers() {
        try {
            log.info("🔍 Récupération de tous les utilisateurs (sauf admin)");

            List<User> users = userRepository.findAllExceptAdmin();
            log.info("✅ {} utilisateurs trouvés", users.size());

            // Debug : afficher quelques infos sur les utilisateurs
            users.forEach(user -> {
                log.debug("👤 Utilisateur: {} {} ({}), rôle: {}, actif: {}",
                        user.getPrenom(), user.getNom(), user.getEmail(),
                        user.getRole(), user.isActif());
            });

            return users;

        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des utilisateurs", e);
            throw new RuntimeException("Erreur lors de la récupération des utilisateurs: " + e.getMessage());
        }
    }

    public Optional<User> getUserById(Long id) {
        try {
            log.debug("🔍 Recherche utilisateur avec ID: {}", id);

            Optional<User> user = userRepository.findById(id);
            if (user.isPresent()) {
                log.debug("✅ Utilisateur trouvé: {}", user.get().getEmail());
            } else {
                log.warn("⚠️ Aucun utilisateur trouvé avec l'ID: {}", id);
            }

            return user;

        } catch (Exception e) {
            log.error("❌ Erreur lors de la recherche de l'utilisateur ID {}", id, e);
            return Optional.empty();
        }
    }

    public Optional<User> getUserByEmail(String email) {
        try {
            log.debug("🔍 Recherche utilisateur avec email: {}", email);

            Optional<User> user = userRepository.findByEmail(email);
            if (user.isPresent()) {
                log.debug("✅ Utilisateur trouvé par email: {}", email);
            } else {
                log.warn("⚠️ Aucun utilisateur trouvé avec l'email: {}", email);
            }

            return user;

        } catch (Exception e) {
            log.error("❌ Erreur lors de la recherche de l'utilisateur par email {}", email, e);
            return Optional.empty();
        }
    }

    public boolean existsByEmail(String email) {
        try {
            boolean exists = userRepository.existsByEmail(email);
            log.debug("🔍 Email {} existe: {}", email, exists);
            return exists;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la vérification de l'email {}", email, e);
            return false;
        }
    }

    public User createUser(User user) {
        try {
            log.info("🆕 Création d'un nouvel utilisateur: {}", user.getEmail());

            // Validations
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new IllegalArgumentException("Un utilisateur avec cet email existe déjà");
            }

            if (user.getRole() == RoleType.ADMIN) {
                throw new IllegalArgumentException("Impossible de créer un utilisateur avec le rôle ADMIN");
            }

            // Encoder le mot de passe
            String motDePasseOriginal = user.getMotDePasse();
            if (motDePasseOriginal == null || motDePasseOriginal.trim().isEmpty()) {
                throw new IllegalArgumentException("Le mot de passe est obligatoire");
            }

            user.setMotDePasse(passwordEncoder.encode(motDePasseOriginal));

            // Valeurs par défaut
            if (user.getPrenom() == null) {
                user.setPrenom("");
            }

            User savedUser = userRepository.save(user);
            log.info("✅ Utilisateur créé avec succès: {} (ID: {})", savedUser.getNomComplet(), savedUser.getId());

            return savedUser;

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erreur de validation lors de la création de l'utilisateur: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Erreur technique lors de la création de l'utilisateur", e);
            throw new RuntimeException("Erreur technique lors de la création de l'utilisateur: " + e.getMessage());
        }
    }

    public User updateUser(Long id, User userUpdate) {
        try {
            log.info("🔄 Mise à jour de l'utilisateur ID: {}", id);

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'ID: " + id));

            // Protection de l'admin
            if ("admin@admin.com".equals(user.getEmail()) || "admin@example.com".equals(user.getEmail())) {
                throw new IllegalArgumentException("L'utilisateur admin ne peut pas être modifié");
            }

            // Mise à jour des champs
            user.setNom(userUpdate.getNom());
            user.setPrenom(userUpdate.getPrenom() != null ? userUpdate.getPrenom() : "");
            user.setEmail(userUpdate.getEmail());
            user.setRole(userUpdate.getRole());
            user.setActif(userUpdate.isActif());

            // Mise à jour du mot de passe si fourni
            if (userUpdate.getMotDePasse() != null && !userUpdate.getMotDePasse().trim().isEmpty()) {
                user.setMotDePasse(passwordEncoder.encode(userUpdate.getMotDePasse()));
                log.debug("🔒 Mot de passe mis à jour pour l'utilisateur {}", user.getEmail());
            }

            User savedUser = userRepository.save(user);
            log.info("✅ Utilisateur mis à jour avec succès: {} (ID: {})", savedUser.getNomComplet(), savedUser.getId());

            return savedUser;

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erreur de validation lors de la mise à jour de l'utilisateur {}: {}", id, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Erreur technique lors de la mise à jour de l'utilisateur {}", id, e);
            throw new RuntimeException("Erreur technique lors de la mise à jour de l'utilisateur: " + e.getMessage());
        }
    }

    public User updateUser(Long id, UserUpdateDto userUpdateDto) {
        try {
            log.info("🔄 Mise à jour de l'utilisateur ID: {} avec DTO", id);

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'ID: " + id));

            // Protection de l'admin
            if ("admin@admin.com".equals(user.getEmail()) || "admin@example.com".equals(user.getEmail())) {
                throw new IllegalArgumentException("L'utilisateur admin ne peut pas être modifié");
            }

            // Utilisation du mapper pour la mise à jour
            userMapper.updateEntityFromDto(user, userUpdateDto);

            // Encoder le nouveau mot de passe si fourni
            if (userUpdateDto.getNouveauMotDePasse() != null && !userUpdateDto.getNouveauMotDePasse().trim().isEmpty()) {
                user.setMotDePasse(passwordEncoder.encode(userUpdateDto.getNouveauMotDePasse()));
                log.debug("🔒 Mot de passe mis à jour pour l'utilisateur {}", user.getEmail());
            }

            User savedUser = userRepository.save(user);
            log.info("✅ Utilisateur mis à jour avec succès: {} (ID: {})", savedUser.getNomComplet(), savedUser.getId());

            return savedUser;

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erreur de validation lors de la mise à jour de l'utilisateur {}: {}", id, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Erreur technique lors de la mise à jour de l'utilisateur {}", id, e);
            throw new RuntimeException("Erreur technique lors de la mise à jour de l'utilisateur: " + e.getMessage());
        }
    }

    public void deleteUser(Long id) {
        try {
            log.info("🗑️ Suppression de l'utilisateur ID: {}", id);

            User user = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé avec l'ID: " + id));

            // Protection de l'admin
            if ("admin@admin.com".equals(user.getEmail()) || "admin@example.com".equals(user.getEmail())) {
                throw new IllegalArgumentException("L'utilisateur admin ne peut pas être supprimé");
            }

            // Vérifier qu'il n'y a pas de factures liées
            try {
                int totalFactures = user.getNombreFacturesCreees() +
                        user.getNombreFacturesValideesN1() +
                        user.getNombreFacturesValideesN2() +
                        user.getNombreFacturesTraitees();

                if (totalFactures > 0) {
                    throw new IllegalArgumentException("Impossible de supprimer un utilisateur ayant " + totalFactures + " factures associées");
                }
            } catch (Exception e) {
                log.warn("⚠️ Erreur lors de la vérification des factures liées, suppression autorisée");
            }

            userRepository.deleteById(id);
            log.info("✅ Utilisateur supprimé avec succès: {} (ID: {})", user.getNomComplet(), id);

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Erreur de validation lors de la suppression de l'utilisateur {}: {}", id, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Erreur technique lors de la suppression de l'utilisateur {}", id, e);
            throw new RuntimeException("Erreur technique lors de la suppression de l'utilisateur: " + e.getMessage());
        }
    }

    // ===== RECHERCHE PAR RÔLE =====

    public List<User> getValidateursV1() {
        try {
            List<User> users = userRepository.findValidateursV1Actifs();
            log.debug("🔍 {} validateurs V1 trouvés", users.size());
            return users;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des validateurs V1", e);
            throw new RuntimeException("Erreur lors de la récupération des validateurs V1: " + e.getMessage());
        }
    }

    public List<User> getValidateursV2() {
        try {
            List<User> users = userRepository.findValidateursV2Actifs();
            log.debug("🔍 {} validateurs V2 trouvés", users.size());
            return users;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des validateurs V2", e);
            throw new RuntimeException("Erreur lors de la récupération des validateurs V2: " + e.getMessage());
        }
    }

    public List<User> getTresoriers() {
        try {
            List<User> users = userRepository.findTresoriersActifs();
            log.debug("🔍 {} trésoriers trouvés", users.size());
            return users;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des trésoriers", e);
            throw new RuntimeException("Erreur lors de la récupération des trésoriers: " + e.getMessage());
        }
    }

    public List<User> getUtilisateursSaisie() {
        try {
            List<User> users = userRepository.findUtilisateursSaisieActifs();
            log.debug("🔍 {} utilisateurs de saisie trouvés", users.size());
            return users;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des utilisateurs de saisie", e);
            throw new RuntimeException("Erreur lors de la récupération des utilisateurs de saisie: " + e.getMessage());
        }
    }

    public List<User> getUsersByRole(RoleType role) {
        try {
            List<User> users = userRepository.findActiveUsersByRole(role);
            log.debug("🔍 {} utilisateurs avec le rôle {} trouvés", users.size(), role);
            return users;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la récupération des utilisateurs par rôle {}", role, e);
            throw new RuntimeException("Erreur lors de la récupération des utilisateurs par rôle: " + e.getMessage());
        }
    }

    // ===== MÉTHODES UTILITAIRES =====

    public boolean peutValiderV1(Long userId) {
        try {
            return userRepository.findById(userId)
                    .map(user -> user.getRole() == RoleType.V1 && user.isActif())
                    .orElse(false);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la vérification V1 pour l'utilisateur {}", userId, e);
            return false;
        }
    }

    public boolean peutValiderV2(Long userId) {
        try {
            return userRepository.findById(userId)
                    .map(user -> user.getRole() == RoleType.V2 && user.isActif())
                    .orElse(false);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la vérification V2 pour l'utilisateur {}", userId, e);
            return false;
        }
    }

    public boolean peutTraiterTresorerie(Long userId) {
        try {
            return userRepository.findById(userId)
                    .map(user -> user.getRole() == RoleType.T1 && user.isActif())
                    .orElse(false);
        } catch (Exception e) {
            log.error("❌ Erreur lors de la vérification trésorerie pour l'utilisateur {}", userId, e);
            return false;
        }
    }

    public List<User> searchUsers(String terme) {
        try {
            List<User> users = userRepository.findByNomOrPrenomContaining(terme);
            log.debug("🔍 {} utilisateurs trouvés pour le terme '{}'", users.size(), terme);
            return users;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la recherche d'utilisateurs avec le terme '{}'", terme, e);
            throw new RuntimeException("Erreur lors de la recherche d'utilisateurs: " + e.getMessage());
        }
    }

    public User saveUser(User user) {
        try {
            User savedUser = userRepository.save(user);
            log.debug("💾 Utilisateur sauvegardé: {}", savedUser.getEmail());
            return savedUser;
        } catch (Exception e) {
            log.error("❌ Erreur lors de la sauvegarde de l'utilisateur", e);
            throw new RuntimeException("Erreur lors de la sauvegarde de l'utilisateur: " + e.getMessage());
        }
    }

    // ===== STATISTIQUES =====

    public long countUsersByRole(RoleType role) {
        try {
            long count = userRepository.countActiveUsersByRole(role);
            log.debug("📊 {} utilisateurs actifs avec le rôle {}", count, role);
            return count;
        } catch (Exception e) {
            log.error("❌ Erreur lors du comptage des utilisateurs par rôle {}", role, e);
            return 0;
        }
    }

    public long getTotalActiveUsers() {
        try {
            long count = userRepository.findByActifTrue().size();
            log.debug("📊 {} utilisateurs actifs au total", count);
            return count;
        } catch (Exception e) {
            log.error("❌ Erreur lors du comptage total des utilisateurs actifs", e);
            return 0;
        }
    }
}