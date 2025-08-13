// Fichier: facture-front1/src/app/demo/factures/services/facture.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';

import {
  FactureCreateDto,
  FactureResponse,
  User
} from '../models/facture.model';

@Injectable({
  providedIn: 'root'
})
export class FactureService {

  private apiUrl = 'http://localhost:8088/api/factures';

  constructor(private http: HttpClient) {}

  // ===== MÉTHODES RÉELLES =====

  createFacture(facture: FactureCreateDto): Observable<FactureResponse> {
    return this.http.post<FactureResponse>(`${this.apiUrl}`, facture)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création de la facture:', error);
          // En cas d'erreur, simuler une réponse
          return this.simulateCreateFacture(facture);
        })
      );
  }

  getDonneesReference(): Observable<{
    validateursV1: User[],
    validateursV2: User[],
    tresoriers: User[]
  }> {
    return this.http.get<{validateursV1: User[], validateursV2: User[], tresoriers: User[]}>(`${this.apiUrl}/donnees-reference`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des données de référence:', error);
          // En cas d'erreur, utiliser les données simulées
          return this.simulateGetDonneesReference();
        })
      );
  }

  getFactureById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération de la facture:', error);
          return throwError(() => error);
        })
      );
  }

  getMesFactures(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mes-factures`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des factures:', error);
          return of([]);
        })
      );
  }

  updateFacture(id: number, facture: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, facture)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la mise à jour de la facture:', error);
          return throwError(() => error);
        })
      );
  }

  deleteFacture(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la suppression de la facture:', error);
          return throwError(() => error);
        })
      );
  }

  // ===== MÉTHODES DE VALIDATION =====

  validerParV1(id: number, commentaire: string, approuve: boolean): Observable<any> {
    const payload = { commentaire, approuve };
    return this.http.post<any>(`${this.apiUrl}/${id}/valider-v1`, payload)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la validation V1:', error);
          return throwError(() => error);
        })
      );
  }

  validerParV2(id: number, commentaire: string, approuve: boolean): Observable<any> {
    const payload = { commentaire, approuve };
    return this.http.post<any>(`${this.apiUrl}/${id}/valider-v2`, payload)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la validation V2:', error);
          return throwError(() => error);
        })
      );
  }

  payerFacture(id: number, referencePaiement: string, datePaiement?: string, commentaire?: string): Observable<any> {
    const payload = { referencePaiement, datePaiement, commentaire };
    return this.http.post<any>(`${this.apiUrl}/${id}/payer`, payload)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du paiement:', error);
          return throwError(() => error);
        })
      );
  }

  // ===== MÉTHODES DE RÉCUPÉRATION PAR RÔLE =====

  getFacturesEnAttenteV1(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/en-attente-v1`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des factures V1:', error);
          return of([]);
        })
      );
  }

  getFacturesEnAttenteV2(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/en-attente-v2`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des factures V2:', error);
          return of([]);
        })
      );
  }

  getFacturesEnAttenteTresorerie(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/en-attente-tresorerie`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des factures trésorerie:', error);
          return of([]);
        })
      );
  }

  getMesTaches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mes-taches`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des tâches:', error);
          return of([]);
        })
      );
  }

  // ===== MÉTHODES DE SIMULATION (fallback) =====

  private simulateCreateFacture(facture: FactureCreateDto): Observable<FactureResponse> {
    console.log('🚀 Simulation création facture:', facture);

    const response: FactureResponse = {
      success: true,
      message: 'Facture créée avec succès (mode simulation)',
      factureId: Math.floor(Math.random() * 1000),
      numero: `FACT-2025-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    };

    return of(response).pipe(delay(1500));
  }

  private simulateGetDonneesReference(): Observable<{
    validateursV1: User[],
    validateursV2: User[],
    tresoriers: User[]
  }> {
    const donneesReference = {
      validateursV1: [
        {
          id: 1,
          nom: 'Martin',
          prenom: 'Sophie',
          email: 'sophie.martin@factureapp.com',
          nomComplet: 'Sophie Martin',
          role: 'V1',
          actif: true
        },
        {
          id: 2,
          nom: 'Dubois',
          prenom: 'Pierre',
          email: 'pierre.dubois@factureapp.com',
          nomComplet: 'Pierre Dubois',
          role: 'V1',
          actif: true
        },
        {
          id: 3,
          nom: 'Lefebvre',
          prenom: 'Marie',
          email: 'marie.lefebvre@factureapp.com',
          nomComplet: 'Marie Lefebvre',
          role: 'V1',
          actif: true
        }
      ] as User[],
      validateursV2: [
        {
          id: 4,
          nom: 'Moreau',
          prenom: 'Jean',
          email: 'jean.moreau@factureapp.com',
          nomComplet: 'Jean Moreau',
          role: 'V2',
          actif: true
        },
        {
          id: 5,
          nom: 'Bernard',
          prenom: 'Claire',
          email: 'claire.bernard@factureapp.com',
          nomComplet: 'Claire Bernard',
          role: 'V2',
          actif: true
        },
        {
          id: 6,
          nom: 'Petit',
          prenom: 'Luc',
          email: 'luc.petit@factureapp.com',
          nomComplet: 'Luc Petit',
          role: 'V2',
          actif: true
        }
      ] as User[],
      tresoriers: [
        {
          id: 7,
          nom: 'Durand',
          prenom: 'Anne',
          email: 'anne.durand@factureapp.com',
          nomComplet: 'Anne Durand',
          role: 'T1',
          actif: true
        },
        {
          id: 8,
          nom: 'Rousseau',
          prenom: 'Michel',
          email: 'michel.rousseau@factureapp.com',
          nomComplet: 'Michel Rousseau',
          role: 'T1',
          actif: true
        }
      ] as User[]
    };

    return of(donneesReference).pipe(delay(800));
  }
}
