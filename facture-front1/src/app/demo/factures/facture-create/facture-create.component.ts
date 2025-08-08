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

  // Propriété Math pour les templates
  Math = Math;

  // État du composant
  isSubmitting = false;
  isLoading = false; // ✅ CHANGEMENT: Démarrer à false
  hasError = false;  // ✅ AJOUT: Pour gérer les erreurs
  errorMessage = ''; // ✅ AJOUT: Message d'erreur

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
    console.log('🚀 Composant facture-create initialisé');
    this.initializeForm();
    this.loadDonneesReference();
  }

  // ===== INITIALISATION =====

  private initializeForm() {
    console.log('🔧 Initialisation du formulaire...');

    // Définir la date du jour
    this.facture.dateFacture = new Date().toISOString().split('T')[0];

    // Initialiser les valeurs par défaut
    if (!this.facture.tauxTVA) {
      this.facture.tauxTVA = 20;
    }

    if (!this.facture.refacturable) {
      this.facture.refacturable = false;
    }

    console.log('✅ Formulaire initialisé avec:', this.facture);
  }

  // ===== CHARGEMENT DES DONNÉES =====

  async loadDonneesReference() {
    try {
      this.isLoading = true;
      this.hasError = false;
      console.log('📡 Tentative de chargement des données de référence...');

      // ✅ AJOUT: Vérification si le service existe
      if (!this.factureService) {
        console.warn('⚠️ FactureService non disponible, utilisation des données par défaut');
        this.mockDonneesReference();
        return;
      }

      // ✅ AJOUT: Vérification si la méthode existe
      if (typeof this.factureService.getDonneesReference !== 'function') {
        console.warn('⚠️ Méthode getDonneesReference non disponible, utilisation des données par défaut');
        this.mockDonneesReference();
        return;
      }

      this.factureService.getDonneesReference().subscribe({
        next: (donnees) => {
          console.log('📦 Données reçues:', donnees);

          this.validateursV1 = donnees?.validateursV1 || [];
          this.validateursV2 = donnees?.validateursV2 || [];
          this.tresoriers = donnees?.tresoriers || [];

          this.isLoading = false;

          console.log('✅ Données de référence chargées:', {
            v1Count: this.validateursV1.length,
            v2Count: this.validateursV2.length,
            tresorierCount: this.tresoriers.length
          });

          // Si aucune donnée n'est reçue, utiliser les données par défaut
          if (this.validateursV1.length === 0 && this.validateursV2.length === 0) {
            console.log('📝 Aucune donnée reçue, utilisation des données par défaut');
            this.mockDonneesReference();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données:', error);
          this.hasError = true;
          this.errorMessage = 'Impossible de charger les données. Utilisation des données par défaut.';
          this.isLoading = false;

          // ✅ UTILISER DES DONNÉES PAR DÉFAUT EN CAS D'ERREUR
          this.mockDonneesReference();
        }
      });

    } catch (error) {
      console.error('❌ Erreur critique lors du chargement:', error);
      this.hasError = true;
      this.errorMessage = 'Erreur critique lors du chargement des données.';
      this.isLoading = false;

      // ✅ UTILISER DES DONNÉES PAR DÉFAUT EN CAS D'ERREUR
      this.mockDonneesReference();
    }
  }

  // ✅ AJOUT: Méthode pour utiliser des données de test
  private mockDonneesReference() {
    console.log('🔄 Utilisation de données de test...');

    this.validateursV1 = [
      {
        id: 1,
        nomComplet: 'Jean Dupont (V1)',
        email: 'jean.dupont@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'V1',
        actif: true
      },
      {
        id: 2,
        nomComplet: 'Marie Martin (V1)',
        email: 'marie.martin@example.com',
        nom: 'Martin',
        prenom: 'Marie',
        role: 'V1',
        actif: true
      },
      {
        id: 3,
        nomComplet: 'Paul Durand (V1)',
        email: 'paul.durand@example.com',
        nom: 'Durand',
        prenom: 'Paul',
        role: 'V1',
        actif: true
      }
    ];

    this.validateursV2 = [
      {
        id: 4,
        nomComplet: 'Sophie Leroy (V2)',
        email: 'sophie.leroy@example.com',
        nom: 'Leroy',
        prenom: 'Sophie',
        role: 'V2',
        actif: true
      },
      {
        id: 5,
        nomComplet: 'Pierre Bernard (V2)',
        email: 'pierre.bernard@example.com',
        nom: 'Bernard',
        prenom: 'Pierre',
        role: 'V2',
        actif: true
      },
      {
        id: 6,
        nomComplet: 'Lisa Moreau (V2)',
        email: 'lisa.moreau@example.com',
        nom: 'Moreau',
        prenom: 'Lisa',
        role: 'V2',
        actif: true
      }
    ];

    this.tresoriers = [
      {
        id: 7,
        nomComplet: 'Paul Trésorier',
        email: 'paul.tresorier@example.com',
        nom: 'Trésorier',
        prenom: 'Paul',
        role: 'T1',
        actif: true
      },
      {
        id: 8,
        nomComplet: 'Lisa Comptable',
        email: 'lisa.comptable@example.com',
        nom: 'Comptable',
        prenom: 'Lisa',
        role: 'T1',
        actif: true
      },
      {
        id: 9,
        nomComplet: 'Marc Finance',
        email: 'marc.finance@example.com',
        nom: 'Finance',
        prenom: 'Marc',
        role: 'T1',
        actif: true
      }
    ];

    this.isLoading = false;
    this.hasError = false;

    console.log('✅ Données de test chargées avec succès');
  }

  // ✅ AJOUT: Méthode pour réessayer le chargement
  retryLoadDonnees() {
    console.log('🔄 Nouvelle tentative de chargement...');
    this.hasError = false;
    this.errorMessage = '';
    this.loadDonneesReference();
  }

  // ===== CALCULS AUTOMATIQUES =====

  calculerMontants() {
    // Recalcul automatique lors de la saisie
    console.log('🔄 Recalcul des montants...');

    // Convertir en nombres pour éviter les erreurs
    const montantHT = Number(this.facture.montantHT) || 0;
    const tauxTVA = Number(this.facture.tauxTVA) || 0;
    const rasTVA = Number(this.facture.rasTVA) || 0;

    // Mettre à jour les valeurs dans le modèle
    this.facture.montantHT = montantHT;
    this.facture.tauxTVA = tauxTVA;
    this.facture.rasTVA = rasTVA;

    console.log('💰 Montants calculés:', {
      ht: montantHT,
      tva: this.getMontantTVA(),
      ttc: this.getMontantTTC()
    });
  }

  getMontantTVA(): number {
    if (!this.facture.montantHT || !this.facture.tauxTVA) return 0;
    const montantHT = Number(this.facture.montantHT);
    const tauxTVA = Number(this.facture.tauxTVA);
    return (montantHT * tauxTVA) / 100;
  }

  getMontantTTC(): number {
    const montantHT = Number(this.facture.montantHT) || 0;
    const montantTVA = this.getMontantTVA();
    const rasTVA = Number(this.facture.rasTVA) || 0;
    return montantHT + montantTVA - rasTVA;
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

  // ===== VALIDATION =====

  private isFormValid(): boolean {
    const errors: string[] = [];

    // Validation des champs obligatoires
    if (!this.facture.nomFournisseur?.trim()) {
      errors.push('Le nom du fournisseur est obligatoire');
    }

    if (!this.facture.dateFacture) {
      errors.push('La date de facture est obligatoire');
    }

    if (!this.facture.montantHT || this.facture.montantHT <= 0) {
      errors.push('Le montant HT doit être positif');
    }

    if (!this.facture.validateur1Id || this.facture.validateur1Id === 0) {
      errors.push('Un validateur V1 doit être sélectionné');
    }

    if (!this.facture.validateur2Id || this.facture.validateur2Id === 0) {
      errors.push('Un validateur V2 doit être sélectionné');
    }

    // Validation des montants
    if (this.facture.tauxTVA && (this.facture.tauxTVA < 0 || this.facture.tauxTVA > 100)) {
      errors.push('Le taux de TVA doit être entre 0 et 100%');
    }

    if (this.facture.rasTVA && this.facture.rasTVA < 0) {
      errors.push('La RAS TVA ne peut pas être négative');
    }

    // Validation des validateurs (ne peuvent pas être identiques)
    if (this.facture.validateur1Id === this.facture.validateur2Id && this.facture.validateur1Id !== 0) {
      errors.push('Les validateurs V1 et V2 doivent être différents');
    }

    // Validation des longueurs
    if (this.facture.nomFournisseur && this.facture.nomFournisseur.length > 200) {
      errors.push('Le nom du fournisseur ne peut pas dépasser 200 caractères');
    }

    if (this.facture.designation && this.facture.designation.length > 500) {
      errors.push('La désignation ne peut pas dépasser 500 caractères');
    }

    if (this.facture.commentaires && this.facture.commentaires.length > 1000) {
      errors.push('Les commentaires ne peuvent pas dépasser 1000 caractères');
    }

    // Afficher les erreurs
    if (errors.length > 0) {
      console.warn('❌ Erreurs de validation:', errors);
      this.showError('Veuillez corriger les erreurs suivantes :\n• ' + errors.join('\n• '));
      return false;
    }

    return true;
  }

  // ===== ACTIONS DU FORMULAIRE =====

  onSubmit() {
    if (this.isSubmitting) return;

    console.log('📤 Tentative de soumission du formulaire...');

    // Validation du formulaire
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

    // ✅ SIMULATION DE CRÉATION EN CAS DE SERVICE INDISPONIBLE
    if (!this.factureService || !this.factureService.createFacture) {
      console.log('⚠️ Service indisponible, simulation de création...');

      setTimeout(() => {
        this.isSubmitting = false;
        this.showSuccess(`Facture créée avec succès (simulation) !\nNuméro: FAC-${Date.now()}`);

        setTimeout(() => {
          this.router.navigate(['/dashboard/default']);
        }, 1500);
      }, 1000);

      return;
    }

    // Appel au service réel
    this.factureService.createFacture(factureData).subscribe({
      next: (response) => {
        console.log('✅ Facture créée avec succès:', response);
        this.isSubmitting = false;

        this.showSuccess(`Facture créée avec succès !\nNuméro: ${response.numero || 'N/A'}`);

        // Redirection après un court délai
        setTimeout(() => {
          this.router.navigate(['/dashboard/default']);
        }, 1500);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création de la facture:', error);
        this.isSubmitting = false;

        let errorMessage = 'Erreur lors de la création de la facture. Veuillez réessayer.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }

        this.showError(errorMessage);
      }
    });
  }

  onSaveDraft() {
    console.log('💾 Sauvegarde brouillon...');
    this.showInfo('💾 Fonction sauvegarde brouillon à implémenter');
  }

  onCancel() {
    console.log('❌ Demande d\'annulation...');

    // Vérifier s'il y a des modifications
    const hasChanges = this.hasUnsavedChanges();

    if (hasChanges) {
      if (confirm('Êtes-vous sûr de vouloir annuler ? Les modifications seront perdues.')) {
        this.router.navigate(['/dashboard/default']);
      }
    } else {
      this.router.navigate(['/dashboard/default']);
    }
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

  private hasUnsavedChanges(): boolean {
    // Vérifier s'il y a des modifications par rapport aux valeurs initiales
    return !!(
      this.facture.nomFournisseur ||
      this.facture.montantHT > 0 ||
      this.facture.designation ||
      this.facture.commentaires ||
      this.facture.validateur1Id > 0 ||
      this.facture.validateur2Id > 0
    );
  }

  // ===== MÉTHODES D'AFFICHAGE =====

  private showSuccess(message: string) {
    // TODO: Remplacer par un système de notification plus élégant
    alert('✅ ' + message);
  }

  private showError(message: string) {
    // TODO: Remplacer par un système de notification plus élégant
    alert('❌ ' + message);
  }

  private showInfo(message: string) {
    // TODO: Remplacer par un système de notification plus élégant
    alert('ℹ️ ' + message);
  }

  // ===== MÉTHODES DE DEBUG =====

  logCurrentState() {
    console.log('🔍 État actuel du composant:', {
      isLoading: this.isLoading,
      hasError: this.hasError,
      errorMessage: this.errorMessage,
      facture: this.facture,
      validateursV1Count: this.validateursV1.length,
      validateursV2Count: this.validateursV2.length,
      tresorierCount: this.tresoriers.length,
      montantTVA: this.getMontantTVA(),
      montantTTC: this.getMontantTTC()
    });
  }
}
