// Fichier: facture-front1/src/app/demo/factures/validation-tresorerie/validation-tresorerie.component.ts
// CORRECTIONS pour la validation trésorerie

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { FactureService } from '../services/facture.service';
import { AuthService } from '../../../services/auth.service';

interface FactureTresorerie {
  id: number;
  numero: string;
  nomFournisseur: string;
  montantTTC: number;
  montantHT: number;
  dateFacture: string;
  dateEcheance: string;
  dateValidationV2: string;
  createurNom: string;
  validateur1Nom: string;
  validateur2Nom: string;
  joursAvantEcheance: number;
  urgent: boolean;
  designation: string;
  refCommande: string;
  statut: string;
  pieceJointeNom?: string;
  // Champs pour les factures payées
  datePaiement?: string;
  referencePaiement?: string;
}

interface PaiementDto {
  referencePaiement: string;
  datePaiement: string;
  commentaire: string;
}

@Component({
  selector: 'app-validation-tresorerie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './validation-tresorerie.component.html',
  styleUrls: ['./validation-tresorerie.component.scss']
})
export class ValidationTresorerieComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // État du composant
  facturesEnAttente: FactureTresorerie[] = [];
  facturesTraitees: FactureTresorerie[] = [];
  loading = true;
  activeTab = 'en-attente';
  selectedFacture: FactureTresorerie | null = null;
  showPaiementModal = false;
  showDetailsModal = false;
  processingPaiement = false;

  // Filtres
  filtres = {
    recherche: '',
    montantMin: '',
    montantMax: '',
    dateEcheanceDebut: '',
    dateEcheanceFin: '',
    urgentesOnly: false
  };

  // Formulaire de paiement - CORRIGÉ
  paiementForm: PaiementDto = {
    referencePaiement: '',
    datePaiement: new Date().toISOString().split('T')[0],
    commentaire: ''
  };

  // Statistiques
  statistiques = {
    enAttente: 0,
    urgent: 0,
    montantTotal: 0,
    traitees: 0
  };

  constructor(
    private factureService: FactureService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.chargerFacturesEnAttente();
    this.chargerFacturesTraitees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES - CORRIGÉ =====

  chargerFacturesEnAttente(): void {
    this.loading = true;

    // Utilise l'endpoint: GET /api/factures/en-attente-tresorerie
    this.factureService.getFacturesEnAttenteTresorerie()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Réponse backend factures trésorerie:', response);

          // Vérifier le format de la réponse
          let factures: any[] = [];
          if (Array.isArray(response)) {
            factures = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            factures = response.data;
          } else if (response && typeof response === 'object') {
            // Si c'est un objet unique, le mettre dans un tableau
            factures = [response];
          }

          this.facturesEnAttente = factures.map(f => this.mapToFactureTresorerie(f));
          this.calculerStatistiques();
          this.loading = false;

          console.log(`✅ ${this.facturesEnAttente.length} factures en attente chargées`);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des factures en attente:', error);
          this.loading = false;

          // En cas d'erreur, charger des données de test
          this.loadTestData();

          // Afficher un message d'erreur à l'utilisateur
          alert('Erreur lors du chargement des factures. Données de test affichées.');
        }
      });
  }

  chargerFacturesTraitees(): void {
    // Récupérer les factures payées
    this.factureService.getFacturesParStatut('PAYEE')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('✅ Réponse factures payées:', response);

          let factures: any[] = [];
          if (Array.isArray(response)) {
            factures = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            factures = response.data;
          }

          // Prendre les 20 dernières factures payées
          this.facturesTraitees = factures
            .slice(0, 20)
            .map(f => this.mapToFactureTresorerie(f));

          this.calculerStatistiques();
          console.log(`✅ ${this.facturesTraitees.length} factures traitées chargées`);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des factures traitées:', error);
          this.facturesTraitees = [];
        }
      });
  }

  // ===== MAPPING DES DONNÉES - AMÉLIORÉ =====

  private mapToFactureTresorerie(facture: any): FactureTresorerie {
    console.log('🔄 Mapping facture:', facture);

    return {
      id: facture.id || 0,
      numero: facture.numero || '',
      nomFournisseur: facture.nomFournisseur || '',
      montantTTC: this.parseNumber(facture.montantTTC),
      montantHT: this.parseNumber(facture.montantHT),
      dateFacture: facture.dateFacture || '',
      dateEcheance: facture.dateEcheance || '',
      dateValidationV2: facture.dateValidationV2 || '',
      createurNom: facture.createurNom || this.extractUserName(facture.createur),
      validateur1Nom: facture.validateur1Nom || this.extractUserName(facture.validateur1),
      validateur2Nom: facture.validateur2Nom || this.extractUserName(facture.validateur2),
      joursAvantEcheance: this.calculateJoursAvantEcheance(facture.dateEcheance),
      urgent: facture.urgent || this.isUrgent(facture.dateEcheance),
      designation: facture.designation || '',
      refCommande: facture.refCommande || '',
      statut: facture.statut || '',
      pieceJointeNom: facture.pieceJointeNom,
      // Champs pour factures payées
      datePaiement: facture.datePaiement,
      referencePaiement: facture.referencePaiement
    };
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private extractUserName(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    if (user.nomComplet) return user.nomComplet;
    if (user.nom && user.prenom) return `${user.prenom} ${user.nom}`;
    if (user.nom) return user.nom;
    return '';
  }

  private calculateJoursAvantEcheance(dateEcheance: string): number {
    if (!dateEcheance) return 0;

    try {
      const echeance = new Date(dateEcheance);
      const aujourd_hui = new Date();
      const diffTime = echeance.getTime() - aujourd_hui.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      console.warn('⚠️ Erreur parsing date échéance:', dateEcheance);
      return 0;
    }
  }

  private isUrgent(dateEcheance: string): boolean {
    const jours = this.calculateJoursAvantEcheance(dateEcheance);
    return jours <= 5 && jours >= 0;
  }

  // ===== TRAITEMENT DU PAIEMENT - CORRIGÉ =====

  traiterPaiement(): void {
    if (!this.selectedFacture || this.processingPaiement) {
      return;
    }

    // Validation avec la nouvelle méthode
    const validation = this.validatePaiementForm();
    if (!validation.valid) {
      this.showValidationErrors();
      return;
    }

    this.processingPaiement = true;
    console.log('💰 Traitement paiement:', this.paiementForm);

    // Préparer les données pour l'API
    const paiementData = {
      referencePaiement: this.paiementForm.referencePaiement.trim(),
      datePaiement: this.paiementForm.datePaiement || new Date().toISOString().split('T')[0],
      commentaire: this.paiementForm.commentaire || ''
    };

    // Appel de l'endpoint: POST /api/factures/{id}/payer
    this.factureService.traiterParTresorier(this.selectedFacture.id, paiementData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Paiement traité avec succès:', response);

          // Retirer la facture de la liste en attente
          this.facturesEnAttente = this.facturesEnAttente.filter(f => f.id !== this.selectedFacture!.id);

          // Ajouter aux factures traitées
          const factureTraitee: FactureTresorerie = {
            ...this.selectedFacture!,
            datePaiement: paiementData.datePaiement,
            referencePaiement: paiementData.referencePaiement,
            statut: 'PAYEE'
          };
          this.facturesTraitees.unshift(factureTraitee);

          this.calculerStatistiques();
          this.resetPaiementModal();

          // Notification de succès
          alert('Paiement traité avec succès !');
        },
        error: (error) => {
          console.error('❌ Erreur lors du traitement du paiement:', error);

          let message = 'Erreur lors du traitement du paiement';
          if (error?.error?.message) {
            message = error.error.message;
          } else if (error?.message) {
            message = error.message;
          }

          alert(message);
          this.processingPaiement = false;
        }
      });}

  // ===== GESTION DES MODALES - AMÉLIORÉE =====

  ouvrirModalPaiement(facture: FactureTresorerie): void {
    this.selectedFacture = facture;
    this.paiementForm = {
      referencePaiement: this.genererReferencePaiement(facture),
      datePaiement: new Date().toISOString().split('T')[0],
      commentaire: ''
    };
    this.showPaiementModal = true;
    console.log('💳 Modal paiement ouverte pour facture:', facture.numero);
  }

  ouvrirModalDetails(facture: FactureTresorerie): void {
    this.selectedFacture = facture;
    this.showDetailsModal = true;
    console.log('👁️ Modal détails ouverte pour facture:', facture.numero);
  }

  resetPaiementModal(): void {
    this.showPaiementModal = false;
    this.selectedFacture = null;
    this.processingPaiement = false;
    this.paiementForm = {
      referencePaiement: '',
      datePaiement: new Date().toISOString().split('T')[0],
      commentaire: ''
    };
  }

  fermerModalDetails(): void {
    this.showDetailsModal = false;
    this.selectedFacture = null;
  }

  // ===== GÉNÉRATION RÉFÉRENCE DE PAIEMENT =====

  private genererReferencePaiement(facture: FactureTresorerie): string {
    const now = new Date();
    const annee = now.getFullYear();
    const mois = String(now.getMonth() + 1).padStart(2, '0');
    const jour = String(now.getDate()).padStart(2, '0');
    return `PAY${annee}${mois}${jour}-${facture.id}`;
  }

  // ===== STATISTIQUES =====

  private calculerStatistiques(): void {
    this.statistiques = {
      enAttente: this.facturesEnAttente.length,
      urgent: this.facturesEnAttente.filter(f => f.urgent || f.joursAvantEcheance <= 5).length,
      montantTotal: this.facturesEnAttente.reduce((sum, f) => sum + f.montantTTC, 0),
      traitees: this.facturesTraitees.length
    };
  }

  // ===== FILTRAGE =====

  get facturesFiltrees(): FactureTresorerie[] {
    return this.facturesEnAttente.filter(facture => {
      const rechercheMatch = !this.filtres.recherche ||
        facture.numero.toLowerCase().includes(this.filtres.recherche.toLowerCase()) ||
        facture.nomFournisseur.toLowerCase().includes(this.filtres.recherche.toLowerCase());

      const montantMatch = (!this.filtres.montantMin || facture.montantTTC >= parseFloat(this.filtres.montantMin)) &&
        (!this.filtres.montantMax || facture.montantTTC <= parseFloat(this.filtres.montantMax));

      const urgenceMatch = !this.filtres.urgentesOnly || facture.urgent || facture.joursAvantEcheance <= 5;

      const dateEcheanceMatch = (!this.filtres.dateEcheanceDebut || facture.dateEcheance >= this.filtres.dateEcheanceDebut) &&
        (!this.filtres.dateEcheanceFin || facture.dateEcheance <= this.filtres.dateEcheanceFin);

      return rechercheMatch && montantMatch && urgenceMatch && dateEcheanceMatch;
    });
  }

  resetFiltres(): void {
    this.filtres = {
      recherche: '',
      montantMin: '',
      montantMax: '',
      dateEcheanceDebut: '',
      dateEcheanceFin: '',
      urgentesOnly: false
    };
  }

  // ===== MÉTHODES UTILITAIRES =====

  getStatutBadgeClass(urgent: boolean, joursAvantEcheance: number): string {
    if (urgent || joursAvantEcheance <= 5) {
      return 'badge-urgent';
    } else if (joursAvantEcheance <= 15) {
      return 'badge-attention';
    }
    return 'badge-normal';
  }

  getStatutBadgeText(urgent: boolean, joursAvantEcheance: number): string {
    if (urgent || joursAvantEcheance <= 5) {
      return 'Urgent';
    } else if (joursAvantEcheance <= 15) {
      return 'Attention';
    }
    return 'Normal';
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant || 0);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (e) {
      return dateString;
    }
  }

  formatDateHeure(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('fr-FR');
    } catch (e) {
      return dateString;
    }
  }

  trackByFactureId(index: number, facture: FactureTresorerie): number {
    return facture.id;
  }

  // ===== DONNÉES DE TEST (fallback) =====

  private loadTestData(): void {
    console.log('⚠️ Chargement des données de test pour la trésorerie');

    this.facturesEnAttente = [
      {
        id: 1,
        numero: 'FACT2024301',
        nomFournisseur: 'HOLCIM MAROC',
        montantTTC: 24500.00,
        montantHT: 20416.67,
        dateFacture: '2024-01-15',
        dateEcheance: '2024-02-14',
        dateValidationV2: '2024-01-25T14:30:00',
        createurNom: 'Jean Dupont',
        validateur1Nom: 'Sophie Leroy',
        validateur2Nom: 'Pierre Bernard',
        joursAvantEcheance: 10,
        urgent: false,
        designation: 'Ciment et matériaux de construction',
        refCommande: 'CMD2024-301',
        statut: 'EN_TRESORERIE'
      },
      {
        id: 2,
        numero: 'FACT2024302',
        nomFournisseur: 'MANAGEM',
        montantTTC: 54000.00,
        montantHT: 45000.00,
        dateFacture: '2024-01-10',
        dateEcheance: '2024-01-25',
        dateValidationV2: '2024-01-20T09:15:00',
        createurNom: 'Marie Martin',
        validateur1Nom: 'Sophie Leroy',
        validateur2Nom: 'Claire Petit',
        joursAvantEcheance: 3,
        urgent: true,
        designation: 'Services miniers - Expertise géologique',
        refCommande: 'CMD2024-302',
        statut: 'EN_TRESORERIE'
      }
    ];

    this.facturesTraitees = [
      {
        id: 4,
        numero: 'FACT2024304',
        nomFournisseur: 'TOTAL MAROC',
        montantTTC: 12600.00,
        montantHT: 10500.00,
        dateFacture: '2024-01-05',
        dateEcheance: '2024-01-20',
        dateValidationV2: '2024-01-15T10:00:00',
        createurNom: 'Ahmed Benali',
        validateur1Nom: 'Sophie Leroy',
        validateur2Nom: 'Claire Petit',
        joursAvantEcheance: 0,
        urgent: false,
        designation: 'Carburant véhicules service',
        refCommande: 'CMD2024-304',
        statut: 'PAYEE',
        datePaiement: '2024-01-20',
        referencePaiement: 'PAY20240120-304'
      }
    ];

    this.calculerStatistiques();
    this.loading = false;
  }

  // ===== ACTIONS ADDITIONNELLES =====

  exporterFactures(): void {
    console.log('📊 Export des factures en attente');
    // TODO: Implémenter l'export
    alert('Fonctionnalité d\'export à implémenter');
  }

  voirPieceJointe(facture: FactureTresorerie): void {
    if (facture.pieceJointeNom) {
      console.log('📎 Ouverture de la pièce jointe:', facture.pieceJointeNom);
      // TODO: Implémenter l'ouverture de pièce jointe
      alert('Ouverture de pièce jointe: ' + facture.pieceJointeNom);
    }
  }
  /**
   * Vérifie si le formulaire de paiement est valide
   */
  isFormValid(): boolean {
    return !!(
      this.paiementForm.referencePaiement &&
      this.paiementForm.referencePaiement.trim().length > 0
    );
  }
  /**
   * Validation avancée du formulaire (optionnelle)
   */
  validatePaiementForm(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Référence de paiement obligatoire
    if (!this.paiementForm.referencePaiement || !this.paiementForm.referencePaiement.trim()) {
      errors.push('La référence de paiement est obligatoire');
    }

    // Longueur maximale de la référence
    if (this.paiementForm.referencePaiement && this.paiementForm.referencePaiement.length > 200) {
      errors.push('La référence de paiement ne peut pas dépasser 200 caractères');
    }

    // Longueur maximale du commentaire
    if (this.paiementForm.commentaire && this.paiementForm.commentaire.length > 500) {
      errors.push('Le commentaire ne peut pas dépasser 500 caractères');
    }

    // Validation de la date
    if (this.paiementForm.datePaiement) {
      try {
        const date = new Date(this.paiementForm.datePaiement);
        if (isNaN(date.getTime())) {
          errors.push('Format de date invalide');
        }

        // La date ne peut pas être dans le futur (plus de 1 jour)
        const demain = new Date();
        demain.setDate(demain.getDate() + 1);
        if (date > demain) {
          errors.push('La date de paiement ne peut pas être dans le futur');
        }
      } catch (e) {
        errors.push('Format de date invalide');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Affiche les erreurs de validation (optionnel)
   */
  showValidationErrors(): void {
    const validation = this.validatePaiementForm();
    if (!validation.valid) {
      const message = 'Erreurs de validation:\n' + validation.errors.join('\n');
      alert(message);
    }
  }
}
