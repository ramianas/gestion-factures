// Fichier: facture-front1/src/app/demo/administration/services/user.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

export interface UserDto {
  id?: number;
  nom: string;
  prenom?: string;
  email: string;
  role: string;
  actif: boolean;
  nomComplet?: string;
  nbFacturesCreees?: number;
  nbFacturesValideesN1?: number;
  nbFacturesValideesN2?: number;
  nbFacturesTraitees?: number;
}

export interface UserCreateDto {
  nom: string;
  prenom?: string;
  email: string;
  role: string;
  motDePasse: string;
}

export interface UserUpdateDto {
  nom: string;
  prenom?: string;
  email: string;
  role: string;
  actif: boolean;
  nouveauMotDePasse?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.apiUrl}/api`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ===== GESTION DES UTILISATEURS (ADMIN) =====

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/admin/users`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapUsersResponse(response)),
      catchError(this.handleError)
    );
  }

  getUserById(id: number): Observable<UserDto> {
    return this.http.get<any>(`${this.apiUrl}/admin/users/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapUserResponse(response)),
      catchError(this.handleError)
    );
  }

  creerUtilisateur(userData: UserCreateDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/users`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la création de l\'utilisateur');
      }),
      catchError(this.handleError)
    );
  }

  modifierUtilisateur(id: number, userData: UserUpdateDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/users/${id}`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la modification de l\'utilisateur');
      }),
      catchError(this.handleError)
    );
  }

  supprimerUtilisateur(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/users/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la suppression de l\'utilisateur');
      }),
      catchError(this.handleError)
    );
  }

  // ===== STATISTIQUES =====

  getStatistiquesUtilisateurs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/statistiques`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ===== DONNÉES DE RÉFÉRENCE =====

  getValidateursV1(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users/validateurs-v1`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapUsersResponse(response)),
      catchError(this.handleError)
    );
  }

  getValidateursV2(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users/validateurs-v2`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapUsersResponse(response)),
      catchError(this.handleError)
    );
  }

  getTresoriers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users/tresoriers`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapUsersResponse(response)),
      catchError(this.handleError)
    );
  }

  rechercherUtilisateurs(terme: string): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users/search?terme=${encodeURIComponent(terme)}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapUsersResponse(response)),
      catchError(this.handleError)
    );
  }

  // ===== MÉTHODES UTILITAIRES PRIVÉES =====

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private mapUsersResponse(response: any): UserDto[] {
    // Si c'est déjà un tableau, le retourner tel quel
    if (Array.isArray(response)) {
      return response.map(u => this.mapUserData(u));
    }

    // Si c'est un objet avec une propriété data
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map((u: any) => this.mapUserData(u));
    }

    // Si c'est un objet simple, le traiter comme un utilisateur unique
    if (response && typeof response === 'object') {
      return [this.mapUserData(response)];
    }

    return [];
  }

  private mapUserResponse(response: any): UserDto {
    if (response && typeof response === 'object') {
      return this.mapUserData(response);
    }
    throw new Error('Format de réponse invalide');
  }

  private mapUserData(data: any): UserDto {
    return {
      id: data.id,
      nom: data.nom || '',
      prenom: data.prenom || '',
      email: data.email || '',
      role: data.role || 'U1',
      actif: data.actif !== undefined ? data.actif : true,
      nomComplet: data.nomComplet || `${data.prenom || ''} ${data.nom || ''}`.trim(),
      nbFacturesCreees: data.nbFacturesCreees || 0,
      nbFacturesValideesN1: data.nbFacturesValideesN1 || 0,
      nbFacturesValideesN2: data.nbFacturesValideesN2 || 0,
      nbFacturesTraitees: data.nbFacturesTraitees || 0
    };
  }

  private handleError = (error: any): Observable<never> => {
    console.error('Erreur UserService:', error);

    let errorMessage = 'Une erreur s\'est produite';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur';
    } else if (error.status === 401) {
      errorMessage = 'Session expirée, veuillez vous reconnecter';
    } else if (error.status === 403) {
      errorMessage = 'Accès non autorisé';
    } else if (error.status === 404) {
      errorMessage = 'Ressource non trouvée';
    } else if (error.status >= 500) {
      errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
    }

    return throwError(() => new Error(errorMessage));
  };
}
