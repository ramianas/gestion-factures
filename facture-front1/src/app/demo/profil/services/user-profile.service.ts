// Fichier: facture-front1/src/app/demo/profil/services/user-profile.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  nouveauMotDePasse?: string;
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
        if (response.success) {
          return response.user;
        }
        throw new Error(response.message || 'Erreur lors de la récupération du profil');
      }),
      catchError(error => {
        console.error('Erreur getUserProfile:', error);
        throw error;
      })
    );
  }

  // ===== MISE À JOUR DU PROFIL =====

  updateProfile(profileData: UpdateProfileRequest): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    return this.http.put<any>(`${this.apiUrl}/${currentUser.id}`, profileData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la mise à jour du profil');
      }),
      catchError(error => {
        console.error('Erreur updateProfile:', error);
        throw error;
      })
    );
  }

  // ===== CHANGEMENT DE MOT DE PASSE =====

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const changePasswordData = {
      currentPassword,
      newPassword
    };

    return this.http.put<any>(`${this.authUrl}/change-password`, changePasswordData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors du changement de mot de passe');
      }),
      catchError(error => {
        console.error('Erreur changePassword:', error);
        throw error;
      })
    );
  }

  // ===== STATISTIQUES UTILISATEUR =====

  getUserStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me/statistics`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur getUserStatistics:', error);
        // Retourner des statistiques par défaut en cas d'erreur
        return new Observable(observer => {
          observer.next({
            facturesCreees: 0,
            facturesValideesN1: 0,
            facturesValideesN2: 0,
            facturesTraitees: 0,
            tauxValidation: 0,
            moyenneTraitement: 0
          });
          observer.complete();
        });
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

  formatStatistics(stats: any): any {
    return {
      totalFactures: (stats.nbFacturesCreees || 0) +
        (stats.nbFacturesValideesN1 || 0) +
        (stats.nbFacturesValideesN2 || 0) +
        (stats.nbFacturesTraitees || 0),
      facturesCreees: stats.nbFacturesCreees || 0,
      facturesValideesN1: stats.nbFacturesValideesN1 || 0,
      facturesValideesN2: stats.nbFacturesValideesN2 || 0,
      facturesTraitees: stats.nbFacturesTraitees || 0,
      tauxActivite: this.calculateActivityRate(stats)
    };
  }

  private calculateActivityRate(stats: any): number {
    const total = (stats.nbFacturesCreees || 0) +
      (stats.nbFacturesValideesN1 || 0) +
      (stats.nbFacturesValideesN2 || 0) +
      (stats.nbFacturesTraitees || 0);

    if (total === 0) return 0;

    // Calcul d'un taux d'activité basé sur le nombre total d'actions
    return Math.min(100, Math.round((total / 10) * 100)); // Exemple de calcul
  }
}
