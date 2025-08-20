// Fichier: src/app/services/facture.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface FactureDto {
  id: number;
  numero: string;
  nomFournisseur: string;
  montantHT: number;
  montantTTC: number;
  dateFacture: string;
  dateEcheance: string;
  dateReception: string;
  statut: string;
  designation: string;
  createurNom: string;
  joursAvantEcheance: number;
  urgente: boolean;
  commentaires?: string;
  pieceJointe?: string;
  validateur1Id?: number;
  validateur2Id?: number;
  tresorierIdId?: number;
}

export interface ValidationDto {
  approuve: boolean;
  commentaire: string;
  motifRejet?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FactureService {

  private apiUrl = `${environment.apiUrl}/api`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ===== MÉTHODES POUR VALIDATION V1 =====

  getFacturesEnAttenteV1(): Observable<FactureDto[]> {
    console.log('🔍 Récupération des factures en attente V1');

    // Pour l'instant, utiliser des données statiques
    return this.getFacturesStatiquesV1().pipe(
      delay(800), // Simulation du délai réseau
      catchError(error => {
        console.error('❌ Erreur récupération factures V1:', error);
        return throwError(() => new Error('Erreur lors de la récupération des factures'));
      })
    );
  }

  validerFactureV1(factureId: number, validation: ValidationDto): Observable<any> {
    console.log('✅ Validation V1 de la facture:', factureId, validation);

    // Simulation de l'appel API
    return of({
      success: true,
      message: validation.approuve ? 'Facture validée avec succès' : 'Facture rejetée',
      factureId: factureId
    }).pipe(
      delay(500),
      catchError(error => {
        console.error('❌ Erreur validation V1:', error);
        return throwError(() => new Error('Erreur lors de la validation'));
      })
    );
  }

  // ===== MÉTHODES POUR VALIDATION V2 =====

  getFacturesEnAttenteV2(): Observable<FactureDto[]> {
    console.log('🔍 Récupération des factures en attente V2');

    return this.getFacturesStatiquesV2().pipe(
      delay(800),
      catchError(error => {
        console.error('❌ Erreur récupération factures V2:', error);
        return throwError(() => new Error('Erreur lors de la récupération des factures'));
      })
    );
  }

  validerFactureV2(factureId: number, validation: ValidationDto): Observable<any> {
    console.log('✅ Validation V2 de la facture:', factureId, validation);

    return of({
      success: true,
      message: validation.approuve ? 'Facture validée V2 avec succès' : 'Facture rejetée par V2',
      factureId: factureId
    }).pipe(
      delay(500),
      catchError(error => {
        console.error('❌ Erreur validation V2:', error);
        return throwError(() => new Error('Erreur lors de la validation V2'));
      })
    );
  }

  // ===== MÉTHODES POUR TRÉSORERIE =====

  getFacturesEnAttenteTresorerie(): Observable<FactureDto[]> {
    console.log('🔍 Récupération des factures en attente trésorerie');

    return this.getFacturesStatiquesTresorerie().pipe(
      delay(800),
      catchError(error => {
        console.error('❌ Erreur récupération factures trésorerie:', error);
        return throwError(() => new Error('Erreur lors de la récupération des factures'));
      })
    );
  }

  traiterFactureTresorerie(factureId: number, paiement: any): Observable<any> {
    console.log('💰 Traitement trésorerie de la facture:', factureId, paiement);

    return of({
      success: true,
      message: 'Facture traitée par la trésorerie avec succès',
      factureId: factureId
    }).pipe(
      delay(500),
      catchError(error => {
        console.error('❌ Erreur traitement trésorerie:', error);
        return throwError(() => new Error('Erreur lors du traitement trésorerie'));
      })
    );
  }

  // ===== MÉTHODES GÉNÉRIQUES =====

  getFactureById(id: number): Observable<FactureDto> {
    console.log('🔍 Récupération de la facture:', id);

    // Simuler la récupération d'une facture spécifique
    const factures = this.getAllFacturesStatiques();
    const facture = factures.find(f => f.id === id);

    if (facture) {
      return of(facture).pipe(delay(300));
    } else {
      return throwError(() => new Error('Facture non trouvée'));
    }
  }

  getMesFactures(): Observable<FactureDto[]> {
    console.log('🔍 Récupération de mes factures');

    return this.getFacturesStatiquesCreees().pipe(
      delay(800),
      catchError(error => {
        console.error('❌ Erreur récupération mes factures:', error);
        return throwError(() => new Error('Erreur lors de la récupération de vos factures'));
      })
    );
  }

  getFacturesUrgentes(): Observable<FactureDto[]> {
    console.log('🔍 Récupération des factures urgentes');

    const facturesUrgentes = this.getAllFacturesStatiques().filter(f =>
      f.urgente || f.joursAvantEcheance <= 5
    );

    return of(facturesUrgentes).pipe(delay(500));
  }

  // ===== DONNÉES STATIQUES =====

  private getFacturesStatiquesV1(): Observable<FactureDto[]> {
    const factures: FactureDto[] = [
      {
        id: 1,
        numero: 'FACT2024001',
        nomFournisseur: 'MAROC TELECOM',
        montantHT: 5000.00,
        montantTTC: 6000.00,
        dateFacture: '2024-01-15',
        dateEcheance: '2024-02-14',
        dateReception: '2024-01-20',
        statut: 'EN_VALIDATION_V1',
        designation: 'Services de télécommunication - Janvier 2024',
        createurNom: 'Jean Dupont',
        joursAvantEcheance: 25,
        urgente: false,
        commentaires: 'Facture mensuelle standard',
        pieceJointe: 'facture_MT_01_2024.pdf'
      },
      {
        id: 2,
        numero: 'FACT2024002',
        nomFournisseur: 'LYDEC',
        montantHT: 2500.00,
        montantTTC: 3000.00,
        dateFacture: '2024-01-10',
        dateEcheance: '2024-01-25',
        dateReception: '2024-01-18',
        statut: 'EN_VALIDATION_V1',
        designation: 'Électricité et eau - Bureaux administratifs',
        createurNom: 'Marie Martin',
        joursAvantEcheance: 5,
        urgente: true,
        commentaires: 'Facture urgente - échéance proche',
        pieceJointe: 'facture_LYDEC_01_2024.pdf'
      },
      {
        id: 3,
        numero: 'FACT2024003',
        nomFournisseur: 'OFFICE CHÉRIFIEN DES PHOSPHATES',
        montantHT: 15000.00,
        montantTTC: 18000.00,
        dateFacture: '2024-01-12',
        dateEcheance: '2024-02-11',
        dateReception: '2024-01-19',
        statut: 'EN_VALIDATION_V1',
        designation: 'Fournitures chimiques - Commande Q1',
        createurNom: 'Ahmed Benjelloun',
        joursAvantEcheance: 22,
        urgente: false,
        commentaires: 'Commande trimestrielle',
        pieceJointe: 'facture_OCP_Q1_2024.pdf'
      },
      {
        id: 4,
        numero: 'FACT2024004',
        nomFournisseur: 'RAM',
        montantHT: 3200.00,
        montantTTC: 3840.00,
        dateFacture: '2024-01-08',
        dateEcheance: '2024-01-23',
        dateReception: '2024-01-16',
        statut: 'EN_VALIDATION_V1',
        designation: 'Billets d\'avion - Mission Casablanca-Paris',
        createurNom: 'Fatima Zahra',
        joursAvantEcheance: 3,
        urgente: true,
        commentaires: 'Mission urgente équipe commerciale',
        pieceJointe: 'billets_RAM_mission_01_2024.pdf'
      },
      {
        id: 5,
        numero: 'FACT2024005',
        nomFournisseur: 'AMENDIS',
        montantHT: 1800.00,
        montantTTC: 2160.00,
        dateFacture: '2024-01-14',
        dateEcheance: '2024-02-13',
        dateReception: '2024-01-21',
        statut: 'EN_VALIDATION_V1',
        designation: 'Distribution électrique - Site de production',
        createurNom: 'Youssef Alami',
        joursAvantEcheance: 24,
        urgente: false,
        commentaires: 'Facture mensuelle distribution',
        pieceJointe: 'facture_AMENDIS_01_2024.pdf'
      }
    ];

    return of(factures);
  }

  private getFacturesStatiquesV2(): Observable<FactureDto[]> {
    const factures: FactureDto[] = [
      {
        id: 101,
        numero: 'FACT2024101',
        nomFournisseur: 'WANA CORPORATE',
        montantHT: 8000.00,
        montantTTC: 9600.00,
        dateFacture: '2024-01-05',
        dateEcheance: '2024-02-04',
        dateReception: '2024-01-12',
        statut: 'EN_VALIDATION_V2',
        designation: 'Services internet entreprise - Forfait annuel',
        createurNom: 'Karim Benali',
        joursAvantEcheance: 15,
        urgente: false,
        commentaires: 'Validé par V1 le 2024-01-18',
        pieceJointe: 'facture_WANA_2024.pdf'
      },
      {
        id: 102,
        numero: 'FACT2024102',
        nomFournisseur: 'HOLCIM MAROC',
        montantHT: 25000.00,
        montantTTC: 30000.00,
        dateFacture: '2024-01-03',
        dateEcheance: '2024-01-28',
        dateReception: '2024-01-10',
        statut: 'EN_VALIDATION_V2',
        designation: 'Ciment et matériaux de construction',
        createurNom: 'Nadia Fassi',
        joursAvantEcheance: 8,
        urgente: true,
        commentaires: 'Commande urgente chantier - Validé V1',
        pieceJointe: 'facture_HOLCIM_2024.pdf'
      }
    ];

    return of(factures);
  }

  private getFacturesStatiquesTresorerie(): Observable<FactureDto[]> {
    const factures: FactureDto[] = [
      {
        id: 201,
        numero: 'FACT2024201',
        nomFournisseur: 'MANAGEM',
        montantHT: 45000.00,
        montantTTC: 54000.00,
        dateFacture: '2024-01-02',
        dateEcheance: '2024-02-01',
        dateReception: '2024-01-08',
        statut: 'EN_TRESORERIE',
        designation: 'Services miniers - Expertise géologique',
        createurNom: 'Omar Alaoui',
        joursAvantEcheance: 12,
        urgente: false,
        commentaires: 'Validé V1 et V2 - Prêt pour paiement',
        pieceJointe: 'facture_MANAGEM_2024.pdf'
      }
    ];

    return of(factures);
  }

  private getFacturesStatiquesCreees(): Observable<FactureDto[]> {
    const factures: FactureDto[] = [
      {
        id: 301,
        numero: 'FACT2024301',
        nomFournisseur: 'REDAL',
        montantHT: 2200.00,
        montantTTC: 2640.00,
        dateFacture: '2024-01-18',
        dateEcheance: '2024-02-17',
        dateReception: '2024-01-22',
        statut: 'SAISIE',
        designation: 'Électricité - Siège social',
        createurNom: 'Utilisateur connecté',
        joursAvantEcheance: 28,
        urgente: false,
        commentaires: 'En cours de saisie',
        pieceJointe: 'facture_REDAL_01_2024.pdf'
      }
    ];

    return of(factures);
  }

  private getAllFacturesStatiques(): FactureDto[] {
    // Combine toutes les factures statiques
    const facturesV1 = [
      // ... données des factures V1
    ];
    const facturesV2 = [
      // ... données des factures V2
    ];
    const facturesTresorerie = [
      // ... données des factures trésorerie
    ];
    const facturesCreees = [
      // ... données des factures créées
    ];

    return [...facturesV1, ...facturesV2, ...facturesTresorerie, ...facturesCreees];
  }

  // ===== MÉTHODES UTILITAIRES =====

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private handleError = (error: any): Observable<never> => {
    console.error('❌ Erreur FactureService:', error);

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
      errorMessage = 'Facture non trouvée';
    } else if (error.status >= 500) {
      errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
    }

    return throwError(() => new Error(errorMessage));
  };
}
