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
    console.log('🚀 Initialisation du composant gestion utilisateurs');
    this.currentUser = this.authService.getCurrentUser();
    this.chargerUtilisateurs();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  chargerUtilisateurs() {
    console.log('🔄 Chargement des utilisateurs...');
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (utilisateurs) => {
          console.log('✅ Utilisateurs chargés:', utilisateurs);

          // Filtrer pour exclure les admins et traiter les données
          this.utilisateurs = this.traiterUtilisateurs(utilisateurs);
          this.appliquerFiltres();
          this.calculerStatistiques();
          this.isLoading = false;

          console.log(`📊 ${this.utilisateurs.length} utilisateurs traités`);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des utilisateurs:', error);
          this.handleChargementError(error);
          this.isLoading = false;
        }
      });
  }

  private traiterUtilisateurs(utilisateurs: UserDto[]): UserDto[] {
    return utilisateurs
      .filter(user => user.role !== 'ADMIN') // Exclure les admins
      .map(user => {
        // S'assurer que tous les champs nécessaires sont présents
        return {
          ...user,
          nom: user.nom || '',
          prenom: user.prenom || '',
          email: user.email || '',
          role: user.role || 'U1',
          actif: user.actif !== undefined ? user.actif : true,
          nomComplet: user.nomComplet || `${user.prenom || ''} ${user.nom || ''}`.trim(),
          nbFacturesCreees: user.nbFacturesCreees || 0,
          nbFacturesValideesN1: user.nbFacturesValideesN1 || 0,
          nbFacturesValideesN2: user.nbFacturesValideesN2 || 0,
          nbFacturesTraitees: user.nbFacturesTraitees || 0
        };
      });
  }

  private handleChargementError(error: any) {
    let message = 'Erreur lors du chargement des utilisateurs';

    if (error.message) {
      message = error.message;
    } else if (error.status === 500) {
      message = 'Erreur serveur - Les données peuvent être temporairement indisponibles';
    } else if (error.status === 403) {
      message = 'Accès non autorisé - Vérifiez vos permissions';
    } else if (error.status === 0) {
      message = 'Impossible de contacter le serveur';
    }

    this.errorMessage = message;

    // Essayer un fallback avec des données de test si disponibles
    this.tryFallbackData();
  }

  private tryFallbackData() {
    console.log('🔄 Tentative de récupération de données de fallback...');

    // Vous pouvez implémenter ici une logique de fallback
    // Par exemple, utiliser des données en cache ou une API alternative

    // Pour l'instant, initialiser avec des données vides mais valides
    this.utilisateurs = [];
    this.appliquerFiltres();
    this.calculerStatistiques();
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
        (u.nom || '').toLowerCase().includes(terme) ||
        (u.prenom || '').toLowerCase().includes(terme) ||
        (u.email || '').toLowerCase().includes(terme) ||
        (u.nomComplet || '').toLowerCase().includes(terme)
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

    console.log('📊 Statistiques calculées:', this.stats);
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
      actif: utilisateur.actif !== undefined ? utilisateur.actif : true,
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

    console.log('🆕 Création d\'un utilisateur:', this.userForm);

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
          console.log('✅ Utilisateur créé:', response);
          this.successMessage = 'Utilisateur créé avec succès';
          this.fermerModals();
          this.chargerUtilisateurs();
        },
        error: (error) => {
          console.error('❌ Erreur création utilisateur:', error);
          this.errorMessage = error.message || 'Erreur lors de la création de l\'utilisateur';
        }
      });
  }

  modifierUtilisateur() {
    if (!this.utilisateurSelectionne || !this.validerFormulaire()) {
      return;
    }

    console.log('🔄 Modification utilisateur:', this.utilisateurSelectionne.id, this.userForm);

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
          console.log('✅ Utilisateur modifié:', response);
          this.successMessage = 'Utilisateur modifié avec succès';
          this.fermerModals();
          this.chargerUtilisateurs();
        },
        error: (error) => {
          console.error('❌ Erreur modification utilisateur:', error);
          this.errorMessage = error.message || 'Erreur lors de la modification de l\'utilisateur';
        }
      });
  }

  supprimerUtilisateur() {
    if (!this.utilisateurSelectionne) {
      return;
    }

    console.log('🗑️ Suppression utilisateur:', this.utilisateurSelectionne.id);

    this.userService.supprimerUtilisateur(this.utilisateurSelectionne.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Utilisateur supprimé:', response);
          this.successMessage = 'Utilisateur supprimé avec succès';
          this.fermerModals();
          this.chargerUtilisateurs();
        },
        error: (error) => {
          console.error('❌ Erreur suppression utilisateur:', error);
          this.errorMessage = error.message || 'Erreur lors de la suppression de l\'utilisateur';
        }
      });
  }

  changerStatut(utilisateur: UserDto) {
    const nouveauStatut = !utilisateur.actif;

    console.log('🔄 Changement de statut:', utilisateur.id, nouveauStatut);

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
          console.log('✅ Statut changé:', response);
          this.successMessage = `Utilisateur ${nouveauStatut ? 'activé' : 'désactivé'} avec succès`;
          this.chargerUtilisateurs();
        },
        error: (error) => {
          console.error('❌ Erreur changement statut:', error);
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
    console.log('🔄 Actualisation des données...');
    this.chargerUtilisateurs();
  }

  exporterDonnees() {
    console.log('📤 Export des données...');

    const donnees = this.utilisateursFiltres.map(u => ({
      nom: u.nom || '',
      prenom: u.prenom || '',
      email: u.email || '',
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

    console.log('✅ Export terminé:', exportFileDefaultName);
  }

  // ===== MÉTHODES DE DEBUG =====

  debugUtilisateurs() {
    console.log('🔍 Debug des utilisateurs...');

    this.userService.debugUsers()?.subscribe({
      next: (results) => {
        console.log('📊 Résultats debug:', results);
        alert('Vérifiez la console pour les résultats de debug');
      },
      error: (error) => {
        console.error('❌ Erreur debug:', error);
      }
    });
  }

  testConnexion() {
    console.log('🔗 Test de connexion...');

    // Test simple de l'API
    this.userService.getValidateursV1()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ Connexion OK:', data);
          this.successMessage = 'Connexion au serveur OK';
        },
        error: (error) => {
          console.error('❌ Erreur connexion:', error);
          this.errorMessage = 'Erreur de connexion: ' + error.message;
        }
      });
  }

  // ===== TRACK BY FUNCTION =====
  trackByUserId(index: number, user: UserDto): any {
    return user.id || index;
  }

  // Expose Math for template
  Math = Math;

  // ===== MÉTHODES POUR LE TEMPLATE =====

  /**
   * Méthode sécurisée pour obtenir le nombre total d'actions d'un utilisateur
   */
  getTotalActions(utilisateur: UserDto): number {
    try {
      return (utilisateur.nbFacturesCreees || 0) +
        (utilisateur.nbFacturesValideesN1 || 0) +
        (utilisateur.nbFacturesValideesN2 || 0) +
        (utilisateur.nbFacturesTraitees || 0);
    } catch (error) {
      console.warn('⚠️ Erreur calcul total actions pour utilisateur:', utilisateur.id, error);
      return 0;
    }
  }

  /**
   * Méthode pour formater le nom complet de façon sécurisée
   */
  formatNomComplet(utilisateur: UserDto): string {
    try {
      if (utilisateur.nomComplet && utilisateur.nomComplet.trim()) {
        return utilisateur.nomComplet;
      }

      const prenom = utilisateur.prenom || '';
      const nom = utilisateur.nom || '';

      if (prenom && nom) {
        return `${prenom} ${nom}`;
      } else if (nom) {
        return nom;
      } else if (prenom) {
        return prenom;
      } else {
        return utilisateur.email || 'Utilisateur';
      }
    } catch (error) {
      console.warn('⚠️ Erreur formatage nom pour utilisateur:', utilisateur.id, error);
      return utilisateur.email || 'Utilisateur';
    }
  }

  /**
   * Méthode pour vérifier si un utilisateur peut être supprimé
   */
  peutSupprimerUtilisateur(utilisateur: UserDto): boolean {
    try {
      // Ne pas pouvoir supprimer si l'utilisateur a des factures associées
      const totalFactures = this.getTotalActions(utilisateur);
      return totalFactures === 0;
    } catch (error) {
      console.warn('⚠️ Erreur vérification suppression pour utilisateur:', utilisateur.id, error);
      return false;
    }
  }

  /**
   * Méthode pour obtenir un tooltip explicatif pour les boutons désactivés
   */
  getTooltipSuppression(utilisateur: UserDto): string {
    try {
      const totalFactures = this.getTotalActions(utilisateur);
      if (totalFactures > 0) {
        return `Impossible de supprimer: ${totalFactures} facture(s) associée(s)`;
      }
      return 'Supprimer cet utilisateur';
    } catch (error) {
      return 'Suppression non disponible';
    }
  }

  /**
   * Méthode pour gérer les erreurs d'affichage de manière gracieuse
   */
  handleDisplayError(error: any, context: string): string {
    console.warn(`⚠️ Erreur d'affichage dans ${context}:`, error);
    return 'Erreur d affichage';
  }
}
