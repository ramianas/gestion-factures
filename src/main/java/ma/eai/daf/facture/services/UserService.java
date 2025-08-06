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
    private final UserMapper userMapper; // ✅ Injection du mapper

    // ===== CRUD DE BASE =====

    public List<User> getAllUsers() {
        return userRepository.findAllExceptAdmin();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Un utilisateur avec cet email existe déjà");
        }

        if (user.getRole() == RoleType.ADMIN) {
            throw new IllegalArgumentException("Impossible de créer un utilisateur avec le rôle ADMIN");
        }

        user.setMotDePasse(passwordEncoder.encode(user.getMotDePasse()));
        User savedUser = userRepository.save(user);
        log.info("Nouvel utilisateur créé: {} ({})", savedUser.getNomComplet(), savedUser.getEmail());
        return savedUser;
    }

    public User updateUser(Long id, User userUpdate) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        if ("admin@admin.com".equals(user.getEmail())) {
            throw new IllegalArgumentException("L'utilisateur admin ne peut pas être modifié");
        }

        user.setNom(userUpdate.getNom());
        user.setPrenom(userUpdate.getPrenom());
        user.setEmail(userUpdate.getEmail());
        user.setRole(userUpdate.getRole());
        user.setActif(userUpdate.isActif());

        if (userUpdate.getMotDePasse() != null && !userUpdate.getMotDePasse().isEmpty()) {
            user.setMotDePasse(passwordEncoder.encode(userUpdate.getMotDePasse()));
        }

        User savedUser = userRepository.save(user);
        log.info("Utilisateur mis à jour: {} ({})", savedUser.getNomComplet(), savedUser.getEmail());
        return savedUser;
    }

    // ✅ NOUVELLE MÉTHODE : Mise à jour avec DTO
    public User updateUser(Long id, UserUpdateDto userUpdateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        if ("admin@admin.com".equals(user.getEmail())) {
            throw new IllegalArgumentException("L'utilisateur admin ne peut pas être modifié");
        }

        // Utilisation du mapper pour la mise à jour
        userMapper.updateEntityFromDto(user, userUpdateDto);

        // Encoder le nouveau mot de passe si fourni
        if (userUpdateDto.getNouveauMotDePasse() != null && !userUpdateDto.getNouveauMotDePasse().trim().isEmpty()) {
            user.setMotDePasse(passwordEncoder.encode(userUpdateDto.getNouveauMotDePasse()));
        }

        User savedUser = userRepository.save(user);
        log.info("Utilisateur mis à jour: {} ({})", savedUser.getNomComplet(), savedUser.getEmail());
        return savedUser;
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));

        if ("admin@admin.com".equals(user.getEmail())) {
            throw new IllegalArgumentException("L'utilisateur admin ne peut pas être supprimé");
        }

        // Vérifier qu'il n'y a pas de factures liées
        if (user.getNombreFacturesCreees() > 0 ||
                user.getNombreFacturesValideesN1() > 0 ||
                user.getNombreFacturesValideesN2() > 0 ||
                user.getNombreFacturesTraitees() > 0) {
            throw new IllegalArgumentException("Impossible de supprimer un utilisateur ayant des factures associées");
        }

        userRepository.deleteById(id);
        log.info("Utilisateur supprimé: {} ({})", user.getNomComplet(), user.getEmail());
    }

    // ===== RECHERCHE PAR RÔLE =====

    public List<User> getValidateursV1() {
        return userRepository.findValidateursV1Actifs();
    }

    public List<User> getValidateursV2() {
        return userRepository.findValidateursV2Actifs();
    }

    public List<User> getTresoriers() {
        return userRepository.findTresoriersActifs();
    }

    public List<User> getUtilisateursSaisie() {
        return userRepository.findUtilisateursSaisieActifs();
    }

    public List<User> getUsersByRole(RoleType role) {
        return userRepository.findActiveUsersByRole(role);
    }

    // ===== MÉTHODES UTILITAIRES =====

    public boolean peutValiderV1(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == RoleType.V1 && user.isActif())
                .orElse(false);
    }

    public boolean peutValiderV2(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == RoleType.V2 && user.isActif())
                .orElse(false);
    }

    public boolean peutTraiterTresorerie(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getRole() == RoleType.T1 && user.isActif())
                .orElse(false);
    }

    public List<User> searchUsers(String terme) {
        return userRepository.findByNomOrPrenomContaining(terme);
    }

    // ===== STATISTIQUES =====

    public long countUsersByRole(RoleType role) {
        return userRepository.countActiveUsersByRole(role);
    }

    public long getTotalActiveUsers() {
        return userRepository.findByActifTrue().size();
    }
}