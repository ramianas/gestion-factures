// Fichier: src/app/demo/factures/services/facture.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  FactureCreateDto,
  FactureResponse,
  User
} from '../models/facture.model';

@Injectable({
  providedIn: 'root'
})
export class FactureService {

  private apiUrl = 'http://localhost:8088/api/v1/factures'; // Votre backend Spring Boot

  constructor(private http: HttpClient) {}

  // ===== MÉTHODES RÉELLES (pour plus tard) =====

  createFacture(facture: FactureCreateDto): Observable<FactureResponse> {
    // return this.http.post<FactureResponse>(`${this.apiUrl}`, facture);

    // Pour l'instant, simulation avec données mockées
    return this.simulateCreateFacture(facture);
  }

  getDonneesReference(): Observable<{
    validateursV1: User[],
    validateursV2: User[],
    tresoriers: User[]
  }> {
    // return this.http.get<{validateursV1: User[], validateursV2: User[], tresoriers: User[]}>(`${this.apiUrl}/donnees-reference`);

    // Pour l'instant, simulation avec données mockées
    return this.simulateGetDonneesReference();
  }

  // ===== MÉTHODES DE SIMULATION (pour le développement) =====

  private simulateCreateFacture(facture: FactureCreateDto): Observable<FactureResponse> {
    console.log('🚀 Simulation création facture:', facture);

    const response: FactureResponse = {
      success: true,
      message: 'Facture créée avec succès',
      factureId: Math.floor(Math.random() * 1000),
      numero: `FACT-2025-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    };

    return of(response).pipe(delay(1500)); // Simulation délai réseau
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

    return of(donneesReference).pipe(delay(800)); // Simulation délai réseau
  }
}
