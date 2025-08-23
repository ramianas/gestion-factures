// Fichier: facture-front1/src/app/demo/factures/services/facture.service.ts

import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';

export interface Facture {
  id?: number;
  numero?: string;
  nomFournisseur: string;
  formeJuridique?: string;
  dateFacture: string;
  dateReception?: string;
  dateEcheance?: string;
  dateLivraison?: string;
  montantHT: number;
  tauxTVA?: number;
  montantTVA?: number;
  montantTTC?: number;
  rasTVA?: number;
  modalite?: string;
  refacturable?: boolean;
  designation?: string;
  refCommande?: string;
  periode?: string;
  statut: string;
  commentaires?: string;

  // Relations
  createurId?: number;
  createurNom?: string;
  validateur1Id?: number;
  validateur1Nom?: string;
  validateur2Id?: number;
  validateur2Nom?: string;
  tresorierIdId?: number;
  tresorierIdNom?: string;

  // Dates de traçabilité
  dateCreation?: string;
  dateModification?: string;
  dateValidationV1?: string;
  dateValidationV2?: string;

  // Paiement
  referencePaiement?: string;
  datePaiement?: string;

  // Métriques
  joursAvantEcheance?: number;
  estEnRetard?: boolean;
  peutEtreModifiee?: boolean;
  peutEtreValideeParV1?: boolean;
  peutEtreValideeParV2?: boolean;
  peutEtreTraiteeParTresorier?: boolean;
}

export interface FactureCreateDto {
  nomFournisseur: string;
  formeJuridique?: string;
  dateFacture: string;
  dateReception?: string;
  dateLivraison?: string;
  montantHT: number;
  tauxTVA?: number;
  rasTVA?: number;
  modalite?: string;
  refacturable?: boolean;
  designation?: string;
  refCommande?: string;
  periode?: string;
  numero?: string;
  validateur1Id: number;
  validateur2Id: number;
  tresorierIdId?: number;
  commentaires?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FactureService {

  private apiUrl = `${environment.apiUrl}/api/factures`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ===== RÉCUPÉRATION DES FACTURES =====

  getToutesLesFactures(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  getMesFacturesCreees(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/mes-factures`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  getFacturesEnAttenteV1(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/en-attente-v1`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  getFacturesEnAttenteV2(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/en-attente-v2`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  /*getFacturesEnAttenteTresorerie(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/en-attente-tresorerie`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }*/

  getMesTaches(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/mes-taches`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  getFactureById(id: number): Observable<Facture> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFactureResponse(response)),
      catchError(this.handleError)
    );
  }

  // ===== CRÉATION ET MODIFICATION =====

  creerFacture(facture: FactureCreateDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, facture, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la création de la facture');
      }),
      catchError(this.handleError)
    );
  }

  // Alias pour maintenir la compatibilité avec l'ancien code
  createFacture(facture: FactureCreateDto): Observable<any> {
    return this.creerFacture(facture);
  }

  modifierFacture(id: number, facture: Partial<FactureCreateDto>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, facture, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la modification de la facture');
      }),
      catchError(this.handleError)
    );
  }

  supprimerFacture(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la suppression de la facture');
      }),
      catchError(this.handleError)
    );
  }

  // ===== WORKFLOW =====

  soumettreValidationV1(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/soumettre-v1`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la soumission');
      }),
      catchError(this.handleError)
    );
  }

  validerParV1(id: number, approuve: boolean, commentaire?: string): Observable<any> {
    const validation = {
      approuve,
      commentaire: commentaire || '',
      niveauValidation: 'V1'
    };

    return this.http.post<any>(`${this.apiUrl}/${id}/valider-v1`, validation, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la validation V1');
      }),
      catchError(this.handleError)
    );
  }

  validerParV2(id: number, approuve: boolean, commentaire?: string): Observable<any> {
    const validation = {
      approuve,
      commentaire: commentaire || '',
      niveauValidation: 'V2'
    };

    return this.http.post<any>(`${this.apiUrl}/${id}/valider-v2`, validation, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de la validation V2');
      }),
      catchError(this.handleError)
    );
  }

  traiterPaiement(id: number, referencePaiement: string, datePaiement?: string, commentaire?: string): Observable<any> {
    const paiement = {
      referencePaiement,
      datePaiement: datePaiement || new Date().toISOString().split('T')[0],
      commentaire: commentaire || ''
    };

    return this.http.post<any>(`${this.apiUrl}/${id}/payer`, paiement, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors du traitement du paiement');
      }),
      catchError(this.handleError)
    );
  }

  // ===== DONNÉES DE RÉFÉRENCE =====

  getDonneesReference(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/donnees-reference`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ===== STATISTIQUES =====

  getTableauBord(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tableau-bord`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getFacturesUrgentes(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/urgentes`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  getFacturesEnRetard(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/en-retard`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
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

  private mapFacturesResponse(response: any): Facture[] {
    // Si c'est déjà un tableau, le retourner tel quel
    if (Array.isArray(response)) {
      return response.map(f => this.mapFactureData(f));
    }

    // Si c'est un objet avec une propriété data
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map((f: any) => this.mapFactureData(f));
    }

    // Si c'est un objet simple, le traiter comme une facture unique
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



  // ===== MÉTHODES D'AIDE POUR LE COMPOSANT =====

  /*trackByFactureId(index: number, facture: Facture): any {
    return facture.id;
  }*/


  // Ajouts à faire dans votre facture.service.ts existant

// ===== MÉTHODES POUR TRÉSORERIE (à ajouter) =====

  /**
   * Récupère les factures en attente de traitement par la trésorerie
   */
  getFacturesEnAttenteTresorerie(): Observable<any[]> {
    console.log('🔍 Récupération des factures en attente trésorerie');

    const url = `${this.apiUrl}/en-attente-tresorerie`;

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Réponse factures trésorerie:', response);

        // Gérer différents formats de réponse
        if (Array.isArray(response)) {
          return response;
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (response && typeof response === 'object') {
          return [response];
        }

        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur récupération factures trésorerie:', error);
        return throwError(() => new Error('Erreur lors de la récupération des factures'));
      })
    );
  }
  /**
   * Traite le paiement d'une facture par le trésorier
   */
  traiterParTresorier(factureId: number, paiementData: any): Observable<any> {
    console.log('💰 Traitement paiement facture:', factureId, paiementData);

    const url = `${this.apiUrl}/${factureId}/payer`;

    return this.http.post<any>(url, paiementData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Réponse traitement paiement:', response);

        if (response && response.success) {
          return response;
        } else if (response) {
          return { success: true, ...response };
        }

        throw new Error('Réponse invalide du serveur');
      }),
      catchError(error => {
        console.error('❌ Erreur traitement paiement:', error);

        let errorMessage = 'Erreur lors du traitement du paiement';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Traite le paiement d'une facture par la trésorerie
   */
  traiterFactureTresorerie(factureId: number, referencePaiement: string, datePaiement?: string, commentaire?: string): Observable<any> {
    const paiementData = {
      referencePaiement,
      datePaiement: datePaiement || new Date().toISOString().split('T')[0],
      commentaire: commentaire || ''
    };

    return this.http.post<any>(`${this.apiUrl}/${factureId}/payer`, paiementData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors du traitement du paiement');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les factures par statut
   */
  getFacturesParStatut(statut: string): Observable<any[]> {
    console.log('🔍 Récupération des factures par statut:', statut);

    // Utilise l'endpoint générique ou spécialisé selon le statut
    let url = `${this.apiUrl}`;

    switch (statut) {
      case 'PAYEE':
        // Peut nécessiter un endpoint spécialisé
        url += `?statut=${statut}`;
        break;
      case 'EN_TRESORERIE':
        url += '/en-attente-tresorerie';
        break;
      default:
        url += `?statut=${statut}`;
    }

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log(`✅ Réponse factures ${statut}:`, response);

        if (Array.isArray(response)) {
          return response;
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }

        return [];
      }),
      catchError(error => {
        console.error(`❌ Erreur récupération factures ${statut}:`, error);
        return of([]); // Retourner un tableau vide en cas d'erreur
      })
    );
  }
  /**
   * Génère une référence de paiement pour une facture
   */
  genererReferencePaiement(factureId: number): Observable<string> {
    console.log('🔢 Génération référence paiement pour facture:', factureId);

    const url = `${this.apiUrl}/${factureId}/generer-reference-paiement`;

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Référence générée:', response);

        if (response && response.referencePaiement) {
          return response.referencePaiement;
        } else if (response && typeof response === 'string') {
          return response;
        }

        // Fallback: générer côté client
        const now = new Date();
        const annee = now.getFullYear();
        const mois = String(now.getMonth() + 1).padStart(2, '0');
        const jour = String(now.getDate()).padStart(2, '0');
        return `PAY${annee}${mois}${jour}-${factureId}`;
      }),
      catchError(error => {
        console.warn('⚠️ Erreur génération référence, fallback côté client:', error);

        // Fallback: générer côté client
        const now = new Date();
        const annee = now.getFullYear();
        const mois = String(now.getMonth() + 1).padStart(2, '0');
        const jour = String(now.getDate()).padStart(2, '0');
        const reference = `PAY${annee}${mois}${jour}-${factureId}`;

        return of(reference);
      })
    );
  }
  /**
   * Vérifie si une facture peut être traitée par le trésorier connecté
   */
  peutEtrePayee(factureId: number): Observable<boolean> {
    console.log('🔍 Vérification si facture peut être payée:', factureId);

    const url = `${this.apiUrl}/${factureId}/peut-etre-payee`;

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Vérification paiement:', response);

        if (response && typeof response.peutEtreTraitee === 'boolean') {
          return response.peutEtreTraitee;
        } else if (response && response.success) {
          return true;
        }

        return false;
      }),
      catchError(error => {
        console.warn('⚠️ Erreur vérification paiement:', error);
        return of(false);
      })
    );
  }

  /**
   * Récupère les statistiques pour le tableau de bord trésorerie
   */
  getStatistiquesTresorerie(): Observable<any> {
    console.log('📊 Récupération des statistiques trésorerie');

    const url = `${this.apiUrl}/statistiques-tresorerie`;

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Statistiques trésorerie:', response);
        return response || {};
      }),
      catchError(error => {
        console.warn('⚠️ Erreur statistiques trésorerie, valeurs par défaut:', error);
        return of({
          enAttente: 0,
          urgent: 0,
          montantTotal: 0,
          traitees: 0,
          moyenneDelaiPaiement: 0
        });
      })
    );
  }

  /**
   * Export des factures en attente de trésorerie
   */
  exporterFacturesTresorerie(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    console.log('📤 Export factures trésorerie format:', format);

    const url = `${this.apiUrl}/export-tresorerie?format=${format}`;

    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('❌ Erreur export factures trésorerie:', error);
        return throwError(() => new Error('Erreur lors de l\'export'));
      })
    );
  }

  /**
   * Récupère l'historique des paiements
   */
  getHistoriquePaiements(limit: number = 50): Observable<any[]> {
    console.log('📚 Récupération historique paiements, limite:', limit);

    const url = `${this.apiUrl}/historique-paiements?limit=${limit}`;

    return this.http.get<any[]>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Historique paiements:', response);
        return Array.isArray(response) ? response : [];
      }),
      catchError(error => {
        console.warn('⚠️ Erreur historique paiements:', error);
        return of([]);
      })
    );
  }
  /**
   * Traite plusieurs factures en lot (paiement groupé)
   */
  traiterPaiementsEnLot(factureIds: number[], referencePaiementBase: string, commentaire?: string): Observable<any> {
    console.log('💰 Traitement paiements en lot:', factureIds.length, 'factures');

    const url = `${this.apiUrl}/payer-lot`;
    const data = {
      factureIds,
      referencePaiementBase,
      datePaiement: new Date().toISOString().split('T')[0],
      commentaire: commentaire || ''
    };

    return this.http.post<any>(url, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Paiements en lot traités:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Erreur paiements en lot:', error);
        return throwError(() => new Error('Erreur lors du traitement en lot'));
      })
    );
  }

  /**
   * Recherche de factures avec filtres avancés pour la trésorerie
   */
  rechercherFacturesTresorerie(filtres: any): Observable<Facture[]> {
    let params = new HttpParams();

    Object.keys(filtres).forEach(key => {
      const value = filtres[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<Facture[]>(`${this.apiUrl}/recherche-tresorerie`, {
      params: params,
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Valide en lot plusieurs factures
   */
  traiterPaiementEnLot(factureIds: number[], referencePaiementBase: string, commentaire?: string): Observable<any> {
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
          return response;
        }
        throw new Error(response.message || 'Erreur lors du traitement en lot');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Génère un rapport de trésorerie
   */
  genererRapportTresorerie(dateDebut: string, dateFin: string): Observable<any> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);

    return this.http.get<any>(`${this.apiUrl}/rapport-tresorerie`, {
      params: params,
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la génération du rapport:', error);
        return of({
          success: false,
          message: 'Erreur lors de la génération du rapport'
        });
      })
    );
  }

  /**
   * Récupère les factures urgentes pour la trésorerie
   */
  getFacturesUrgentesTresorerie(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/urgentes-tresorerie`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => this.mapFacturesResponse(response)),
      catchError(this.handleError)
    );
  }

  /**
   * Marque une facture comme prioritaire
   */
  marquerCommePrioritaire(factureId: number, prioritaire: boolean): Observable<any> {
    console.log('⭐ Marquage priorité facture:', factureId, prioritaire);

    const url = `${this.apiUrl}/${factureId}/priorite`;
    const data = { prioritaire };

    return this.http.patch<any>(url, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Priorité mise à jour:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Erreur mise à jour priorité:', error);
        return throwError(() => new Error('Erreur lors de la mise à jour de la priorité'));
      })
    );
  }
  /**
   * Récupère les détails d'une facture spécifique
   */
  getDetailFacture(factureId: number): Observable<any> {
    console.log('🔍 Récupération détails facture:', factureId);

    const url = `${this.apiUrl}/${factureId}`;

    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Détails facture:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Erreur récupération détails facture:', error);
        return throwError(() => new Error('Erreur lors de la récupération des détails'));
      })
    );
  }

  /**
   * Ajoute un commentaire trésorerie à une facture
   */
  ajouterCommentaireTresorerie(factureId: number, commentaire: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${factureId}/commentaire-tresorerie`,
      { commentaire },
      { headers: this.getAuthHeaders() }
    ).pipe(
      map(response => {
        if (response.success) {
          return response;
        }
        throw new Error(response.message || 'Erreur lors de l\'ajout du commentaire');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les données pour le tableau de bord trésorerie
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
        return of({
          facturesEnAttente: 0,
          facturesUrgentes: 0,
          montantTotalEnAttente: 0,
          facturesPayeesAujourdhui: 0,
          montantPayeAujourdhui: 0,
          moyenneDelaiPaiement: 0,
          evolutionPaiements: [],
          topFournisseurs: []
        });
      })
    );
  }

  /**
   * Télécharge une pièce jointe de facture
   */
  telechargerPieceJointe(factureId: number, nomFichier: string): Observable<Blob> {
    console.log('📎 Téléchargement pièce jointe:', factureId, nomFichier);

    const url = `${this.apiUrl}/${factureId}/piece-jointe/${nomFichier}`;

    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('❌ Erreur téléchargement pièce jointe:', error);
        return throwError(() => new Error('Erreur lors du téléchargement'));
      })
    );
  }


  /**
   * Méthode utilitaire pour le tracking des factures dans les listes
   */
  trackByFactureId(index: number, facture: any): any {
    return facture.id;
  }
  /**
   * Formate un montant en devise
   */
  formatMontant(montant: number, devise: string = 'EUR'): string {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: devise
      }).format(montant || 0);
    } catch (e) {
      return `${montant || 0} ${devise}`;
    }
  }
  /**
   * Formate une date au format français
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Formate une date et heure au format français
   */
  formatDateHeure(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Calcule le nombre de jours avant échéance
   */
  calculerJoursAvantEcheance(dateEcheance: string): number {
    if (!dateEcheance) return 0;

    try {
      const echeance = new Date(dateEcheance);
      const maintenant = new Date();
      const diffTime = echeance.getTime() - maintenant.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      console.warn('⚠️ Erreur calcul jours avant échéance:', dateEcheance);
      return 0;
    }
  }

  /**
   * Détermine si une facture est urgente
   */
  isFactureUrgente(dateEcheance: string, seuilJours: number = 5): boolean {
    const jours = this.calculerJoursAvantEcheance(dateEcheance);
    return jours <= seuilJours && jours >= 0;
  }

  /**
   * Détermine si une facture est en retard
   */
  isFactureEnRetard(dateEcheance: string): boolean {
    const jours = this.calculerJoursAvantEcheance(dateEcheance);
    return jours < 0;
  }

  /**
   * Génère une référence de paiement côté client (fallback)
   */
  genererReferencePaiementLocal(factureId: number): string {
    const now = new Date();
    const annee = now.getFullYear();
    const mois = String(now.getMonth() + 1).padStart(2, '0');
    const jour = String(now.getDate()).padStart(2, '0');
    const heure = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    return `PAY${annee}${mois}${jour}${heure}${minute}-${factureId}`;
  }

  /**
   * Valide les données de paiement
   */
  validerDonneesPaiement(paiementData: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!paiementData.referencePaiement || !paiementData.referencePaiement.trim()) {
      errors.push('La référence de paiement est obligatoire');
    }

    if (paiementData.referencePaiement && paiementData.referencePaiement.length > 200) {
      errors.push('La référence de paiement ne peut pas dépasser 200 caractères');
    }

    if (paiementData.commentaire && paiementData.commentaire.length > 500) {
      errors.push('Le commentaire ne peut pas dépasser 500 caractères');
    }

    if (paiementData.datePaiement) {
      try {
        new Date(paiementData.datePaiement);
      } catch (e) {
        errors.push('Format de date de paiement invalide');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

}
