// Fichier: facture-front1/src/app/demo/profil/mon-profil/mon-profil.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Import des composants partagés
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Import des services
import { AuthService, User } from '/Users/macm2/Downloads/facture/facture-front1/src/app/services/auth.service';
import { UserProfileService, UserProfile, UpdateProfileRequest } from '/Users/macm2/Downloads/facture/facture-front1/src/app/demo/profil/services/user-profile.service';

export let ProfilComponent = undefined;


@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss'
})
export class MonProfilComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // État du composant
  isLoading = false;
  isEditing = false;
  isSaving = false;
  showPasswordForm = false;
  currentUser: UserProfile | null = null;
  errorMessage = '';
  successMessage = '';

  // Formulaire d'édition du profil
  editForm = {
    nom: '',
    prenom: '',
    email: ''
  };

  // Formulaire de changement de mot de passe
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Statistiques utilisateur
  stats = {
    totalFactures: 0,
    facturesCreees: 0,
    facturesValideesN1: 0,
    facturesValideesN2: 0,
    facturesTraitees: 0,
    tauxActivite: 0
  };

  // Erreurs de validation
  validationErrors: string[] = [];

  constructor(
    private authService: AuthService,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit() {
    console.log('🔧 Initialisation du composant Mon Profil');
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  loadUserProfile() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('📡 Chargement du profil utilisateur...');

    this.userProfileService.getCurrentUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.log('✅ Profil utilisateur reçu:', user);
          this.currentUser = user;
          this.initializeEditForm();
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement du profil:', error);
          this.errorMessage = 'Impossible de charger les informations du profil';
          this.isLoading = false;

          // Fallback: essayer d'utiliser les données de l'AuthService
          this.tryFallbackUserData();
        }
      });
  }

  private tryFallbackUserData() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('🔄 Utilisation des données de fallback:', currentUser);
      this.currentUser = {
        id: currentUser.id,
        nom: currentUser.nom || '',
        prenom: currentUser.prenom || '',
        email: currentUser.email || '',
        nomComplet: currentUser.nomComplet || '',
        role: currentUser.role || '',
        actif: currentUser.actif !== undefined ? currentUser.actif : true,
        nbFacturesCreees: currentUser.nbFacturesCreees || 0,
        nbFacturesValideesN1: currentUser.nbFacturesValideesN1 || 0,
        nbFacturesValideesN2: currentUser.nbFacturesValideesN2 || 0,
        nbFacturesTraitees: currentUser.nbFacturesTraitees || 0
      };
      this.initializeEditForm();
      this.calculateStats();
      this.errorMessage = 'Profil chargé en mode hors ligne';
    }
  }

  private initializeEditForm() {
    if (this.currentUser) {
      this.editForm = {
        nom: this.currentUser.nom || '',
        prenom: this.currentUser.prenom || '',
        email: this.currentUser.email || ''
      };
    }
  }

  private calculateStats() {
    if (this.currentUser) {
      this.stats = this.userProfileService.formatStatistics(this.currentUser);
    }
  }

  // ===== GESTION DE L'ÉDITION =====

  startEditing() {
    this.isEditing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];
    this.initializeEditForm();
    console.log('✏️ Mode édition activé');
  }

  cancelEditing() {
    this.isEditing = false;
    this.showPasswordForm = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];
    this.resetForms();
    console.log('❌ Edition annulée');
  }

  private resetForms() {
    this.initializeEditForm();
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  // ===== SAUVEGARDE DU PROFIL =====

  saveProfile() {
    if (!this.validateProfileForm()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateData: UpdateProfileRequest = {
      nom: this.editForm.nom.trim(),
      prenom: this.editForm.prenom.trim(),
      email: this.editForm.email.trim()
    };

    console.log('💾 Sauvegarde du profil:', updateData);

    this.userProfileService.updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Profil mis à jour avec succès:', response);
          this.successMessage = 'Profil mis à jour avec succès';
          this.isEditing = false;
          this.isSaving = false;

          // Recharger les données pour refléter les changements
          setTimeout(() => {
            this.loadUserProfile();
          }, 1000);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la mise à jour:', error);
          this.errorMessage = error.message || 'Erreur lors de la mise à jour du profil';
          this.isSaving = false;
        }
      });
  }

  // ===== CHANGEMENT DE MOT DE PASSE =====

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];

    if (!this.showPasswordForm) {
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }

    console.log('🔐 Formulaire mot de passe:', this.showPasswordForm ? 'affiché' : 'masqué');
  }

  changePassword() {
    if (!this.validatePasswordForm()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('🔐 Changement de mot de passe...');

    this.userProfileService.changePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Mot de passe modifié avec succès:', response);
          this.successMessage = 'Mot de passe modifié avec succès';
          this.showPasswordForm = false;
          this.isSaving = false;
          this.resetForms();
        },
        error: (error) => {
          console.error('❌ Erreur lors du changement de mot de passe:', error);
          this.errorMessage = error.message || 'Erreur lors du changement de mot de passe';
          this.isSaving = false;
        }
      });
  }

  // ===== VALIDATION =====

  private validateProfileForm(): boolean {
    this.validationErrors = [];

    if (!this.editForm.nom.trim()) {
      this.validationErrors.push('Le nom est obligatoire');
    }

    if (!this.editForm.email.trim()) {
      this.validationErrors.push('L\'email est obligatoire');
    } else if (!this.userProfileService.validateEmail(this.editForm.email)) {
      this.validationErrors.push('Format d\'email invalide');
    }

    if (this.validationErrors.length > 0) {
      console.warn('❌ Erreurs de validation profil:', this.validationErrors);
    }

    return this.validationErrors.length === 0;
  }

  private validatePasswordForm(): boolean {
    this.validationErrors = [];

    if (!this.passwordForm.currentPassword) {
      this.validationErrors.push('Le mot de passe actuel est obligatoire');
    }

    if (!this.passwordForm.newPassword) {
      this.validationErrors.push('Le nouveau mot de passe est obligatoire');
    } else {
      const passwordValidation = this.userProfileService.validatePassword(this.passwordForm.newPassword);
      if (!passwordValidation.valid) {
        this.validationErrors.push(...passwordValidation.errors);
      }
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.validationErrors.push('Les mots de passe ne correspondent pas');
    }

    if (this.validationErrors.length > 0) {
      console.warn('❌ Erreurs de validation mot de passe:', this.validationErrors);
    }

    return this.validationErrors.length === 0;
  }

  // ===== MÉTHODES UTILITAIRES =====

  getRoleLabel(): string {
    if (!this.currentUser) return '';
    return this.userProfileService.getRoleLabel(this.currentUser.role);
  }

  getProgressBarClass(value: number): string {
    if (value < 30) return 'bg-danger';
    if (value < 70) return 'bg-warning';
    return 'bg-success';
  }

  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];
  }

  // ===== ACTIONS UTILITAIRES =====

  refreshProfile() {
    console.log('🔄 Actualisation du profil...');
    this.loadUserProfile();
  }

  downloadProfileData() {
    if (!this.currentUser) return;

    console.log('📥 Téléchargement des données du profil...');

    const profileData = {
      nom: this.currentUser.nom,
      prenom: this.currentUser.prenom,
      email: this.currentUser.email,
      role: this.getRoleLabel(),
      statistiques: this.stats,
      dateExport: new Date().toISOString()
    };

    const dataStr = JSON.stringify(profileData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `profil-${this.currentUser.nom}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    console.log('✅ Données du profil téléchargées');
  }

  // ===== GETTERS POUR LE TEMPLATE =====

  get canEdit(): boolean {
    return !this.isLoading && !this.isSaving && this.currentUser !== null;
  }

  get hasValidationErrors(): boolean {
    return this.validationErrors.length > 0;
  }

  get isFormValid(): boolean {
    return this.editForm.nom.trim() !== '' &&
      this.editForm.email.trim() !== '' &&
      this.userProfileService.validateEmail(this.editForm.email);
  }

  get isPasswordFormValid(): boolean {
    return this.passwordForm.currentPassword !== '' &&
      this.passwordForm.newPassword !== '' &&
      this.passwordForm.confirmPassword !== '' &&
      this.passwordForm.newPassword === this.passwordForm.confirmPassword &&
      this.userProfileService.validatePassword(this.passwordForm.newPassword).valid;
  }

  // ===== MÉTHODES DE DEBUG =====

  logCurrentState() {
    console.log('🔍 État actuel du composant Mon Profil:', {
      isLoading: this.isLoading,
      isEditing: this.isEditing,
      isSaving: this.isSaving,
      showPasswordForm: this.showPasswordForm,
      currentUser: this.currentUser,
      editForm: this.editForm,
      stats: this.stats,
      hasErrors: this.hasValidationErrors,
      errorMessage: this.errorMessage,
      successMessage: this.successMessage
    });
  }
}
