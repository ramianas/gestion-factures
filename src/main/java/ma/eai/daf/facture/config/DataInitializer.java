// Fichier: src/main/java/ma/eai/daf/facture/config/DataInitializer.java

package ma.eai.daf.facture.config;

import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.RoleType;
import ma.eai.daf.facture.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeUsers();
    }

    private void initializeUsers() {
        log.info("🚀 Initialisation des utilisateurs par défaut...");

        // Créer l'administrateur
        createUserIfNotExists(
                "admin@factureapp.com",
                "admin123",
                "Admin",
                "Système",
                RoleType.ADMIN
        );

        // Créer des utilisateurs de saisie (U1)
        createUserIfNotExists(
                "user@factureapp.com",
                "user123",
                "Dupont",
                "Jean",
                RoleType.U1
        );

        createUserIfNotExists(
                "marie.saisie@factureapp.com",
                "marie123",
                "Martin",
                "Marie",
                RoleType.U1
        );

        // Créer des validateurs V1
        createUserIfNotExists(
                "validator1@factureapp.com",
                "validator123",
                "Leroy",
                "Sophie",
                RoleType.V1
        );

        createUserIfNotExists(
                "pierre.v1@factureapp.com",
                "pierre123",
                "Bernard",
                "Pierre",
                RoleType.V1
        );

        // Créer des validateurs V2
        createUserIfNotExists(
                "validator2@factureapp.com",
                "validator123",
                "Moreau",
                "Jean",
                RoleType.V2
        );

        createUserIfNotExists(
                "claire.v2@factureapp.com",
                "claire123",
                "Petit",
                "Claire",
                RoleType.V2
        );

        // Créer des trésoriers (T1)
        createUserIfNotExists(
                "treasurer@factureapp.com",
                "treasurer123",
                "Durand",
                "Anne",
                RoleType.T1
        );

        createUserIfNotExists(
                "michel.tresorier@factureapp.com",
                "michel123",
                "Rousseau",
                "Michel",
                RoleType.T1
        );

        log.info("✅ Initialisation des utilisateurs terminée");
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
        } else {
            log.debug("👤 Utilisateur existe déjà: {}", email);
        }
    }
}