// Fichier: src/app/demo/factures/facture-create/facture-create.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Import des composants partagés
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Import des modèles et services
import {
  FactureCreateDto,
  User,
  FormeJuridiqueType,
  ModaliteType
} from '../models/facture.model';
import { FactureService } from '../services/facture.service';

@Component({
  selector: 'app-facture-create',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './facture-create.component.html',
  styleUrl: './facture-create.component.scss'
})
export class FactureCreateComponent implements OnInit {

  // État du composant
  isSubmitting = false;
  isLoading = true;

  // Données de référence
  validateursV1: User[] = [];
  validateursV2: User[] = [];
  tresoriers: User[] = [];

  // Modèle de facture
  facture: FactureCreateDto = {
    nomFournisseur: '',
    dateFacture: new Date().toISOString().split('T')[0], // Date du jour par défaut
    montantHT: 0,
    tauxTVA: 20, // TVA par défaut à 20%
    refacturable: false,
    validateur1Id: 0,
    validateur2Id: 0
  };

  constructor(
    private router: Router,
    private factureService: FactureService
  ) {}

  ngOnInit() {
    this.loadDonneesReference();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  async loadDonneesReference() {
    try {
      this.isLoading = true;

      this.factureService.getDonneesReference().subscribe({
        next: (donnees) => {
          this.validateursV1 = donnees.validateursV1;
          this.validateursV2 = donnees.validateursV2;
          this.tresoriers = donnees.tresoriers;
          this.isLoading = false;
          console.log('✅ Données de référence chargées');
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données de référence:', error);
          this.isLoading = false;
          // TODO: Afficher un message d'erreur à l'utilisateur
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données de référence:', error);
      this.isLoading = false;
    }
  }

  // ===== CALCULS AUTOMATIQUES =====

  calculerMontants() {
    // Recalcul automatique lors de la saisie
    console.log('🔄 Recalcul des montants...');
  }

  getMontantTVA(): number {
    if (!this.facture.montantHT || !this.facture.tauxTVA) return 0;
    return (this.facture.montantHT * this.facture.tauxTVA) / 100;
  }

  getMontantTTC(): number {
    const montantTVA = this.getMontantTVA();
    const rasTVA = this.facture.rasTVA || 0;
    return this.facture.montantHT + montantTVA - rasTVA;
  }

  getDateEcheance(): Date | null {
    if (!this.facture.dateFacture || !this.facture.modalite) return null;

    const dateFacture = new Date(this.facture.dateFacture);
    const delais = {
      'DELAI_30': 30,
      'DELAI_60': 60,
      'DELAI_90': 90,
      'DELAI_120': 120
    };

    const delai = delais[this.facture.modalite as keyof typeof delais];
    if (!delai) return null;

    const dateEcheance = new Date(dateFacture);
    dateEcheance.setDate(dateEcheance.getDate() + delai);
    return dateEcheance;
  }

  getJoursRestants(): number | null {
    const dateEcheance = this.getDateEcheance();
    if (!dateEcheance) return null;

    const aujourd = new Date();
    const diffTime = dateEcheance.getTime() - aujourd.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getJoursRestantsClass(): string {
    const jours = this.getJoursRestants();
    if (jours === null) return '';

    if (jours < 0) return 'text-danger'; // En retard
    if (jours <= 7) return 'text-warning'; // Urgent
    return 'text-success'; // Normal
  }

  // ===== ÉVÉNEMENTS DU FORMULAIRE =====

  onModaliteChange() {
    console.log('📅 Modalité changée:', this.facture.modalite);
    // La date d'échéance sera recalculée automatiquement via getDateEcheance()
  }

  // ===== ACTIONS DU FORMULAIRE =====

  onSubmit() {
    if (this.isSubmitting) return;

    console.log('📤 Soumission du formulaire...');

    // Validation basique
    if (!this.isFormValid()) {
      console.warn('⚠️ Formulaire invalide');
      return;
    }

    this.isSubmitting = true;

    // Préparer les données pour l'envoi
    const factureData: FactureCreateDto = {
      ...this.facture,
      montantHT: Number(this.facture.montantHT),
      tauxTVA: this.facture.tauxTVA ? Number(this.facture.tauxTVA) : undefined,
      rasTVA: this.facture.rasTVA ? Number(this.facture.rasTVA) : undefined,
      validateur1Id: Number(this.facture.validateur1Id),
      validateur2Id: Number(this.facture.validateur2Id),
      tresorierIdId: this.facture.tresorierIdId ? Number(this.facture.tresorierIdId) : undefined
    };

    console.log('📦 Données à envoyer:', factureData);

    // Appel au service
    this.factureService.createFacture(factureData).subscribe({
      next: (response) => {
        console.log('✅ Facture créée avec succès:', response);
        this.isSubmitting = false;

        // TODO: Afficher un message de succès
        alert(`✅ Facture créée avec succès !\nNuméro: ${response.numero}`);

        // Redirection vers la liste des factures ou le dashboard
        this.router.navigate(['/dashboard/default']);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création de la facture:', error);
        this.isSubmitting = false;

        // TODO: Afficher un message d'erreur approprié
        alert('❌ Erreur lors de la création de la facture. Veuillez réessayer.');
      }
    });
  }

  onSaveDraft() {
    console.log('💾 Sauvegarde brouillon...');
    // TODO: Implémenter la sauvegarde en brouillon
    alert('💾 Fonction sauvegarde brouillon à implémenter');
  }

  onCancel() {
    console.log('❌ Annulation...');
    if (confirm('Êtes-vous sûr de vouloir annuler ? Les modifications seront perdues.')) {
      this.router.navigate(['/dashboard/default']);
    }
  }

  // ===== VALIDATION =====

  private isFormValid(): boolean {
    // Validation des champs obligatoires
    if (!this.facture.nomFournisseur?.trim()) {
      console.warn('❌ Nom fournisseur manquant');
      return false;
    }

    if (!this.facture.dateFacture) {
      console.warn('❌ Date facture manquante');
      return false;
    }

    if (!this.facture.montantHT || this.facture.montantHT <= 0) {
      console.warn('❌ Montant HT invalide');
      return false;
    }

    if (!this.facture.validateur1Id || this.facture.validateur1Id === 0) {
      console.warn('❌ Validateur V1 manquant');
      return false;
    }

    if (!this.facture.validateur2Id || this.facture.validateur2Id === 0) {
      console.warn('❌ Validateur V2 manquant');
      return false;
    }

    return true;
  }

  // ===== MÉTHODES UTILITAIRES =====

  getSelectedValidateur1(): User | undefined {
    return this.validateursV1.find(v => v.id === Number(this.facture.validateur1Id));
  }

  getSelectedValidateur2(): User | undefined {
    return this.validateursV2.find(v => v.id === Number(this.facture.validateur2Id));
  }

  getSelectedTresorier(): User | undefined {
    if (!this.facture.tresorierIdId) return undefined;
    return this.tresoriers.find(t => t.id === Number(this.facture.tresorierIdId));
  }
}
