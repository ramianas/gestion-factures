// validation-tresorerie.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { Facture, FactureService } from '../services/facture.service';

export interface TresorerieStats {
  enAttente: number;
  urgent: number;
  montantTotal: number;
  traitees: number;
  moyenneDelaiPaiement: number;
}

export interface PaiementAction {
  factureId: number;
  referencePaiement: string;
  datePaiement: string;
  commentaire: string;
}

export interface FiltresTresorerie {
  recherche: string;
  montantMin: number | null;
  montantMax: number | null;
  dateEcheanceDebut: string;
  dateEcheanceFin: string;
  urgentesOnly: boolean;
  fournisseur: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationTresorerieService {

  private apiUrl = `${environment.apiUrl}/api/factures`;

  // Subject pour les notifications en temps réel
  private facturesEnAttenteSubject = new BehaviorSubject<Facture[]>([]);
  public facturesEnAttente$ = this.facturesEnAttenteSubject.asObservable();

  // Cache pour les statistiques
  private statsCache: TresorerieStats | null = null;
  private statsCacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private factureService: FactureService
  ) {}

  // ===== RÉCUPÉRATION DES FACTURES =====

  /**
   * Récupère les factures en attente de traitement par la trésorerie
   */
  getFacturesEnAttenteTresorerie(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/en-attente-tresorerie`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      tap(factures => {
        // Mettre à jour le subject pour les abonnés
        this.facturesEnAttenteSubject.next(factures);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère une facture spécifique en attente de traitement
   */
  getFactureEnAttenteById(id: number): Observable<Facture> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFactureResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Recherche de factures avec filtres
   */
  rechercherFactures(filtres: FiltresTresorerie): Observable<Facture[]> {
    let params = new HttpParams();

    if (filtres.recherche) {
      params = params.set('search', filtres.recherche);
    }
    if (filtres.montantMin !== null) {
      params = params.set('montantMin', filtres.montantMin.toString());
    }
    if (filtres.montantMax !== null) {
      params = params.set('montantMax', filtres.montantMax.toString());
    }
    if (filtres.dateEcheanceDebut) {
      params = params.set('dateEcheanceDebut', filtres.dateEcheanceDebut);
    }
    if (filtres.dateEcheanceFin) {
      params = params.set('dateEcheanceFin', filtres.dateEcheanceFin);
    }
    if (filtres.urgentesOnly) {
      params = params.set('urgentesOnly', 'true');
    }
    if (filtres.fournisseur) {
      params = params.set('fournisseur', filtres.fournisseur);
    }

    return this.http.get<Facture[]>(`${this.apiUrl}/recherche-tresorerie`, {
      params: params,
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  // ===== ACTIONS DE PAIEMENT =====

  /**
   * Traite le paiement d'une facture
   */
  traiterPaiement(action: PaiementAction): Observable<any> {
    const paiementData = {
      referencePaiement: action.referencePaiement,
      datePaiement: action.datePaiement,
      commentaire: action.commentaire
    };

    return this.http.post<any>(`${this.apiUrl}/${action.factureId}/payer`, paiementData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          // Invalider le cache des statistiques
          this.invalidateStatsCache();

          // Recharger les factures en attente
          this.refreshFacturesEnAttente();

          return response;
        }
        throw new Error(response.message || 'Erreur lors du traitement du paiement');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Traite plusieurs paiements en lot
   */
  traiterPaiementsEnLot(factureIds: number[], referencePaiementBase: string, commentaire?: string): Observable<any> {
    const paiementLotData = {
      factureIds,
      referencePaiementBase,
      datePaiement: new Date().toISOString().split('T')[0],
      commentaire: commentaire || ''
    };

    return this.http.post<any>(`${this.apiUrl}/payer-lot`, paiementLotData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          this.invalidateStatsCache();
          this.refreshFacturesEnAttente();
          return response;
        }
        throw new Error(response.message || 'Erreur lors du traitement en lot');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Marque une facture comme prioritaire
   */
  marquerCommePrioritaire(factureId: number, prioritaire: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${factureId}/priorite`,
      { prioritaire },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          this.refreshFacturesEnAttente();
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la modification de la priorité');
      }),
      catchError(this.handleError)
    );
  }

  // ===== STATISTIQUES =====

  /**
   * Récupère les statistiques de la trésorerie
   */
  getStatistiquesTresorerie(): Observable<TresorerieStats> {
    // Vérifier le cache
    const now = Date.now();
    if (this.statsCache && (now - this.statsCacheTimestamp) < this.CACHE_DURATION) {
      return new BehaviorSubject(this.statsCache).asObservable();
    }

    return this.http.get<any>(`${this.apiUrl}/statistiques-tresorerie`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        const stats: TresorerieStats = {
          enAttente: response.enAttente || 0,
          urgent: response.urgent || 0,
          montantTotal: response.montantTotal || 0,
          traitees: response.traitees || 0,
          moyenneDelaiPaiement: response.moyenneDelaiPaiement || 0
        };

        // Mettre en cache
        this.statsCache = stats;
        this.statsCacheTimestamp = now;

        return stats;
      }),
      catchError(error => {
        console.warn('Impossible de récupérer les statistiques, utilisation des valeurs par défaut');
        return new BehaviorSubject<TresorerieStats>({
          enAttente: 0,
          urgent: 0,
          montantTotal: 0,
          traitees: 0,
          moyenneDelaiPaiement: 0
        }).asObservable();
      })
    );
  }

  /**
   * Récupère le tableau de bord de la trésorerie
   */
  getTableauBordTresorerie(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tableau-bord-tresorerie`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        return {
          facturesEnAttente: response.facturesEnAttente || 0,
          facturesUrgentes: response.facturesUrgentes || 0,
          montantTotalEnAttente: response.montantTotalEnAttente || 0,
          facturesPayeesAujourdhui: response.facturesPayeesAujourdhui || 0,
          montantPayeAujourdhui: response.montantPayeAujourdhui || 0,
          moyenneDelaiPaiement: response.moyenneDelaiPaiement || 0,
          evolutionPaiements: response.evolutionPaiements || [],
          topFournisseurs: response.topFournisseurs || []
        };
      }),
      catchError(error => {
        console.error('Erreur tableau de bord trésorerie:', error);
        return new BehaviorSubject({
          facturesEnAttente: 0,
          facturesUrgentes: 0,
          montantTotalEnAttente: 0,
          facturesPayeesAujourdhui: 0,
          montantPayeAujourdhui: 0,
          moyenneDelaiPaiement: 0,
          evolutionPaiements: [],
          topFournisseurs: []
        }).asObservable();
      })
    );
  }

  // ===== EXPORT ET RAPPORTS =====

  /**
   * Exporte les factures en attente
   */
  exporterFactures(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export-tresorerie?format=${format}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Génère un rapport de trésorerie
   */
  genererRapport(dateDebut: string, dateFin: string): Observable<any> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);

    return this.http.get<any>(`${this.apiUrl}/rapport-tresorerie`, {
      params: params,
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la génération du rapport:', error);
        throw error;
      })
    );
  }

  // ===== HISTORIQUE =====

  /**
   * Récupère l'historique des paiements traités
   */
  getHistoriquePaiements(limit: number = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/historique-paiements?limit=${limit}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return new BehaviorSubject<any[]>([]).asObservable();
      })
    );
  }

  // ===== PIÈCES JOINTES =====

  /**
   * Télécharge la pièce jointe d'une facture
   */
  telechargerPieceJointe(factureId: number, nomFichier: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${factureId}/piece-jointe/${nomFichier}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Erreur téléchargement pièce jointe:', error);
        throw error;
      })
    );
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Rafraîchit la liste des factures en attente
   */
  refreshFacturesEnAttente(): void {
    this.getFacturesEnAttenteTresorerie().subscribe();
  }

  /**
   * Invalide le cache des statistiques
   */
  private invalidateStatsCache(): void {
    this.statsCache = null;
    this.statsCacheTimestamp = 0;
  }

  /**
   * Vérifie si une facture est urgente
   */
  isFactureUrgente(facture: Facture): boolean {
    if (!facture.dateEcheance) return false;

    const now = new Date();
    const echeance = new Date(facture.dateEcheance);
    const diffTime = echeance.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 5 && diffDays >= 0;
  }

  /**
   * Calcule le nombre de jours avant échéance
   */
  getJoursAvantEcheance(facture: Facture): number {
    if (!facture.dateEcheance) return 999;

    const now = new Date();
    const echeance = new Date(facture.dateEcheance);
    const diffTime = echeance.getTime() - now.getTime();

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Génère une référence de paiement
   */
  genererReferencePaiement(facture: Facture): string {
    const annee = new Date().getFullYear();
    const mois = String(new Date().getMonth() + 1).padStart(2, '0');
    const jour = String(new Date().getDate()).padStart(2, '0');
    return `PAY${annee}${mois}${jour}-${facture.id}`;
  }

  // ===== MÉTHODES PRIVÉES =====

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private mapFacturesResponse(response: any): Facture[] {
    if (Array.isArray(response)) {
      return response.map(f => this.mapFactureData(f));
    }

    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map((f: any) => this.mapFactureData(f));
    }

    if (response && typeof response === 'object') {
      return [this.mapFactureData(response)];
    }

    return [];
  }

  private mapFactureResponse(response: any): Facture {
    if (response && typeof response === 'object') {
      return this.mapFactureData(response);
    }
    throw new Error('Format de réponse invalide');
  }

  private mapFactureData(data: any): Facture {
    // Utilise le mapping du FactureService existant
    return this.factureService.mapFactureData ?
      this.factureService.mapFactureData(data) :
      data as Facture;
  }

  private handleError = (error: any): Observable<never> => {
    console.error('Erreur ValidationTresorerieService:', error);

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
    } else
