// Fichier: facture-front1/src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  nomComplet: string;
  role: string;
  actif: boolean;
  nbFacturesCreees?: number;
  nbFacturesValideesN1?: number;
  nbFacturesValideesN2?: number;
  nbFacturesTraitees?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8088/auth';
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getCurrentUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkTokenExpiration();
  }

  // ===== AUTHENTIFICATION =====

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            this.setSession(response);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    // Appel au backend pour le logout
    this.http.post(`${this.API_URL}/logout`, {}).subscribe();

    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<any>(`${this.API_URL}/refresh`, {}, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            localStorage.setItem(this.TOKEN_KEY, response.token);
          }
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  getCurrentUserProfile(): Observable<User> {
    return this.http.get<any>(`${this.API_URL}/me`)
      .pipe(
        map(response => {
          if (response.success) {
            this.setCurrentUser(response.user);
            return response.user;
          }
          throw new Error('Failed to get user profile');
        }),
        catchError(this.handleError)
      );
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return new BehaviorSubject(false).asObservable();
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post<any>(`${this.API_URL}/validate-token`, {}, { headers })
      .pipe(
        map(response => response.success && response.valid),
        catchError(() => new BehaviorSubject(false).asObservable())
      );
  }

  // ===== GESTION DE SESSION =====

  private setSession(authResponse: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResponse.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    this.currentUserSubject.next(authResponse.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  /*private setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }*/

  // ===== GETTERS =====

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getCurrentUserFromStorage(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    if (user) {
      try {
        return JSON.parse(user);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem(this.USER_KEY);
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private checkTokenExpiration(): void {
    setInterval(() => {
      const token = this.getToken();
      if (token && this.isTokenExpired(token)) {
        console.log('Token expired, logging out...');
        this.logout();
      }
    }, 60000); // Vérifier toutes les minutes
  }

  // ===== AUTORISATIONS =====

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return roles.includes(user?.role || '');
  }

  canCreateFacture(): boolean {
    return this.hasRole('U1');
  }

  canValidateV1(): boolean {
    return this.hasRole('V1');
  }

  canValidateV2(): boolean {
    return this.hasRole('V2');
  }

  canManageTreasury(): boolean {
    return this.hasRole('T1');
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

 setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
  // ===== GESTION D'ERREURS =====

  private handleError(error: any): Observable<never> {
    console.error('Auth service error:', error);

    let errorMessage = 'Une erreur s\'est produite';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Impossible de contacter le serveur';
    } else if (error.status === 401) {
      errorMessage = 'Identifiants incorrects';
    } else if (error.status === 403) {
      errorMessage = 'Accès non autorisé';
    } else if (error.status >= 500) {
      errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
    }

    return throwError(() => new Error(errorMessage));
  }
}
