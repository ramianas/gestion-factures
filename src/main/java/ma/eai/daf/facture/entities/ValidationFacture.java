package ma.eai.daf.facture.entities;

import ma.eai.daf.facture.enums.StatutFacture;
import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "daf_validations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ValidationFacture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ide_validation")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ide_facture", nullable = false)
    private Facture facture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ide_user", nullable = false)
    private User utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_precedent", nullable = false)
    private StatutFacture statutPrecedent;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_nouveau", nullable = false)
    private StatutFacture statutNouveau;

    @Column(name = "date_validation", nullable = false)
    private LocalDateTime dateValidation;

    @Column(name = "commentaire", length = 500)
    private String commentaire;

    @Column(name = "approuve")
    private Boolean approuve;

    @Column(name = "niveau_validation", length = 10)
    private String niveauValidation; // "V1", "V2", "T1"

    @PrePersist
    protected void onCreate() {
        dateValidation = LocalDateTime.now();
    }
}