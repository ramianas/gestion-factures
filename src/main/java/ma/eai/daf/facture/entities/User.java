package ma.eai.daf.facture.entities;

import ma.eai.daf.facture.enums.RoleType;
import lombok.*;
import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "daf_users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ide_user")
    private Long id;

    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @Column(name = "prenom", length = 100)
    private String prenom;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String motDePasse;

    @Column(name = "actif")
    private boolean actif = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private RoleType role;

    // ===== RELATIONS BIDIRECTIONNELLES AVEC FACTURE =====

    @OneToMany(mappedBy = "createur", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Facture> facturesCreees = new HashSet<>();

    @OneToMany(mappedBy = "validateur1", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Facture> facturesValideesN1 = new HashSet<>();

    @OneToMany(mappedBy = "validateur2", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Facture> facturesValideesN2 = new HashSet<>();

    @OneToMany(mappedBy = "tresorier", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Facture> facturesTraitees = new HashSet<>();

    // ===== MÉTHODES UTILITAIRES =====

    public String getNomComplet() {
        return (prenom != null ? prenom + " " : "") + nom;
    }

    public boolean isValidateurV1() {
        return role == RoleType.V1;
    }

    public boolean isValidateurV2() {
        return role == RoleType.V2;
    }

    public boolean isTresorier() {
        return role == RoleType.T1;
    }

    public boolean isUtilisateurSaisie() {
        return role == RoleType.U1;
    }

    public boolean isAdmin() {
        return role == RoleType.ADMIN;
    }

    // Méthodes d'ajout sécurisées pour maintenir la cohérence bidirectionnelle
    public void addFactureCreee(Facture facture) {
        facturesCreees.add(facture);
        facture.setCreateur(this);
    }

    public void removeFactureCreee(Facture facture) {
        facturesCreees.remove(facture);
        facture.setCreateur(null);
    }

    public void addFactureValideeN1(Facture facture) {
        facturesValideesN1.add(facture);
        facture.setValidateur1(this);
    }

    public void removeFactureValideeN1(Facture facture) {
        facturesValideesN1.remove(facture);
        facture.setValidateur1(null);
    }

    public void addFactureValideeN2(Facture facture) {
        facturesValideesN2.add(facture);
        facture.setValidateur2(this);
    }

    public void removeFactureValideeN2(Facture facture) {
        facturesValideesN2.remove(facture);
        facture.setValidateur2(null);
    }

    public void addFactureTraitee(Facture facture) {
        facturesTraitees.add(facture);
        facture.setTresorier(this);
    }

    public void removeFactureTraitee(Facture facture) {
        facturesTraitees.remove(facture);
        facture.setTresorier(null);
    }

    // Statistiques
    public int getNombreFacturesCreees() {
        return facturesCreees.size();
    }

    public int getNombreFacturesValideesN1() {
        return facturesValideesN1.size();
    }

    public int getNombreFacturesValideesN2() {
        return facturesValideesN2.size();
    }

    public int getNombreFacturesTraitees() {
        return facturesTraitees.size();
    }
}
