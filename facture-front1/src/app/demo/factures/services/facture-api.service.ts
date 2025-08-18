// Fichier: facture-front1/src/app/demo/factures/services/facture-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

// Interfaces pour les factures
export interface FactureDto {
  id: number;
  numero: string;
  nomFournisseur: string;
  formeJuridique?: string;
  dateFacture: string;
  dateCreation: string;
  dateModification?: string;
  dateEcheance?: string;
  montantHT: number;
  montantTVA?: number;
  montantTTC?: number;
  tauxTVA?: number;
  rasTVA?: number;
  statut: string;
  priority?: string;
  modalite?: string;
  designation?: string;
  refCommande?: string;
  periode?: string;
  refacturable: boolean;
  etrangerLocal?: string;
  commentaires?: string;

  // Relations
  createurId: number;
  validateur1Id?: number;
  validateur2Id?: number;
  tresorierIdId?: number;

  // Workflow dates
  dateEnvoiV1?: string;
  dateValidationV1?: string;
  dateEnvoiV2?: string;
  dateValidationV2?: string;
  dateEnvoiTresorerie?: string;
  datePaiement?: string;

  // Métadonnées
  pieceJointeNom?: string;
  pieceJointeTaille?: number;
  pieceJointeType?: string;
}

export interface FactureResponse {
  success: boolean;
  message: string;
  data: FactureDto[];
  total: number;
  page: number;
  limit: number;
}

export interface FactureSingleResponse {
  success: boolean;
  message: string;
  data: FactureDto;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FactureApiService {

  private apiUrl = `${environment.apiUrl}/api/factures`;

  // Subject pour les factures en temps réel
  private facturesSubject = new BehaviorSubject<FactureDto[]>([]);
  public factures$ = this.facturesSubject.asObservable();

  // Cache pour éviter les appels répétés
  private facturesCache: Map<string, { data: FactureDto[], timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ===== MÉTHODES CRUD =====

  /**
   * Récupérer les factures de l'utilisateur connecté
   */
  getMesFactures(params: PaginationParams = {}): Observable<FactureResponse> {
    const cacheKey = JSON.stringify(params);
    const cached = this.facturesCache.get(cacheKey);

    // Vérifier le cache
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return of({
        success: true,
        message: 'Données depuis le cache',
        data: cached.data,
        total: cached.data.length,
        page: params.page || 1,
        limit: params.limit || 10
      });
    }

    let httpParams = new HttpParams();

    // Ajouter les paramètres de pagination et filtres
    Object.keys(params).forEach(key => {
      const value = params[key as keyof PaginationParams];
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<FactureResponse>(`${this.apiUrl}/mes-factures`, {
      params: httpParams,
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          // Mettre à jour le cache
          this.facturesCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
          });

          // Mettre à jour le subject
          this.facturesSubject.next(response.data);
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des factures:', error);
        // En cas d'erreur, retourner des données de fallback
        return this.getFallbackFactures(params);
      })
    );
  }

  /**
   * Récupérer une facture par son ID
   */
  getFactureById(id: number): Observable<FactureSingleResponse> {
    return this.http.get<FactureSingleResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de la facture:', error);
        return of({
          success: false,
          message: 'Erreur lors de la récupération de la facture',
          data: {} as FactureDto
        });
      })
    );
  }

  /**
   * Créer une nouvelle facture
   */
  createFacture(facture: any): Observable<FactureSingleResponse> {
    return this.http.post<FactureSingleResponse>(this.apiUrl, facture, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          // Invalider le cache
          this.invalidateCache();
          // Recharger les factures
          this.refreshFactures();
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la création de la facture:', error);
        throw error;
      })
    );
  }

  /**
   * Mettre à jour une facture
   */
  updateFacture(id: number, facture: any): Observable<FactureSingleResponse> {
    return this.http.put<FactureSingleResponse>(`${this.apiUrl}/${id}`, facture, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.invalidateCache();
          this.refreshFactures();
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la mise à jour de la facture:', error);
        throw error;
      })
    );
  }

  /**
   * Supprimer une facture
   */
  deleteFacture(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.invalidateCache();
        this.refreshFactures();
      }),
      catchError(error => {
        console.error('Erreur lors de la suppression de la facture:', error);
        throw error;
      })
    );
  }

  // ===== MÉTHODES DE WORKFLOW =====

  /**
   * Envoyer une facture en validation V1
   */
  envoyerEnValidationV1(id: number, commentaire?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/envoyer-v1`,
      { commentaire },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        this.invalidateCache();
        this.refreshFactures();
      }),
      catchError(error => {
        console.error('Erreur lors de l\'envoi en validation V1:', error);
        throw error;
      })
    );
  }

  /**
   * Dupliquer une facture
   */
  dupliquerFacture(id: number): Observable<FactureSingleResponse> {
    return this.http.post<FactureSingleResponse>(`${this.apiUrl}/${id}/dupliquer`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.invalidateCache();
          this.refreshFactures();
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la duplication de la facture:', error);
        throw error;
      })
    );
  }

  // ===== MÉTHODES DE STATISTIQUES =====

  /**
   * Récupérer les statistiques des factures
   */
  getStatistiques(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistiques`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return of({
          total: 0,
          brouillon: 0,
          enValidation: 0,
          validees: 0,
          rejetees: 0,
          payees: 0,
          montantTotal: 0
        });
      })
    );
  }

  // ===== MÉTHODES DE CACHE ET UTILITAIRES =====

  /**
   * Rafraîchir les factures depuis l'API
   */
  refreshFactures(): void {
    this.getMesFactures().subscribe();
  }

  /**
   * Invalider le cache
   */
  private invalidateCache(): void {
    this.facturesCache.clear();
  }

  /**
   * Obtenir les headers d'authentification
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Données de fallback en cas d'erreur de l'API
   */
  private getFallbackFactures(params: PaginationParams): Observable<FactureResponse> {
    const currentUser = this.authService.getCurrentUser();

    const fallbackFactures: FactureDto[] = [
      {
        id: 1,
        numero: 'FAC-2025-0001',
        nomFournisseur: 'TechnoServices SARL',
        formeJuridique: 'SARL',
        dateFacture: '2025-01-18',
        dateCreation: '2025-01-18T09:30:00.000Z',
        dateEcheance: '2025-02-17',
        montantHT: 15750.00,
        montantTVA: 3150.00,
        montantTTC: 18900.00,
        tauxTVA: 20,
        statut: 'EN_VALIDATION_V1',
        priority: 'NORMAL',
        modalite: 'DELAI_30',
        designation: 'Prestations informatiques - Développement application web',
        refCommande: 'CMD-2025-001',
        periode: 'Janvier 2025',
        refacturable: false,
        etrangerLocal: 'LOCAL',
        createurId: currentUser?.id || 1,
        validateur1Id: 2,
        dateEnvoiV1: '2025-01-18T09:35:00.000Z',
        pieceJointeNom: 'facture_techno.pdf',
        pieceJointeTaille: 245760,
        pieceJointeType: 'application/pdf'
      },
      {
        id: 2,
        numero: 'FAC-2025-0002',
        nomFournisseur: 'Consulting Digital Plus',
        formeJuridique: 'SAS',
        dateFacture: '2025-01-17',
        dateCreation: '2025-01-17T14:20:00.000Z',
        dateModification: '2025-01-17T16:45:00.000Z',
        dateEcheance: '2025-02-16',
        montantHT: 8500.00,
        montantTVA: 1700.00,
        montantTTC: 10200.00,
        tauxTVA: 20,
        statut: 'REJETEE',
        priority: 'URGENT',
        modalite: 'DELAI_30',
        designation: 'Conseil en stratégie digitale et transformation numérique',
        refCommande: 'CMD-2025-002',
        periode: 'Janvier 2025',
        refacturable: false,
        etrangerLocal: 'LOCAL',
        commentaires: 'Facture urgente - projet prioritaire client',
        createurId: currentUser?.id || 1,
        validateur1Id: 2,
        dateEnvoiV1: '2025-01-17T14:25:00.000Z',
        pieceJointeNom: 'facture_consulting.pdf',
        pieceJointeTaille: 189440,
        pieceJointeType: 'application/pdf'
      }
    ];

    return of({
      success: true,
      message: 'Données de fallback (mode hors ligne)',
      data: fallbackFactures,
      total: fallbackFactures.length,
      page: params.page || 1,
      limit: params.limit || 10
    });
  }

  // ===== MÉTHODES D'INITIALISATION =====

  /**
   * Initialiser des factures de test dans la base de données
   */
  initializeTestFactures(): Observable<any> {
    const testFactures = [
      {
        nomFournisseur: 'TechnoServices SARL',
        formeJuridique: 'SARL',
        dateFacture: '2025-01-18',
        montantHT: 15750.00,
        tauxTVA: 20,
        modalite: 'DELAI_30',
        designation: 'Prestations informatiques - Développement application web',
        refCommande: 'CMD-2025-001',
        periode: 'Janvier 2025',
        refacturable: false,
        etrangerLocal: 'LOCAL',
        validateur1Id: 2,
        validateur2Id: 4,
        commentaires: 'Facture de test pour le développement'
      },
      {
        nomFournisseur: 'Consulting Digital Plus',
        formeJuridique: 'SAS',
        dateFacture: '2025-01-17',
        montantHT: 8500.00,
        tauxTVA: 20,
        modalite: 'DELAI_30',
        designation: 'Conseil en stratégie digitale et transformation numérique',
        refCommande: 'CMD-2025-002',
        periode: 'Janvier 2025',
        refacturable: false,
        etrangerLocal: 'LOCAL',
        validateur1Id: 2,
        validateur2Id: 4,
        commentaires: 'Facture de test - conseil stratégique'
      }
    ];

    return this.http.post(`${this.apiUrl}/init-test-data`, { factures: testFactures }, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        console.log('Factures de test initialisées avec succès');
        this.invalidateCache();
        this.refreshFactures();
      }),
      catchError(error => {
        console.error('Erreur lors de l\'initialisation des factures de test:', error);
        return of({ success: false, message: 'Erreur lors de l\'initialisation' });
      })
    );
  }
}
