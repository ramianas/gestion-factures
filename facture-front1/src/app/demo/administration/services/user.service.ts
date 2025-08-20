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

  // ===== GESTION DES UTILISATEURS =====

  getAllUsers(): Observable<UserDto[]> {
    console.log('🔍 Récupération des utilisateurs via API simplifiée');

    // Essayer d'abord l'API simplifiée
    return this.http.get<any>(`${this.apiUrl}/simple/users`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Réponse API simple reçue:', response);
        return this.mapUsersResponse(response);
      }),
      catchError(error => {
        console.warn('⚠️ Erreur API simple, essai API standard...', error);
        // Fallback vers l'API standard
        return this.getStandardUsers();
      })
    );
  }

  private getStandardUsers(): Observable<UserDto[]> {
    return this.http.get<any>(`${this.apiUrl}/users`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Réponse API standard reçue:', response);
        return this.mapUsersResponse(response);
      }),
      catchError(error => {
        console.warn('⚠️ Erreur API standard, essai API admin...', error);
        return this.getAdminUsers();
      })
    );
  }

  private getAdminUsers(): Observable<UserDto[]> {
    return this.http.get<any>(`${this.apiUrl}/admin/users`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Réponse admin reçue:', response);
        return this.mapUsersResponse(response);
      }),
      catchError(this.handleError)
    );
  }

  getUserById(id: number): Observable<UserDto> {
    console.log('🔍 Récupération utilisateur ID:', id);

    return this.http.get<any>(`${this.apiUrl}/users/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Utilisateur reçu:', response);
        return this.mapUserResponse(response);
      }),
      catchError(error => {
        console.error('❌ Erreur getUserById:', error);
        // Fallback vers l'API admin
        return this.http.get<any>(`${this.apiUrl}/admin/users/${id}`, {
          headers: this.getAuthHeaders()
        }).pipe(
          map(response => this.mapUserResponse(response)),
          catchError(this.handleError)
        );
      })
    );
  }

  creerUtilisateur(userData: UserCreateDto): Observable<any> {
    console.log('🆕 Création utilisateur:', userData);

    // Utiliser l'API admin pour la création (seuls les admins peuvent créer)
    return this.http.post<any>(`${this.apiUrl}/admin/users`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Utilisateur créé:', response);
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la création de l\'utilisateur');
      }),
      catchError(this.handleError)
    );
  }

  modifierUtilisateur(id: number, userData: UserUpdateDto): Observable<any> {
    console.log('🔄 Modification utilisateur ID:', id, userData);

    // Utiliser l'API admin pour la modification (seuls les admins peuvent modifier)
    return this.http.put<any>(`${this.apiUrl}/admin/users/${id}`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Utilisateur modifié:', response);
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la modification de l\'utilisateur');
      }),
      catchError(this.handleError)
    );
  }

  supprimerUtilisateur(id: number): Observable<any> {
    console.log('🗑️ Suppression utilisateur ID:', id);

    // Utiliser l'API admin pour la suppression (seuls les admins peuvent supprimer)
    return this.http.delete<any>(`${this.apiUrl}/admin/users/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Utilisateur supprimé:', response);
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
    console.log('📊 Récupération des statistiques');

    return this.http.get<any>(`${this.apiUrl}/users/statistiques`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.warn('⚠️ Erreur stats users, essai admin...');
        return this.http.get<any>(`${this.apiUrl}/admin/statistiques`, {
          headers: this.getAuthHeaders()
        });
      }),
      catchError(error => {
        console.error('❌ Impossible de récupérer les statistiques');
        // Retourner des stats par défaut
        return throwError(() => new Error('Statistiques indisponibles'));
      })
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
    console.log('🔄 Mapping de la réponse utilisateurs:', response);

    try {
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

      console.warn('⚠️ Format de réponse inattendu:', response);
      return [];

    } catch (error) {
      console.error('❌ Erreur lors du mapping des utilisateurs:', error);
      return [];
    }
  }

  private mapUserResponse(response: any): UserDto {
    if (response && typeof response === 'object') {
      return this.mapUserData(response);
    }
    throw new Error('Format de réponse invalide');
  }

  private mapUserData(data: any): UserDto {
    try {
      return {
        id: data.id || null,
        nom: data.nom || '',
        prenom: data.prenom || '',
        email: data.email || '',
        role: data.role || 'U1',
        actif: data.actif !== undefined ? data.actif : true,
        nomComplet: data.nomComplet || `${data.prenom || ''} ${data.nom || ''}`.trim(),
        nbFacturesCreees: data.nbFacturesCreees || data.nbFacturesCreees || 0,
        nbFacturesValideesN1: data.nbFacturesValideesN1 || data.nbFacturesValidéesN1 || 0,
        nbFacturesValideesN2: data.nbFacturesValideesN2 || data.nbFacturesValidéesN2 || 0,
        nbFacturesTraitees: data.nbFacturesTraitees || data.nbFacturesTraitées || 0
      };
    } catch (error) {
      console.error('❌ Erreur mapping user data:', error, data);
      // Retourner un objet minimal en cas d'erreur
      return {
        id: data.id || null,
        nom: data.nom || 'Erreur',
        prenom: '',
        email: data.email || '',
        role: 'U1',
        actif: true,
        nomComplet: 'Erreur de mapping',
        nbFacturesCreees: 0,
        nbFacturesValideesN1: 0,
        nbFacturesValideesN2: 0,
        nbFacturesTraitees: 0
      };
    }
  }

  private handleError = (error: any): Observable<never> => {
    console.error('❌ Erreur UserService:', error);

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
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur - ' + (error.error?.message || 'Erreur interne');
    } else if (error.status >= 500) {
      errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
    }

    return throwError(() => new Error(errorMessage));
  };

  // ===== MÉTHODES DE DEBUG =====

  debugUsers(): Observable<any> {
    console.log('🔍 Debug: Test de tous les endpoints utilisateurs');

    const endpoints = [
      { name: 'simple/users', url: `${this.apiUrl}/simple/users` },
      { name: 'users', url: `${this.apiUrl}/users` },
      { name: 'admin/users', url: `${this.apiUrl}/admin/users` },
      { name: 'simple/test/connection', url: `${this.apiUrl}/simple/test/connection` }
    ];

    const results: any = {};

    const promises = endpoints.map(endpoint => {
      return this.http.get(endpoint.url, { headers: this.getAuthHeaders() })
        .toPromise()
        .then(response => {
          results[endpoint.name] = { success: true, data: response };
          console.log(`✅ ${endpoint.name}:`, response);
        })
        .catch(error => {
          results[endpoint.name] = { success: false, error: error.message, status: error.status };
          console.error(`❌ ${endpoint.name}:`, error);
        });
    });

    return new Observable(observer => {
      Promise.all(promises).then(() => {
        observer.next(results);
        observer.complete();
      });
    });
  }

  testSimpleConnection(): Observable<any> {
    console.log('🔗 Test de connexion simple');

    return this.http.get(`${this.apiUrl}/simple/test/connection`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('❌ Erreur test connexion simple:', error);
        return throwError(() => error);
      })
    );
  }
}
