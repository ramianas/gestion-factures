// Fichier: facture-front1/src/app/demo/administration/gestion-utilisateurs/gestion-utilisateurs.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Import des composants partagés
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Import des services
import { AuthService, User } from '../../../services/auth.service';
import { UserService, UserDto } from '../services/user.service';

@Component({
  selector: 'app-gestion-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './gestion-utilisateurs.component.html',
  styleUrls: ['./gestion-utilisateurs.component.scss']
})
export class GestionUtilisateursComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // État du composant
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentUser: User | null = null;

  // Données
  utilisateurs: UserDto[] = [];
  utilisateursFiltres: UserDto[] = [];

  // Modal et formulaires
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  utilisateurSelectionne: UserDto | null = null;

  // Formulaire de création/modification
  userForm = {
    nom: '',
    prenom: '',
    email: '',
    role: 'U1',
    actif: true,
    nouveauMotDePasse: ''
  };

  // Filtres et recherche
  filtreRole = '';
  filtreStatut = '';
  filtreRecherche = '';

  // Pagination
  pageActuelle = 1;
  elementsParPage = 10;
  totalElements = 0;

  // Statistiques
  stats = {
    total: 0,
    actifs: 0,
    inactifs: 0,
    u1: 0,
    v1: 0,
    v2: 0,
    t1: 0
  };

  // Options pour les formulaires
  rolesOptions = [
    { value: 'U1', label: 'Utilisateur de saisie' },
    { value: 'V1', label: 'Validateur niveau 1' },
    { value: 'V2', label: 'Validateur niveau 2' },
    { value: 'T1', label: 'Trésorier' }
  ];

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.chargerUtilisateurs();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  chargerUtilisateurs() {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (utilisateurs) => {
          console.log('Utilisateurs chargés:', utilisateurs);
          // Filtrer pour exclure les admins
          this.utilisateurs = utilisateurs.filter(user => user.role !== 'ADMIN');
          this.appliquerFiltres();
          this.calculerStatistiques();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          this.errorMessage = error.message || 'Erreur lors du chargement des utilisateurs';
          this.isLoading = false;
        }
      });
  }

  // ===== FILTRAGE ET RECHERCHE =====

  appliquerFiltres() {
    let utilisateursFiltres = [...this.utilisateurs];

    // Filtre par rôle
    if (this.filtreRole) {
      utilisateursFiltres = utilisateursFiltres.filter(u => u.role === this.filtreRole);
    }

    // Filtre par statut
    if (this.filtreStatut === 'actif') {
      utilisateursFiltres = utilisateursFiltres.filter(u => u.actif);
    } else if (this.filtreStatut === 'inactif') {
      utilisateursFiltres = utilisateursFiltres.filter(u => !u.actif);
    }

    // Filtre par recherche textuelle
    if (this.filtreRecherche) {
      const terme = this.filtreRecherche.toLowerCase();
      utilisateursFiltres = utilisateursFiltres.filter(u =>
        u.nom?.toLowerCase().includes(terme) ||
        u.prenom?.toLowerCase().includes(terme) ||
        u.email?.toLowerCase().includes(terme) ||
        u.nomComplet?.toLowerCase().includes(terme)
      );
    }

    this.utilisateursFiltres = utilisateursFiltres;
    this.totalElements = utilisateursFiltres.length;
    this.pageActuelle = 1; // Reset pagination
  }

  onFiltreChange() {
    this.appliquerFiltres();
  }

  onRechercheChange() {
    this.appliquerFiltres();
  }

  // ===== PAGINATION =====

  get utilisateursPagines(): UserDto[] {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    const fin = debut + this.elementsParPage;
    return this.utilisateursFiltres.slice(debut, fin);
  }

  get nombrePages(): number {
    return Math.ceil(this.totalElements / this.elementsParPage);
  }

  changerPage(page: number) {
    if (page >= 1 && page <= this.nombrePages) {
      this.pageActuelle = page;
    }
  }

  // ===== STATISTIQUES =====

  calculerStatistiques() {
    this.stats = {
      total: this.utilisateurs.length,
      actifs: this.utilisateurs.filter(u => u.actif).length,
      inactifs: this.utilisateurs.filter(u => !u.actif).length,
      u1: this.utilisateurs.filter(u => u.role === 'U1').length,
      v1: this.utilisateurs.filter(u => u.role === 'V1').length,
      v2: this.utilisateurs.filter(u => u.role === 'V2').length,
      t1: this.utilisateurs.filter(u => u.role === 'T1').length
    };
  }

  // ===== GESTION DES MODALS =====

  ouvrirModalCreation() {
    this.resetForm();
    this.showCreateModal = true;
  }

  ouvrirModalModification(utilisateur: UserDto) {
    this.utilisateurSelectionne = utilisateur;
    this.userForm = {
      nom: utilisateur.nom || '',
      prenom: utilisateur.prenom || '',
      email: utilisateur.email || '',
      role: utilisateur.role || 'U1',
      actif: utilisateur.actif,
      nouveauMotDePasse: ''
    };
    this.showEditModal = true;
  }

  ouvrirModalSuppression(utilisateur: UserDto) {
    this.utilisateurSelectionne = utilisateur;
    this.showDeleteModal = true;
  }

  fermerModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.utilisateurSelectionne = null;
    this.resetForm();
    this.clearMessages();
  }

  resetForm() {
    this.userForm = {
      nom: '',
      prenom: '',
      email: '',
      role: 'U1',
      actif: true,
      nouveauMotDePasse: ''
    };
  }

  // ===== ACTIONS CRUD =====

  creerUtilisateur() {
    if (!this.validerFormulaire()) {
      return;
    }

    const userData = {
      nom: this.userForm.nom,
      prenom: this.userForm.prenom,
      email: this.userForm.email,
      role: this.userForm.role,
      motDePasse: this.userForm.nouveauMotDePasse
    };

    this.userService.creerUtilisateur(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Utilisateur créé avec succès';
          this.fermerModals();
          this.chargerUtilisateurs();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors de la création de l\'utilisateur';
        }
      });
  }

  modifierUtilisateur() {
    if (!this.utilisateurSelectionne || !this.validerFormulaire()) {
      return;
    }

    const userData = {
      nom: this.userForm.nom,
      prenom: this.userForm.prenom,
      email: this.userForm.email,
      role: this.userForm.role,
      actif: this.userForm.actif,
      nouveauMotDePasse: this.userForm.nouveauMotDePasse || undefined
    };

    this.userService.modifierUtilisateur(this.utilisateurSelectionne.id!, userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Utilisateur modifié avec succès';
          this.fermerModals();
          this.chargerUtilisateurs();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors de la modification de l\'utilisateur';
        }
      });
  }

  supprimerUtilisateur() {
    if (!this.utilisateurSelectionne) {
      return;
    }

    this.userService.supprimerUtilisateur(this.utilisateurSelectionne.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Utilisateur supprimé avec succès';
          this.fermerModals();
          this.chargerUtilisateurs();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors de la suppression de l\'utilisateur';
        }
      });
  }

  changerStatut(utilisateur: UserDto) {
    const nouveauStatut = !utilisateur.actif;

    const userData = {
      nom: utilisateur.nom || '',
      prenom: utilisateur.prenom || '',
      email: utilisateur.email || '',
      role: utilisateur.role || 'U1',
      actif: nouveauStatut
    };

    this.userService.modifierUtilisateur(utilisateur.id!, userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = `Utilisateur ${nouveauStatut ? 'activé' : 'désactivé'} avec succès`;
          this.chargerUtilisateurs();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors du changement de statut';
        }
      });
  }

  // ===== VALIDATION =====

  validerFormulaire(): boolean {
    if (!this.userForm.nom.trim()) {
      this.errorMessage = 'Le nom est obligatoire';
      return false;
    }

    if (!this.userForm.email.trim()) {
      this.errorMessage = 'L\'email est obligatoire';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userForm.email)) {
      this.errorMessage = 'Format d\'email invalide';
      return false;
    }

    if (this.showCreateModal && !this.userForm.nouveauMotDePasse) {
      this.errorMessage = 'Le mot de passe est obligatoire pour un nouvel utilisateur';
      return false;
    }

    if (this.userForm.nouveauMotDePasse && this.userForm.nouveauMotDePasse.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return false;
    }

    return true;
  }

  // ===== MÉTHODES UTILITAIRES =====

  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'U1': 'Utilisateur de saisie',
      'V1': 'Validateur niveau 1',
      'V2': 'Validateur niveau 2',
      'T1': 'Trésorier'
    };
    return roleLabels[role] || role;
  }

  getRoleClass(role: string): string {
    const roleClasses: { [key: string]: string } = {
      'U1': 'badge bg-primary',
      'V1': 'badge bg-warning',
      'V2': 'badge bg-info',
      'T1': 'badge bg-success'
    };
    return roleClasses[role] || 'badge bg-secondary';
  }

  getStatutClass(actif: boolean): string {
    return actif ? 'badge bg-success' : 'badge bg-danger';
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  actualiser() {
    this.chargerUtilisateurs();
  }

  exporterDonnees() {
    const donnees = this.utilisateursFiltres.map(u => ({
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      role: this.getRoleLabel(u.role || ''),
      statut: u.actif ? 'Actif' : 'Inactif',
      nbFactures: (u.nbFacturesCreees || 0) + (u.nbFacturesValideesN1 || 0) +
        (u.nbFacturesValideesN2 || 0) + (u.nbFacturesTraitees || 0)
    }));

    const dataStr = JSON.stringify(donnees, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `utilisateurs-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // ===== TRACK BY FUNCTION =====
  trackByUserId(index: number, user: UserDto): any {
    return user.id || index;
  }

  // Expose Math for template
  Math = Math;
}
