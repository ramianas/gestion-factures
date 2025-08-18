// Fichier: facture-front1/src/app/demo/profil/mon-profil/mon-profil.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Import des composants partagés
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Import des services
import { AuthService, User } from '../../../services/auth.service';
import { UserProfileService, UserProfile, UpdateProfileRequest } from '../services/user-profile.service';

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './mon-profil.component.html',
  styleUrl: './mon-profil.component.scss'
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

    this.userProfileService.getCurrentUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.initializeEditForm();
          this.calculateStats();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du profil:', error);
          this.errorMessage = 'Impossible de charger les informations du profil';
          this.isLoading = false;
        }
      });
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
    this.initializeEditForm();
  }

  cancelEditing() {
    this.isEditing = false;
    this.showPasswordForm = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.validationErrors = [];
    this.resetForms();
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

    const updateData: UpdateProfileRequest = {
      nom: this.editForm.nom,
      prenom: this.editForm.prenom,
      email: this.editForm.email
    };

    this.userProfileService.updateProfile(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Profil mis à jour avec succès';
          this.isEditing = false;
          this.isSaving = false;
          this.loadUserProfile(); // Recharger les données
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.errorMessage = error.message || 'Erreur lors de la mise à jour du profil';
          this.isSaving = false;
        }
      });
  }

  // ===== CHANGEMENT DE MOT DE PASSE =====

  togglePasswordForm() {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    }
  }

  changePassword() {
    if (!this.validatePasswordForm()) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    this.userProfileService.changePassword(
      this.passwordForm.currentPassword,
      this.passwordForm.newPassword
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Mot de passe modifié avec succès';
          this.showPasswordForm = false;
          this.isSaving = false;
          this.resetForms();
        },
        error: (error) => {
          console.error('Erreur lors du changement de mot de passe:', error);
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
    this.loadUserProfile();
  }

  downloadProfileData() {
    if (!this.currentUser) return;

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
  }

  // ===== GETTERS POUR LE TEMPLATE =====

  get canEdit(): boolean {
    return !this.isLoading && !this.isSaving;
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
}
