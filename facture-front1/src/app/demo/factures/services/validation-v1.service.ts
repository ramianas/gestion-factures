// Fichier: facture-front1/src/app/demo/factures/services/validation-v1.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { Facture, FactureService } from './facture.service';

export interface ValidationV1Stats {
  enAttente: number;
  validees: number;
  rejetees: number;
  urgent: number;
}

export interface ValidationAction {
  factureId: number;
  approuve: boolean;
  commentaire: string;
  niveauValidation: 'V1';
}

@Injectable({
  providedIn: 'root'
})
export class ValidationV1Service {

  private apiUrl = `${environment.apiUrl}/api/factures`;

  // Subject pour les notifications en temps réel
  private facturesEnAttenteSubject = new BehaviorSubject<Facture[]>([]);
  public facturesEnAttente$ = this.facturesEnAttenteSubject.asObservable();

  // Cache pour les statistiques
  private statsCache: ValidationV1Stats | null = null;
  private statsCacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private factureService: FactureService
  ) {}

  // ===== RÉCUPÉRATION DES FACTURES EN ATTENTE =====

  /**
   * Récupère les factures en attente de validation V1 pour l'utilisateur connecté
   */
  getFacturesEnAttenteV1(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/en-attente-v1`, {
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
   * Récupère une facture spécifique en attente de validation V1
   */
  getFactureEnAttenteById(id: number): Observable<Facture> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFactureResponse(response)),
      catchError(this.handleError)
    );
  }

  // ===== ACTIONS DE VALIDATION =====

  /**
   * Valide ou rejette une facture au niveau V1
   */
  validerFactureV1(action: ValidationAction): Observable<any> {
    const validationData = {
      approuve: action.approuve,
      commentaire: action.commentaire,
      niveauValidation: action.niveauValidation
    };

    return this.http.post<any>(`${this.apiUrl}/${action.factureId}/valider-v1`, validationData, {
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
        throw new Error(response.message || 'Erreur lors de la validation');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Approuve une facture V1
   */
  approuverFacture(factureId: number, commentaire: string): Observable<any> {
    return this.validerFactureV1({
      factureId,
      approuve: true,
      commentaire,
      niveauValidation: 'V1'
    });
  }

  /**
   * Rejette une facture V1
   */
  rejeterFacture(factureId: number, motif: string): Observable<any> {
    return this.validerFactureV1({
      factureId,
      approuve: false,
      commentaire: motif,
      niveauValidation: 'V1'
    });
  }

  // ===== STATISTIQUES =====

  /**
   * Récupère les statistiques de validation V1
   */
  getStatistiquesV1(): Observable<ValidationV1Stats> {
    // Vérifier le cache
    const now = Date.now();
    if (this.statsCache && (now - this.statsCacheTimestamp) < this.CACHE_DURATION) {
      return new BehaviorSubject(this.statsCache).asObservable();
    }

    return this.http.get<any>(`${this.apiUrl}/statistiques-v1`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        const stats: ValidationV1Stats = {
          enAttente: response.enAttente || 0,
          validees: response.validees || 0,
          rejetees: response.rejetees || 0,
          urgent: response.urgent || 0
        };

        // Mettre en cache
        this.statsCache = stats;
        this.statsCacheTimestamp = now;

        return stats;
      }),
      catchError(error => {
        console.warn('Impossible de récupérer les statistiques, utilisation des valeurs par défaut');
        return new BehaviorSubject<ValidationV1Stats>({
          enAttente: 0,
          validees: 0,
          rejetees: 0,
          urgent: 0
        }).asObservable();
      })
    );
  }

  // ===== FACTURES URGENTES =====

  /**
   * Récupère uniquement les factures urgentes
   */
  getFacturesUrgentesV1(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/urgentes-v1`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  // ===== HISTORIQUE =====

  /**
   * Récupère l'historique des validations V1 de l'utilisateur
   */
  getHistoriqueValidationsV1(limit: number = 10): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/historique-validations-v1?limit=${limit}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Rafraîchit la liste des factures en attente
   */
  refreshFacturesEnAttente(): void {
    this.getFacturesEnAttenteV1().subscribe();
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

    return diffDays <= 7 && diffDays >= 0;
  }

  /**
   * Vérifie si une facture est en retard
   */
  isFactureEnRetard(facture: Facture): boolean {
    if (!facture.dateEcheance) return false;

    const now = new Date();
    const echeance = new Date(facture.dateEcheance);

    return now > echeance;
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
    return {
      id: data.id,
      numero: data.numero || '',
      nomFournisseur: data.nomFournisseur || '',
      formeJuridique: data.formeJuridique,
      dateFacture: data.dateFacture,
      dateReception: data.dateReception,
      dateEcheance: data.dateEcheance,
      dateLivraison: data.dateLivraison,
      montantHT: data.montantHT || 0,
      tauxTVA: data.tauxTVA || 0,
      montantTVA: data.montantTVA || 0,
      montantTTC: data.montantTTC || 0,
      rasTVA: data.rasTVA || 0,
      modalite: data.modalite,
      refacturable: data.refacturable || false,
      designation: data.designation || '',
      refCommande: data.refCommande || '',
      periode: data.periode || '',
      statut: data.statut || 'SAISIE',
      commentaires: data.commentaires || '',

      // Relations
      createurId: data.createurId || data.createur?.id,
      createurNom: data.createurNom || data.createur?.nomComplet,
      validateur1Id: data.validateur1Id || data.validateur1?.id,
      validateur1Nom: data.validateur1Nom || data.validateur1?.nomComplet,
      validateur2Id: data.validateur2Id || data.validateur2?.id,
      validateur2Nom: data.validateur2Nom || data.validateur2?.nomComplet,
      tresorierIdId: data.tresorierIdId || data.tresorier?.id,
      tresorierIdNom: data.tresorierIdNom || data.tresorier?.nomComplet,

      // Dates de traçabilité
      dateCreation: data.dateCreation,
      dateModification: data.dateModification,
      dateValidationV1: data.dateValidationV1,
      dateValidationV2: data.dateValidationV2,

      // Paiement
      referencePaiement: data.referencePaiement || '',
      datePaiement: data.datePaiement,

      // Métriques
      joursAvantEcheance: data.joursAvantEcheance,
      estEnRetard: data.estEnRetard || false,
      peutEtreModifiee: data.peutEtreModifiee || false,
      peutEtreValideeParV1: data.peutEtreValideeParV1 || false,
      peutEtreValideeParV2: data.peutEtreValideeParV2 || false,
      peutEtreTraiteeParTresorier: data.peutEtreTraiteeParTresorier || false
    };
  }

  private handleError = (error: any): Observable<never> => {
    console.error('Erreur ValidationV1Service:', error);

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
