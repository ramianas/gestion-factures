package ma.eai.daf.facture.entities;

import ma.eai.daf.facture.enums.StatutFacture;
import ma.eai.daf.facture.enums.ModaliteType;
import ma.eai.daf.facture.enums.FormeJuridiqueType;
import lombok.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daf_factures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ide_facture")
    private Long id;

    @Column(name = "numero", unique = true, length = 100)
    private String numero;

    // ===== RELATIONS AVEC USER =====

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_creation", nullable = false)
    private User createur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validateur1_id")
    private User validateur1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "validateur2_id")
    private User validateur2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tresorier_id")
    private User tresorier;

    // ===== INFORMATIONS FOURNISSEUR =====
    @Column(name = "nom_fournisseur", nullable = false, length = 200)
    private String nomFournisseur;

    @Enumerated(EnumType.STRING)
    @Column(name = "forme_juridique")
    private FormeJuridiqueType formeJuridique;

    // ===== DATES =====
    @Column(name = "date_facture", nullable = false)
    private LocalDate dateFacture;

    @Column(name = "date_reception")
    private LocalDate dateReception;

    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @Column(name = "date_livraison")
    private LocalDate dateLivraison;

    // ===== MONTANTS =====
    @Column(name = "montant_ht", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantHT;

    @Column(name = "taux_tva", precision = 5, scale = 2)
    private BigDecimal tauxTVA;

    @Column(name = "montant_ttc", precision = 15, scale = 2)
    private BigDecimal montantTTC;

    @Column(name = "montant_tva", precision = 15, scale = 2)
    private BigDecimal montantTVA;

    @Column(name = "ras_tva", precision = 15, scale = 2)
    private BigDecimal rasTVA;

    // ===== MODALITÉ ===
    @Enumerated(EnumType.STRING)
    @Column(name = "modalite")
    private ModaliteType modalite;

    @Column(name = "refacturable")
    private Boolean refacturable = false;

    // ===== RÉFÉRENCES ===
    @Column(name = "designation", length = 500)
    private String designation;

    @Column(name = "ref_commande", length = 100)
    private String refCommande;

    @Column(name = "periode", length = 50)
    private String periode;

    // ===== VALIDATION ===
    @Column(name = "date_validation_v1")
    private LocalDateTime dateValidationV1;

    @Column(name = "date_validation_v2")
    private LocalDateTime dateValidationV2;

    @Column(name = "date_reference_absence_accord")
    private LocalDate dateReferenceAbsenceAccord;

    @Column(name = "sort_ou_statut", length = 100)
    private String sortOuStatut;

    // ===== TRÉSORERIE ===
    @Column(name = "reference_paiement", length = 200)
    private String referencePaiement;

    @Column(name = "date_paiement")
    private LocalDate datePaiement;

    @Column(name = "etranger_local", length = 50)
    private String etrangerLocal;

    // ===== STATUT ===
    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    private StatutFacture statut = StatutFacture.SAISIE;

    // ===== PIÈCE JOINTE ===
    @Column(name = "piece_jointe_nom")
    private String pieceJointeNom;

    @Column(name = "piece_jointe_chemin")
    private String pieceJointeChemin;

    @Column(name = "piece_jointe_taille")
    private Long pieceJointeTaille;

    @Column(name = "piece_jointe_type_mime")
    private String pieceJointeTypeMime;

    // ===== MÉTADONNÉES ===
    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @Column(name = "commentaires", length = 1000)
    private String commentaires;

    // ===== MÉTHODES LIFECYCLE ===
    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        dateModification = LocalDateTime.now();

        // Calcul automatique de la date d'échéance si modalité définie
        if (modalite != null && dateFacture != null && dateEcheance == null) {
            dateEcheance = dateFacture.plusDays(modalite.getDelaiJours());
        }

        // Calculs automatiques des montants
        calculerMontants();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModification = LocalDateTime.now();

        // Recalcul de la date d'échéance si modalité ou date facture modifiée
        if (modalite != null && dateFacture != null) {
            dateEcheance = dateFacture.plusDays(modalite.getDelaiJours());
        }

        // Recalculs automatiques des montants
        calculerMontants();
    }

    private void calculerMontants() {
        if (montantHT != null && tauxTVA != null) {
            montantTVA = montantHT.multiply(tauxTVA).divide(BigDecimal.valueOf(100));
            montantTTC = montantHT.add(montantTVA);

            // Déduction RAS TVA si applicable
            if (rasTVA != null && rasTVA.compareTo(BigDecimal.ZERO) > 0) {
                montantTTC = montantTTC.subtract(rasTVA);
            }
        }
    }

    // ===== MÉTHODES UTILITAIRES =====
    public boolean peutEtreModifiee() {
        return statut == StatutFacture.SAISIE;
    }

    public boolean peutEtreValideeParV1() {
        return statut == StatutFacture.EN_VALIDATION_V1;
    }

    public boolean peutEtreValideeParV2() {
        return statut == StatutFacture.EN_VALIDATION_V2;
    }

    public boolean peutEtreTraiteeParTresorier() {
        return statut == StatutFacture.EN_TRESORERIE;
    }

    public boolean estValidee() {
        return statut == StatutFacture.VALIDEE || statut == StatutFacture.PAYEE;
    }

    public boolean estPayee() {
        return statut == StatutFacture.PAYEE;
    }

    // Calcul du nombre de jours avant échéance
    public long getJoursAvantEcheance() {
        if (dateEcheance == null) return 0;
        return LocalDate.now().until(dateEcheance, java.time.temporal.ChronoUnit.DAYS);
    }

    // Vérifier si la facture est en retard
    public boolean estEnRetard() {
        return dateEcheance != null && LocalDate.now().isAfter(dateEcheance) && !estPayee();
    }

    public void setCreateur(User createur) {
        // Retirer l'ancienne association
        if (this.createur != null) {
            this.createur.removeFactureCreee(this); // ✅ Utilise la méthode utilitaire
        }

        // Définir le nouveau créateur
        this.createur = createur;

        // Ajouter la nouvelle association
        if (createur != null) {
            createur.addFactureCreee(this); // ✅ Utilise la méthode utilitaire
        }
    }

    public void setValidateur1(User validateur1) {
        if (this.validateur1 != null) {
            this.validateur1.removeFactureValideeN1(this);
        }
        this.validateur1 = validateur1;
        if (validateur1 != null) {
            validateur1.addFactureValideeN1(this);
        }
    }

    public void setValidateur2(User validateur2) {
        if (this.validateur2 != null) {
            this.validateur2.removeFactureValideeN2(this);
        }
        this.validateur2 = validateur2;
        if (validateur2 != null) {
            validateur2.addFactureValideeN2(this);
        }
    }

    public void setTresorier(User tresorier) {
        if (this.tresorier != null) {
            this.tresorier.removeFactureTraitee(this);
        }
        this.tresorier = tresorier;
        if (tresorier != null) {
            tresorier.addFactureTraitee(this);
        }
    }

    // Workflow de validation
    public void validerParV1(User validateur) {
        if (!validateur.isValidateurV1()) {
            throw new IllegalArgumentException("L'utilisateur n'est pas un validateur V1");
        }
        this.statut = StatutFacture.EN_VALIDATION_V2;
        this.dateValidationV1 = LocalDateTime.now();
        setValidateur1(validateur);
    }

    public void validerParV2(User validateur) {
        if (!validateur.isValidateurV2()) {
            throw new IllegalArgumentException("L'utilisateur n'est pas un validateur V2");
        }
        this.statut = StatutFacture.EN_TRESORERIE;
        this.dateValidationV2 = LocalDateTime.now();
        setValidateur2(validateur);
    }

    public void traiterParTresorier(User tresorier) {
        if (!tresorier.isTresorier()) {
            throw new IllegalArgumentException("L'utilisateur n'est pas un trésorier");
        }
        this.statut = StatutFacture.PAYEE;
        this.datePaiement = LocalDate.now();
        setTresorier(tresorier);
    }

    public void rejeter(String motif) {
        this.statut = StatutFacture.REJETEE;
        this.sortOuStatut = motif;
    }
}
