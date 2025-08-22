// validation-tresorerie.component.ts
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
  facturesTraitees: any[] = [];
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

  // Formulaire de paiement
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

  // ===== CHARGEMENT DES DONNÉES =====

  chargerFacturesEnAttente(): void {
    this.loading = true;

    // Utilise l'endpoint existant: GET /api/factures/en-attente-tresorerie
    this.factureService.getFacturesEnAttenteTresorerie()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (factures) => {
          this.facturesEnAttente = factures.map(f => this.mapToFactureTresorerie(f));
          this.calculerStatistiques();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des factures en attente:', error);
          this.loading = false;
          // En cas d'erreur, afficher un message ou des données de test
          this.loadTestData();
        }
      });
  }

  chargerFacturesTraitees(): void {
    // Récupérer les factures récemment payées pour l'historique
    this.factureService.getFacturesParStatut('PAYEE')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (factures) => {
          // Prendre les 20 dernières factures payées
          this.facturesTraitees = factures.slice(0, 20);
          this.calculerStatistiques();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des factures traitées:', error);
        }
      });
  }

  private mapToFactureTresorerie(facture: any): FactureTresorerie {
    return {
      id: facture.id,
      numero: facture.numero || '',
      nomFournisseur: facture.nomFournisseur || '',
      montantTTC: facture.montantTTC || 0,
      montantHT: facture.montantHT || 0,
      dateFacture: facture.dateFacture || '',
      dateEcheance: facture.dateEcheance || '',
      dateValidationV2: facture.dateValidationV2 || '',
      createurNom: facture.createurNom || '',
      validateur1Nom: facture.validateur1Nom || '',
      validateur2Nom: facture.validateur2Nom || '',
      joursAvantEcheance: facture.joursAvantEcheance || 0,
      urgent: facture.urgent || facture.joursAvantEcheance <= 5,
      designation: facture.designation || '',
      refCommande: facture.refCommande || '',
      statut: facture.statut || '',
      pieceJointeNom: facture.pieceJointeNom
    };
  }

  private calculerStatistiques(): void {
    this.statistiques = {
      enAttente: this.facturesEnAttente.length,
      urgent: this.facturesEnAttente.filter(f => f.urgent || f.joursAvantEcheance <= 5).length,
      montantTotal: this.facturesEnAttente.reduce((sum, f) => sum + f.montantTTC, 0),
      traitees: this.facturesTraitees.length
    };
  }

  // ===== ACTIONS PRINCIPALES =====

  traiterPaiement(): void {
    if (!this.selectedFacture || this.processingPaiement) {
      return;
    }

    if (!this.paiementForm.referencePaiement.trim()) {
      alert('La référence de paiement est obligatoire');
      return;
    }

    this.processingPaiement = true;

    // Appel de l'endpoint: POST /api/factures/{id}/payer
    this.factureService.traiterParTresorier(
      this.selectedFacture.id,
      this.paiementForm.referencePaiement,
      this.paiementForm.datePaiement,
      this.paiementForm.commentaire
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Paiement traité avec succès:', response);

          // Retirer la facture de la liste en attente
          this.facturesEnAttente = this.facturesEnAttente.filter(f => f.id !== this.selectedFacture!.id);

          // Ajouter aux factures traitées
          const factureTraitee = {
            ...this.selectedFacture,
            datePaiement: this.paiementForm.datePaiement,
            referencePaiement: this.paiementForm.referencePaiement,
            statut: 'PAYEE'
          };
          this.facturesTraitees.unshift(factureTraitee);

          this.calculerStatistiques();
          this.resetPaiementModal();

          // Notification de succès
          alert('Paiement traité avec succès !');
        },
        error: (error) => {
          console.error('Erreur lors du traitement du paiement:', error);
          alert('Erreur lors du traitement du paiement: ' + (error.message || 'Erreur inconnue'));
          this.processingPaiement = false;
        }
      });
  }

  // ===== GESTION DES MODALES =====

  ouvrirModalPaiement(facture: FactureTresorerie): void {
    this.selectedFacture = facture;
    this.paiementForm = {
      referencePaiement: this.genererReferencePaiement(facture),
      datePaiement: new Date().toISOString().split('T')[0],
      commentaire: ''
    };
    this.showPaiementModal = true;
  }

  ouvrirModalDetails(facture: FactureTresorerie): void {
    this.selectedFacture = facture;
    this.showDetailsModal = true;
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

  private genererReferencePaiement(facture: FactureTresorerie): string {
    const annee = new Date().getFullYear();
    const mois = String(new Date().getMonth() + 1).padStart(2, '0');
    const jour = String(new Date().getDate()).padStart(2, '0');
    return `PAY${annee}${mois}${jour}-${facture.id}`;
  }

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
    }).format(montant);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  formatDateHeure(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  // ===== DONNÉES DE TEST (fallback) =====

  private loadTestData(): void {
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
        datePaiement: '2024-01-20',
        referencePaiement: 'PAY20240120-304',
        statut: 'PAYEE'
      }
    ];

    this.calculerStatistiques();
  }

  // ===== ACTIONS ADDITIONNELLES =====

  exporterFactures(): void {
    // Fonctionnalité d'export (CSV, Excel, etc.)
    console.log('Export des factures en attente');
  }

  imprimerFacture(facture: FactureTresorerie): void {
    // Fonctionnalité d'impression
    console.log('Impression de la facture:', facture.numero);
  }

  voirPieceJointe(facture: FactureTresorerie): void {
    if (facture.pieceJointeNom) {
      // Ouvrir la pièce jointe
      console.log('Ouverture de la pièce jointe:', facture.pieceJointeNom);
    }
  }
}
