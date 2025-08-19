// Fichier: src/main/java/ma/eai/daf/facture/services/FactureDataInitializerService.java

package ma.eai.daf.facture.services;

import ma.eai.daf.facture.entities.Facture;
import ma.eai.daf.facture.entities.User;
import ma.eai.daf.facture.enums.*;
import ma.eai.daf.facture.repositories.FactureRepository;
import ma.eai.daf.facture.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
@Order(2) // Exécuter après l'initialisation des utilisateurs
public class FactureDataInitializerService implements CommandLineRunner {

    private final FactureRepository factureRepository;
    private final UserRepository userRepository;
    private final Random random = new Random();

    @Override
    @Transactional
    public void run(String... args) {
        if (factureRepository.count() == 0) {
            log.info("🧾 Initialisation des factures de test...");
            createTestFactures();
            log.info("✅ {} factures de test créées", factureRepository.count());
        } else {
            log.info("📋 Des factures existent déjà, skip de l'initialisation");
        }
    }

    private void createTestFactures() {
        // Récupérer les utilisateurs
        List<User> utilisateursU1 = userRepository.findUtilisateursSaisieActifs();
        List<User> validateursV1 = userRepository.findValidateursV1Actifs();
        List<User> validateursV2 = userRepository.findValidateursV2Actifs();
        List<User> tresoriers = userRepository.findTresoriersActifs();

        if (utilisateursU1.isEmpty() || validateursV1.isEmpty() ||
                validateursV2.isEmpty() || tresoriers.isEmpty()) {
            log.warn("⚠️ Pas assez d'utilisateurs pour créer des factures de test");
            return;
        }

        User userU1 = utilisateursU1.get(0);
        User validateurV1 = validateursV1.get(0);
        User validateurV2 = validateursV2.get(0);
        User tresorier = tresoriers.get(0);

        // 1. Factures en SAISIE (créées par U1)
        createFacturesSaisie(userU1, validateurV1, validateurV2, tresorier);

        // 2. Factures en VALIDATION_V1 (soumises par U1, assignées à V1)
        createFacturesEnValidationV1(userU1, validateurV1, validateurV2, tresorier);

        // 3. Factures en VALIDATION_V2 (validées par V1, assignées à V2)
        createFacturesEnValidationV2(userU1, validateurV1, validateurV2, tresorier);

        // 4. Factures en TRESORERIE (validées par V2, assignées au trésorier)
        createFacturesEnTresorerie(userU1, validateurV1, validateurV2, tresorier);

        // 5. Factures PAYEES (complètement traitées)
        createFacturesPayees(userU1, validateurV1, validateurV2, tresorier);

        // 6. Quelques factures REJETEES
        createFacturesRejetees(userU1, validateurV1, validateurV2, tresorier);
    }

    private void createFacturesSaisie(User createur, User v1, User v2, User tresorier) {
        String[] fournisseurs = {
                "MAROC TELECOM", "AMENDIS", "LYDEC", "OFFICE CHÉRIFIEN DES PHOSPHATES",
                "RAM", "ONCF", "SOREC", "SOCIÉTÉ GÉNÉRALE MAROC"
        };

        for (int i = 0; i < 5; i++) {
            Facture facture = Facture.builder()
                    .numero("FACT2024" + String.format("%03d", i + 1))
                    .nomFournisseur(fournisseurs[random.nextInt(fournisseurs.length)])
                    .formeJuridique(FormeJuridiqueType.values()[random.nextInt(FormeJuridiqueType.values().length)])
                    .dateFacture(LocalDate.now().minusDays(random.nextInt(30)))
                    .dateReception(LocalDate.now().minusDays(random.nextInt(5)))
                    .montantHT(new BigDecimal(1000 + random.nextInt(9000)))
                    .tauxTVA(new BigDecimal("20.00"))
                    .modalite(ModaliteType.values()[random.nextInt(ModaliteType.values().length)])
                    .refacturable(random.nextBoolean())
                    .designation("Prestation de services - " + (i + 1))
                    .refCommande("CMD2024-" + String.format("%03d", i + 1))
                    .periode("2024-" + String.format("%02d", random.nextInt(12) + 1))
                    .statut(StatutFacture.SAISIE)
                    .createur(createur)
                    .validateur1(v1)
                    .validateur2(v2)
                    .tresorier(tresorier)
                    .commentaires("Facture en cours de saisie")
                    .dateCreation(LocalDateTime.now().minusDays(random.nextInt(10)))
                    .dateModification(LocalDateTime.now().minusDays(random.nextInt(5)))
                    .build();

            factureRepository.save(facture);
        }
        log.info("✅ 5 factures en SAISIE créées");
    }

    private void createFacturesEnValidationV1(User createur, User v1, User v2, User tresorier) {
        String[] fournisseurs = {
                "WANA CORPORATE", "INWI", "REDAL", "RADEEMA", "RADEEF",
                "RADEEC", "RADEES", "ADM"
        };

        for (int i = 0; i < 7; i++) {
            Facture facture = Facture.builder()
                    .numero("FACT2024" + String.format("%03d", i + 101))
                    .nomFournisseur(fournisseurs[random.nextInt(fournisseurs.length)])
                    .formeJuridique(FormeJuridiqueType.values()[random.nextInt(FormeJuridiqueType.values().length)])
                    .dateFacture(LocalDate.now().minusDays(random.nextInt(30) + 10))
                    .dateReception(LocalDate.now().minusDays(random.nextInt(5) + 5))
                    .montantHT(new BigDecimal(2000 + random.nextInt(8000)))
                    .tauxTVA(new BigDecimal("20.00"))
                    .modalite(ModaliteType.values()[random.nextInt(ModaliteType.values().length)])
                    .refacturable(random.nextBoolean())
                    .designation("Services techniques - " + (i + 1))
                    .refCommande("CMD2024-" + String.format("%03d", i + 101))
                    .periode("2024-" + String.format("%02d", random.nextInt(12) + 1))
                    .statut(StatutFacture.EN_VALIDATION_V1)
                    .createur(createur)
                    .validateur1(v1)
                    .validateur2(v2)
                    .tresorier(tresorier)
                    .commentaires("En attente de validation V1")
                    .dateCreation(LocalDateTime.now().minusDays(random.nextInt(15) + 5))
                    .dateModification(LocalDateTime.now().minusDays(random.nextInt(8) + 2))
                    .build();

            factureRepository.save(facture);
        }
        log.info("✅ 7 factures en VALIDATION_V1 créées");
    }

    private void createFacturesEnValidationV2(User createur, User v1, User v2, User tresorier) {
        String[] fournisseurs = {
                "SONASID", "COSUMAR", "ATTIJARIWAFA BANK", "BMCE BANK",
                "CDG", "CIH BANK", "CRÉDIT AGRICOLE DU MAROC"
        };

        for (int i = 0; i < 6; i++) {
            Facture facture = Facture.builder()
                    .numero("FACT2024" + String.format("%03d", i + 201))
                    .nomFournisseur(fournisseurs[random.nextInt(fournisseurs.length)])
                    .formeJuridique(FormeJuridiqueType.values()[random.nextInt(FormeJuridiqueType.values().length)])
                    .dateFacture(LocalDate.now().minusDays(random.nextInt(40) + 15))
                    .dateReception(LocalDate.now().minusDays(random.nextInt(10) + 8))
                    .montantHT(new BigDecimal(3000 + random.nextInt(7000)))
                    .tauxTVA(new BigDecimal("20.00"))
                    .modalite(ModaliteType.values()[random.nextInt(ModaliteType.values().length)])
                    .refacturable(random.nextBoolean())
                    .designation("Prestation financière - " + (i + 1))
                    .refCommande("CMD2024-" + String.format("%03d", i + 201))
                    .periode("2024-" + String.format("%02d", random.nextInt(12) + 1))
                    .statut(StatutFacture.EN_VALIDATION_V2)
                    .createur(createur)
                    .validateur1(v1)
                    .validateur2(v2)
                    .tresorier(tresorier)
                    .commentaires("Validée par V1, en attente V2")
                    .dateCreation(LocalDateTime.now().minusDays(random.nextInt(20) + 10))
                    .dateModification(LocalDateTime.now().minusDays(random.nextInt(10) + 5))
                    .dateValidationV1(LocalDateTime.now().minusDays(random.nextInt(8) + 3))
                    .build();

            factureRepository.save(facture);
        }
        log.info("✅ 6 factures en VALIDATION_V2 créées");
    }

    private void createFacturesEnTresorerie(User createur, User v1, User v2, User tresorier) {
        String[] fournisseurs = {
                "HOLCIM MAROC", "LAFARGEHOLCIM", "MANAGEM", "SMI",
                "ADDOHA", "ALLIANCES", "RÉSIDENCES DAR SAADA"
        };

        for (int i = 0; i < 8; i++) {
            Facture facture = Facture.builder()
                    .numero("FACT2024" + String.format("%03d", i + 301))
                    .nomFournisseur(fournisseurs[random.nextInt(fournisseurs.length)])
                    .formeJuridique(FormeJuridiqueType.values()[random.nextInt(FormeJuridiqueType.values().length)])
                    .dateFacture(LocalDate.now().minusDays(random.nextInt(50) + 20))
                    .dateReception(LocalDate.now().minusDays(random.nextInt(15) + 12))
                    .montantHT(new BigDecimal(5000 + random.nextInt(15000)))
                    .tauxTVA(new BigDecimal("20.00"))
                    .modalite(ModaliteType.values()[random.nextInt(ModaliteType.values().length)])
                    .refacturable(random.nextBoolean())
                    .designation("Travaux et fournitures - " + (i + 1))
                    .refCommande("CMD2024-" + String.format("%03d", i + 301))
                    .periode("2024-" + String.format("%02d", random.nextInt(12) + 1))
                    .statut(StatutFacture.EN_TRESORERIE)
                    .createur(createur)
                    .validateur1(v1)
                    .validateur2(v2)
                    .tresorier(tresorier)
                    .commentaires("Validée par V1 et V2, prête pour paiement")
                    .dateCreation(LocalDateTime.now().minusDays(random.nextInt(30) + 15))
                    .dateModification(LocalDateTime.now().minusDays(random.nextInt(15) + 8))
                    .dateValidationV1(LocalDateTime.now().minusDays(random.nextInt(12) + 6))
                    .dateValidationV2(LocalDateTime.now().minusDays(random.nextInt(8) + 4))
                    .build();

            factureRepository.save(facture);
        }
        log.info("✅ 8 factures en TRESORERIE créées");
    }

    private void createFacturesPayees(User createur, User v1, User v2, User tresorier) {
        String[] fournisseurs = {
                "TOTAL MAROC", "SHELL MAROC", "AFRIQUIA GAZ", "VIVO ENERGY",
                "SAMIR", "AGADIR HALTE", "MARSA MAROC"
        };

        for (int i = 0; i < 10; i++) {
            Facture facture = Facture.builder()
                    .numero("FACT2024" + String.format("%03d", i + 401))
                    .nomFournisseur(fournisseurs[random.nextInt(fournisseurs.length)])
                    .formeJuridique(FormeJuridiqueType.values()[random.nextInt(FormeJuridiqueType.values().length)])
                    .dateFacture(LocalDate.now().minusDays(random.nextInt(60) + 30))
                    .dateReception(LocalDate.now().minusDays(random.nextInt(20) + 18))
                    .montantHT(new BigDecimal(4000 + random.nextInt(12000)))
                    .tauxTVA(new BigDecimal("20.00"))
                    .modalite(ModaliteType.values()[random.nextInt(ModaliteType.values().length)])
                    .refacturable(random.nextBoolean())
                    .designation("Approvisionnement - " + (i + 1))
                    .refCommande("CMD2024-" + String.format("%03d", i + 401))
                    .periode("2024-" + String.format("%02d", random.nextInt(12) + 1))
                    .statut(StatutFacture.PAYEE)
                    .createur(createur)
                    .validateur1(v1)
                    .validateur2(v2)
                    .tresorier(tresorier)
                    .commentaires("Facture payée avec succès")
                    .referencePaiement("PAY2024-" + String.format("%03d", i + 401))
                    .datePaiement(LocalDate.now().minusDays(random.nextInt(10) + 1))
                    .dateCreation(LocalDateTime.now().minusDays(random.nextInt(40) + 25))
                    .dateModification(LocalDateTime.now().minusDays(random.nextInt(20) + 15))
                    .dateValidationV1(LocalDateTime.now().minusDays(random.nextInt(15) + 10))
                    .dateValidationV2(LocalDateTime.now().minusDays(random.nextInt(10) + 8))
                    .build();

            factureRepository.save(facture);
        }
        log.info("✅ 10 factures PAYEES créées");
    }

    private void createFacturesRejetees(User createur, User v1, User v2, User tresorier) {
        String[] fournisseurs = {
                "DIVERS FOURNISSEURS", "ENTREPRISE XYZ", "SOCIÉTÉ ABC"
        };

        for (int i = 0; i < 3; i++) {
            Facture facture = Facture.builder()
                    .numero("FACT2024" + String.format("%03d", i + 501))
                    .nomFournisseur(fournisseurs[random.nextInt(fournisseurs.length)])
                    .formeJuridique(FormeJuridiqueType.values()[random.nextInt(FormeJuridiqueType.values().length)])
                    .dateFacture(LocalDate.now().minusDays(random.nextInt(45) + 25))
                    .dateReception(LocalDate.now().minusDays(random.nextInt(15) + 15))
                    .montantHT(new BigDecimal(1500 + random.nextInt(5000)))
                    .tauxTVA(new BigDecimal("20.00"))
                    .modalite(ModaliteType.values()[random.nextInt(ModaliteType.values().length)])
                    .refacturable(random.nextBoolean())
                    .designation("Prestation rejetée - " + (i + 1))
                    .refCommande("CMD2024-" + String.format("%03d", i + 501))
                    .periode("2024-" + String.format("%02d", random.nextInt(12) + 1))
                    .statut(StatutFacture.REJETEE)
                    .createur(createur)
                    .validateur1(v1)
                    .validateur2(v2)
                    .tresorier(tresorier)
                    .commentaires("Facture rejetée - documents manquants")
                    .sortOuStatut("Rejetée par V1 - Informations incomplètes")
                    .dateCreation(LocalDateTime.now().minusDays(random.nextInt(35) + 20))
                    .dateModification(LocalDateTime.now().minusDays(random.nextInt(20) + 12))
                    .build();

            factureRepository.save(facture);
        }
        log.info("✅ 3 factures REJETEES créées");
    }
}