// Fichier: facture-front1/src/app/demo/factures/validation-v2/validation-v2.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Import des composants partagés
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Import des services
import { AuthService, User } from '../../../services/auth.service';
import { FactureService } from '../services/facture.service';

// Interface pour les factures (compatibilité avec votre service existant)
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
  createurId?: number;
  createurNom?: string;
  validateur1Id?: number;
  validateur1Nom?: string;
  validateur2Id?: number;
  validateur2Nom?: string;
  tresorierIdId?: number;
  tresorierIdNom?: string;
  dateCreation?: string;
  dateModification?: string;
  dateValidationV1?: string;
  dateValidationV2?: string;
  referencePaiement?: string;
  datePaiement?: string;
  joursAvantEcheance?: number;
  estEnRetard?: boolean;
  peutEtreModifiee?: boolean;
  peutEtreValideeParV1?: boolean;
  peutEtreValideeParV2?: boolean;
  peutEtreTraiteeParTresorier?: boolean;
}

@Component({
  selector: 'app-validation-v2',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardComponent, RouterModule],
  templateUrl: './validation-v2.component.html',
  styleUrls: ['./validation-v2.component.scss']
})
export class ValidationV2Component implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // État du composant
  isLoading = false;
  isProcessing = false;
  errorMessage = '';
  successMessage = '';
  currentUser: User | null = null;

  // Données
  facturesEnAttente: Facture[] = [];
  factureSelected: Facture | null = null;

  // Formulaire de validation
  validationForm: FormGroup;

  // Modal state
  showValidationModal = false;
  modalType: 'approve' | 'reject' | null = null;

  // Statistiques
  stats = {
    enAttente: 0,
    validees: 0,
    rejetees: 0,
    urgent: 0
  };

  // Expose Math for template
  Math = Math;

  constructor(
    private authService: AuthService,
    private factureService: FactureService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.validationForm = this.fb.group({
      decision: ['', Validators.required],
      commentaire: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    console.log('🚀 Composant validation-v2 initialisé');
    this.currentUser = this.authService.getCurrentUser();

    if (!this.currentUser || this.currentUser.role !== 'V2') {
      console.error('❌ Accès non autorisé - utilisateur non V2');
      this.router.navigate(['/dashboard/default']);
      return;
    }

    this.chargerFacturesEnAttente();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  chargerFacturesEnAttente() {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Utilisation de votre service existant pour V2
    this.factureService.getFacturesEnAttenteV2()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (factures) => {
          console.log('📋 Factures en attente V2 chargées:', factures);
          this.facturesEnAttente = factures;
          this.calculerStatistiques();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des factures:', error);
          this.errorMessage = error.message || 'Erreur lors du chargement des factures';
          this.isLoading = false;

          // Utiliser des données de test si le service n'est pas disponible
          this.utiliserDonneesTest();
        }
      });
  }

  // Méthode de fallback avec des données de test pour V2
  private utiliserDonneesTest() {
    console.log('📝 Utilisation de données de test pour la validation V2');

    this.facturesEnAttente = [
      {
        id: 3,
        numero: 'FACT-2025-003',
        nomFournisseur: 'Consulting Digital Plus',
        montantHT: 12500,
        montantTVA: 2500,
        montantTTC: 15000,
        dateFacture: '2025-01-16',
        dateEcheance: '2025-02-15',
        dateCreation: '2025-01-16T10:30:00.000Z',
        dateValidationV1: '2025-01-18T14:20:00.000Z',
        statut: 'EN_VALIDATION_V2',
        designation: 'Conseil en stratégie digitale et transformation numérique',
        createurNom: 'Marie Martin',
        validateur1Nom: 'Sophie Leroy',
        validateur2Id: this.currentUser?.id,
        validateur2Nom: this.currentUser?.nomComplet
      },
      {
        id: 4,
        numero: 'FACT-2025-004',
        nomFournisseur: 'HOLCIM MAROC',
        montantHT: 25000,
        montantTVA: 5000,
        montantTTC: 30000,
        dateFacture: '2025-01-15',
        dateEcheance: '2025-01-20', // Urgente (quelques jours)
        dateCreation: '2025-01-15T09:15:00.000Z',
        dateValidationV1: '2025-01-17T16:45:00.000Z',
        statut: 'EN_VALIDATION_V2',
        designation: 'Travaux et fournitures - Construction',
        createurNom: 'Pierre Durand',
        validateur1Nom: 'Sophie Leroy',
        validateur2Id: this.currentUser?.id,
        validateur2Nom: this.currentUser?.nomComplet
      }
    ];

    this.calculerStatistiques();
    this.isLoading = false;
  }

  calculerStatistiques() {
    this.stats = {
      enAttente: this.facturesEnAttente.length,
      validees: 0, // À récupérer depuis le backend
      rejetees: 0, // À récupérer depuis le backend
      urgent: this.facturesEnAttente.filter(f => this.isFactureUrgente(f)).length
    };
  }

  // ===== ACTIONS DE VALIDATION =====

  ouvrirModalValidation(facture: Facture, type: 'approve' | 'reject') {
    console.log('📝 Ouverture modal validation V2:', type, facture.numero);
    this.factureSelected = facture;
    this.modalType = type;
    this.showValidationModal = true;

    // Pré-remplir le formulaire selon le type
    this.validationForm.patchValue({
      decision: type === 'approve' ? 'approuve' : 'rejete',
      commentaire: ''
    });
  }

  fermerModal() {
    this.showValidationModal = false;
    this.factureSelected = null;
    this.modalType = null;
    this.validationForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  validerFacture() {
    if (!this.factureSelected || !this.validationForm.valid || this.isProcessing) {
      return;
    }

    const formValue = this.validationForm.value;
    const approuve = formValue.decision === 'approuve';
    const commentaire = formValue.commentaire;

    console.log('✅ Validation V2 facture:', this.factureSelected.numero, approuve ? 'APPROUVEE' : 'REJETEE');

    this.isProcessing = true;
    this.errorMessage = '';

    // Utilisation de votre service existant pour la validation V2
    if (this.currentUser && this.factureSelected.id) {
      this.factureService.validerParV2(this.factureSelected.id, approuve, commentaire)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('✅ Validation V2 réussie:', response);
            this.successMessage = `Facture ${approuve ? 'approuvée pour la trésorerie' : 'rejetée'} avec succès`;
            this.isProcessing = false;

            // Recharger la liste après validation
            setTimeout(() => {
              this.fermerModal();
              this.chargerFacturesEnAttente();
            }, 1500);
          },
          error: (error) => {
            console.error('❌ Erreur lors de la validation V2:', error);
            this.errorMessage = error.message || 'Erreur lors de la validation';
            this.isProcessing = false;

            // Simulation de validation réussie si le service n'est pas disponible
            this.simulerValidationReussie(approuve);
          }
        });
    }
  }

  // Méthode de simulation pour les tests
  private simulerValidationReussie(approuve: boolean) {
    console.log('🔄 Simulation de validation V2 réussie');

    setTimeout(() => {
      this.successMessage = `Facture ${approuve ? 'approuvée pour la trésorerie' : 'rejetée'} avec succès (simulation)`;
      this.isProcessing = false;

      // Retirer la facture de la liste pour simuler le changement de statut
      if (this.factureSelected) {
        this.facturesEnAttente = this.facturesEnAttente.filter(f => f.id !== this.factureSelected!.id);
        this.calculerStatistiques();
      }

      setTimeout(() => {
        this.fermerModal();
      }, 1500);
    }, 1000);
  }

  // ===== ACTIONS DE CONSULTATION =====

  voirDetailsFacture(facture: Facture) {
    console.log('👁️ Voir détails facture:', facture.numero);
    this.router.navigate(['/factures', facture.id]);
  }

  actualiser() {
    console.log('🔄 Actualisation des données V2');
    this.chargerFacturesEnAttente();
  }

  // ===== MÉTHODES UTILITAIRES =====

  isFactureUrgente(facture: Facture): boolean {
    if (!facture.dateEcheance) return false;
    const joursRestants = this.getJoursAvantEcheance(facture);
    return joursRestants <= 7 && joursRestants >= 0;
  }

  isFactureEnRetard(facture: Facture): boolean {
    if (!facture.dateEcheance) return false;
    return this.getJoursAvantEcheance(facture) < 0;
  }

  getJoursAvantEcheance(facture: Facture): number {
    if (!facture.dateEcheance) return 999;
    const today = new Date();
    const echeance = new Date(facture.dateEcheance);
    const diffTime = echeance.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getUrgenceClass(facture: Facture): string {
    if (this.isFactureEnRetard(facture)) return 'text-danger';
    if (this.isFactureUrgente(facture)) return 'text-warning';
    return 'text-muted';
  }

  getUrgenceIcon(facture: Facture): string {
    if (this.isFactureEnRetard(facture)) return 'fas fa-exclamation-triangle';
    if (this.isFactureUrgente(facture)) return 'fas fa-clock';
    return 'fas fa-calendar';
  }

  getUrgenceTexte(facture: Facture): string {
    const jours = this.getJoursAvantEcheance(facture);
    if (jours < 0) return `En retard de ${Math.abs(jours)} jours`;
    if (jours === 0) return 'Échéance aujourd\'hui';
    if (jours <= 7) return `${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}`;
    return `${jours} jours`;
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(montant);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formatDateDiff(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return this.formatDate(dateStr);
  }

  // ===== TRACK BY FUNCTION =====
  trackByFactureId(index: number, facture: Facture): any {
    return facture.id || index;
  }
}
