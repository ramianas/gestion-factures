// Fichier: src/main/java/ma/eai/daf/facture/services/DataInitializationService.java

package ma.eai.daf.facture.services;

import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.RoleType;
import ma.eai.daf.facture.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataInitializationService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("🚀 Initialisation des données de base...");

        createInitialUsers();

        log.info("✅ Initialisation des données terminée");
    }

    private void createInitialUsers() {
        // Vérifier si des utilisateurs existent déjà
        if (userRepository.count() > 0) {
            log.info("Des utilisateurs existent déjà, skip de l'initialisation");
            return;
        }

        log.info("Création des utilisateurs par défaut...");

        // 1. Administrateur
        createUserIfNotExists(
                "admin@example.com",
                "admin123",
                "Admin",
                "Système",
                RoleType.ADMIN
        );

        // 2. Utilisateurs de saisie (U1)
        createUserIfNotExists(
                "u1@example.com",
                "admin123",
                "Saisie",
                "User",
                RoleType.U1
        );

        // 3. Validateurs V1
        createUserIfNotExists(
                "v1@example.com",
                "admin123",
                "Valideur1",
                "User",
                RoleType.V1
        );

        // 4. Validateurs V2
        createUserIfNotExists(
                "v2@example.com",
                "admin123",
                "Valideur2",
                "User",
                RoleType.V2
        );

        // 5. Trésoriers
        createUserIfNotExists(
                "t1@example.com",
                "admin123",
                "Tresorier",
                "User",
                RoleType.T1
        );

        log.info("✅ {} utilisateurs créés", userRepository.count());
    }

    private void createUserIfNotExists(String email, String password, String nom, String prenom, RoleType role) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .motDePasse(passwordEncoder.encode(password))
                    .nom(nom)
                    .prenom(prenom)
                    .role(role)
                    .actif(true)
                    .build();

            userRepository.save(user);
            log.info("👤 Utilisateur créé: {} ({}) - {}", user.getNomComplet(), email, role);
        }
    }

    // Méthode pour créer des données de test supplémentaires
    public void createTestData() {
        log.info("🧪 Création de données de test...");

        // Ici, vous pourriez ajouter la création de factures de test, etc.

        log.info("✅ Données de test créées");
    }
}