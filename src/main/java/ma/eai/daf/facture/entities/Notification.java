package ma.eai.daf.facture.entities;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "daf_notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ide_notification")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ide_destinataire", nullable = false)
    private User destinataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ide_facture")
    private Facture facture;

    @Column(name = "titre", nullable = false, length = 200)
    private String titre;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    @Column(name = "date_envoi", nullable = false)
    private LocalDateTime dateEnvoi;

    @Column(name = "date_lecture")
    private LocalDateTime dateLecture;

    @Column(name = "lue")
    private Boolean lue = false;

    @Column(name = "type_notification", length = 50)
    private String typeNotification;

    @Column(name = "urgence")
    private Boolean urgence = false;

    @PrePersist
    protected void onCreate() {
        dateEnvoi = LocalDateTime.now();
    }

    public boolean estLue() {
        return lue != null && lue;
    }

    public void marquerCommeLue() {
        this.lue = true;
        this.dateLecture = LocalDateTime.now();
    }
}