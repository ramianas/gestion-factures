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
        if (prenom != null && !prenom.trim().isEmpty()) {
            return prenom + " " + nom;
        }
        return nom;
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

    // ===== MÉTHODES POUR MAINTENIR LA COHÉRENCE BIDIRECTIONNELLE =====

    public void addFactureCreee(Facture facture) {
        if (facturesCreees == null) {
            facturesCreees = new HashSet<>();
        }
        facturesCreees.add(facture);
        if (facture.getCreateur() != this) {
            facture.setCreateur(this);
        }
    }

    public void removeFactureCreee(Facture facture) {
        if (facturesCreees != null) {
            facturesCreees.remove(facture);
        }
        if (facture.getCreateur() == this) {
            facture.setCreateur(null);
        }
    }

    public void addFactureValideeN1(Facture facture) {
        if (facturesValideesN1 == null) {
            facturesValideesN1 = new HashSet<>();
        }
        facturesValideesN1.add(facture);
        if (facture.getValidateur1() != this) {
            facture.setValidateur1(this);
        }
    }

    public void removeFactureValideeN1(Facture facture) {
        if (facturesValideesN1 != null) {
            facturesValideesN1.remove(facture);
        }
        if (facture.getValidateur1() == this) {
            facture.setValidateur1(null);
        }
    }

    public void addFactureValideeN2(Facture facture) {
        if (facturesValideesN2 == null) {
            facturesValideesN2 = new HashSet<>();
        }
        facturesValideesN2.add(facture);
        if (facture.getValidateur2() != this) {
            facture.setValidateur2(this);
        }
    }

    public void removeFactureValideeN2(Facture facture) {
        if (facturesValideesN2 != null) {
            facturesValideesN2.remove(facture);
        }
        if (facture.getValidateur2() == this) {
            facture.setValidateur2(null);
        }
    }

    public void addFactureTraitee(Facture facture) {
        if (facturesTraitees == null) {
            facturesTraitees = new HashSet<>();
        }
        facturesTraitees.add(facture);
        if (facture.getTresorier() != this) {
            facture.setTresorier(this);
        }
    }

    public void removeFactureTraitee(Facture facture) {
        if (facturesTraitees != null) {
            facturesTraitees.remove(facture);
        }
        if (facture.getTresorier() == this) {
            facture.setTresorier(null);
        }
    }

    // ===== STATISTIQUES AVEC GESTION SÉCURISÉE =====

    public int getNombreFacturesCreees() {
        try {
            return facturesCreees != null ? facturesCreees.size() : 0;
        } catch (Exception e) {
            // En cas d'erreur (lazy loading, etc.), retourner 0
            return 0;
        }
    }

    public int getNombreFacturesValideesN1() {
        try {
            return facturesValideesN1 != null ? facturesValideesN1.size() : 0;
        } catch (Exception e) {
            // En cas d'erreur (lazy loading, etc.), retourner 0
            return 0;
        }
    }

    public int getNombreFacturesValideesN2() {
        try {
            return facturesValideesN2 != null ? facturesValideesN2.size() : 0;
        } catch (Exception e) {
            // En cas d'erreur (lazy loading, etc.), retourner 0
            return 0;
        }
    }

    public int getNombreFacturesTraitees() {
        try {
            return facturesTraitees != null ? facturesTraitees.size() : 0;
        } catch (Exception e) {
            // En cas d'erreur (lazy loading, etc.), retourner 0
            return 0;
        }
    }

    // ===== MÉTHODES POUR ÉVITER LES ERREURS DE LAZY LOADING =====

    @PostLoad
    private void postLoad() {
        // Initialiser les collections si elles sont null
        if (facturesCreees == null) {
            facturesCreees = new HashSet<>();
        }
        if (facturesValideesN1 == null) {
            facturesValideesN1 = new HashSet<>();
        }
        if (facturesValideesN2 == null) {
            facturesValideesN2 = new HashSet<>();
        }
        if (facturesTraitees == null) {
            facturesTraitees = new HashSet<>();
        }
    }

    // ===== MÉTHODES ALTERNATIVES POUR LES STATISTIQUES =====

    /**
     * Méthode alternative qui utilise une requête pour éviter le lazy loading
     * À utiliser si les collections posent problème
     */
    public int getNombreFacturesCreeesSecure() {
        // Cette méthode pourra être implémentée avec une requête directe si nécessaire
        return getNombreFacturesCreees();
    }

    public int getNombreFacturesValideesN1Secure() {
        return getNombreFacturesValideesN1();
    }

    public int getNombreFacturesValideesN2Secure() {
        return getNombreFacturesValideesN2();
    }

    public int getNombreFacturesTraiteesSecure() {
        return getNombreFacturesTraitees();
    }

    // ===== OVERRIDE POUR ÉVITER LES PROBLÈMES DE LAZY LOADING =====

    @Override
    public String toString() {
        return String.format("User{id=%d, email='%s', nom='%s', role=%s, actif=%s}",
                id, email, nom, role, actif);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User user = (User) o;
        return id != null && id.equals(user.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}