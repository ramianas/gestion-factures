// Fichier: facture-front1/src/app/demo/profil/services/user-profile.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

export interface UserProfile {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  nomComplet: string;
  role: string;
  actif: boolean;
  nbFacturesCreees: number;
  nbFacturesValideesN1: number;
  nbFacturesValideesN2: number;
  nbFacturesTraitees: number;
}

export interface UpdateProfileRequest {
  nom: string;
  prenom: string;
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  private apiUrl = `${environment.apiUrl}/api/users`;
  private authUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ===== RÉCUPÉRATION DU PROFIL =====

  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<any>(`${this.authUrl}/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Response from /auth/me:', response);
        if (response.success && response.user) {
          return {
            id: response.user.id,
            nom: response.user.nom || '',
            prenom: response.user.prenom || '',
            email: response.user.email || '',
            nomComplet: response.user.nomComplet || response.user.nom || '',
            role: response.user.role || '',
            actif: response.user.actif || false,
            nbFacturesCreees: response.user.nbFacturesCreees || 0,
            nbFacturesValideesN1: response.user.nbFacturesValideesN1 || 0,
            nbFacturesValideesN2: response.user.nbFacturesValideesN2 || 0,
            nbFacturesTraitees: response.user.nbFacturesTraitees || 0
          } as UserProfile;
        }
        throw new Error(response.message || 'Erreur lors de la récupération du profil');
      }),
      catchError(error => {
        console.error('Erreur getUserProfile:', error);
        return throwError(() => error);
      })
    );
  }

  // ===== MISE À JOUR DU PROFIL =====

  updateProfile(profileData: UpdateProfileRequest): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }

    const updateData = {
      nom: profileData.nom,
      prenom: profileData.prenom,
      email: profileData.email,
      role: currentUser.role, // Conserver le rôle actuel
      actif: true // Conserver le statut actif
    };

    return this.http.put<any>(`${this.apiUrl}/${currentUser.id}`, updateData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Response from update profile:', response);
        if (response.success) {
          // Mettre à jour les informations dans le service d'authentification
          const updatedUser = { ...currentUser, ...profileData };
          this.authService.setCurrentUser(updatedUser);
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la mise à jour du profil');
      }),
      catchError(error => {
        console.error('Erreur updateProfile:', error);
        if (error.status === 400 && error.error?.message) {
          return throwError(() => new Error(error.error.message));
        }
        return throwError(() => new Error('Erreur lors de la mise à jour du profil'));
      })
    );
  }

  // ===== CHANGEMENT DE MOT DE PASSE =====

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const changePasswordData: ChangePasswordRequest = {
      currentPassword,
      newPassword
    };

    return this.http.put<any>(`${this.authUrl}/change-password`, changePasswordData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('Response from change password:', response);
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors du changement de mot de passe');
      }),
      catchError(error => {
        console.error('Erreur changePassword:', error);
        if (error.status === 400 && error.error?.message) {
          return throwError(() => new Error(error.error.message));
        }
        return throwError(() => new Error('Erreur lors du changement de mot de passe'));
      })
    );
  }

  // ===== MÉTHODES UTILITAIRES =====

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ===== VALIDATION =====

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ===== FORMATAGE =====

  getRoleLabel(role: string): string {
    const roleLabels: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'U1': 'Utilisateur de saisie',
      'V1': 'Validateur niveau 1',
      'V2': 'Validateur niveau 2',
      'T1': 'Trésorier'
    };

    return roleLabels[role] || role;
  }

  formatStatistics(user: UserProfile): any {
    return {
      totalFactures: (user.nbFacturesCreees || 0) +
        (user.nbFacturesValideesN1 || 0) +
        (user.nbFacturesValideesN2 || 0) +
        (user.nbFacturesTraitees || 0),
      facturesCreees: user.nbFacturesCreees || 0,
      facturesValideesN1: user.nbFacturesValideesN1 || 0,
      facturesValideesN2: user.nbFacturesValideesN2 || 0,
      facturesTraitees: user.nbFacturesTraitees || 0,
      tauxActivite: this.calculateActivityRate(user)
    };
  }

  private calculateActivityRate(user: UserProfile): number {
    const total = (user.nbFacturesCreees || 0) +
      (user.nbFacturesValideesN1 || 0) +
      (user.nbFacturesValideesN2 || 0) +
      (user.nbFacturesTraitees || 0);

    if (total === 0) return 0;

    // Calcul d'un taux d'activité basé sur le nombre total d'actions
    return Math.min(100, Math.round((total / 10) * 100)); // Exemple de calcul
  }
}
