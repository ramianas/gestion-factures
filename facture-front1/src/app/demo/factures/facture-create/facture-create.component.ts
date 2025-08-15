// Fichier: src/app/demo/factures/facture-create/facture-create.component.ts

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Propriété Math pour les templates
  Math = Math;

  // État du composant
  isSubmitting = false;
  isLoading = false;
  hasError = false;
  errorMessage = '';
  isDragOver = false;

  // Fichier sélectionné
  selectedFile: File | null = null;

  // Données de référence
  validateursV1: User[] = [];
  validateursV2: User[] = [];
  tresoriers: User[] = [];

  // Modèle de facture
  facture: FactureCreateDto = {
    nomFournisseur: '',
    formeJuridique: undefined,
    dateFacture: new Date().toISOString().split('T')[0],
    dateReception: '',
    dateLivraison: '',
    montantHT: 0,
    tauxTVA: 20,
    rasTVA: 0,
    modalite: undefined,
    refacturable: false,
    designation: '',
    refCommande: '',
    periode: '',
    validateur1Id: 0,
    validateur2Id: 0,
    tresorierIdId: 0,
    etrangerLocal: '',
    commentaires: '',
    pieceJointe: undefined
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

      if (!this.factureService) {
        console.warn('⚠️ FactureService non disponible, utilisation des données par défaut');
        this.mockDonneesReference();
        return;
      }

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
          this.mockDonneesReference();
        }
      });

    } catch (error) {
      console.error('❌ Erreur critique lors du chargement:', error);
      this.hasError = true;
      this.errorMessage = 'Erreur critique lors du chargement des données.';
      this.isLoading = false;
      this.mockDonneesReference();
    }
  }

  private mockDonneesReference() {
    console.log('🔄 Utilisation de données de test...');

    this.validateursV1 = [
      {
        id: 1,
        nomComplet: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        nom: 'Dupont',
        prenom: 'Jean',
        role: 'V1',
        actif: true
      },
      {
        id: 2,
        nomComplet: 'Marie Martin',
        email: 'marie.martin@example.com',
        nom: 'Martin',
        prenom: 'Marie',
        role: 'V1',
        actif: true
      },
      {
        id: 3,
        nomComplet: 'Paul Durand',
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
        nomComplet: 'Sophie Leroy',
        email: 'sophie.leroy@example.com',
        nom: 'Leroy',
        prenom: 'Sophie',
        role: 'V2',
        actif: true
      },
      {
        id: 5,
        nomComplet: 'Pierre Bernard',
        email: 'pierre.bernard@example.com',
        nom: 'Bernard',
        prenom: 'Pierre',
        role: 'V2',
        actif: true
      },
      {
        id: 6,
        nomComplet: 'Lisa Moreau',
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

  retryLoadDonnees() {
    console.log('🔄 Nouvelle tentative de chargement...');
    this.hasError = false;
    this.errorMessage = '';
    this.loadDonneesReference();
  }

  // ===== CALCULS AUTOMATIQUES =====

  calculerMontants() {
    console.log('🔄 Recalcul des montants...');

    const montantHT = Number(this.facture.montantHT) || 0;
    const tauxTVA = Number(this.facture.tauxTVA) || 0;
    const rasTVA = Number(this.facture.rasTVA) || 0;

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

  // Méthodes d'affichage des montants
  getMontantHTDisplay(): string {
    return (Number(this.facture.montantHT) || 0).toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    });
  }

  getMontantTVADisplay(): string {
    return this.getMontantTVA().toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    });
  }

  getMontantTTCDisplay(): string {
    return this.getMontantTTC().toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    });
  }

  getRasTVADisplay(): string {
    return (Number(this.facture.rasTVA) || 0).toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    });
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

    if (jours < 0) return 'alert-danger';
    if (jours <= 7) return 'alert-warning';
    return 'alert-success';
  }

  calculerEcheance() {
    // Méthode appelée lors du changement de date ou modalité
    console.log('📅 Recalcul de l\'échéance...');
  }

  onModaliteChange() {
    console.log('📅 Modalité changée:', this.facture.modalite);
    this.calculerEcheance();
  }

  // ===== GESTION DES FICHIERS =====

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      this.showError('Le fichier est trop volumineux. Taille maximum : 10 MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      this.showError('Format de fichier non supporté. Utilisez: PDF, JPG, PNG, DOC, DOCX');
      return;
    }

    this.selectedFile = file;
    this.facture.pieceJointe = file;
    console.log('📎 Fichier sélectionné:', file.name, this.getFileSizeDisplay(file.size));
  }

  removeFile() {
    this.selectedFile = null;
    this.facture.pieceJointe = undefined;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    console.log('🗑️ Fichier supprimé');
  }

  getFileSizeDisplay(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  // ===== GESTION DES UTILISATEURS =====

  // Méthodes pour filtrer les utilisateurs par rôle exact
  getValidateursV1Only(): User[] {
    return this.validateursV1.filter(user => user.role === 'V1' && user.actif);
  }

  getValidateursV2Only(): User[] {
    return this.validateursV2.filter(user => user.role === 'V2' && user.actif);
  }

  getTresoriersOnly(): User[] {
    return this.tresoriers.filter(user => user.role === 'T1' && user.actif);
  }

  getSelectedValidateur1(): User | undefined {
    return this.getValidateursV1Only().find(v => v.id === Number(this.facture.validateur1Id));
  }

  getSelectedValidateur2(): User | undefined {
    return this.getValidateursV2Only().find(v => v.id === Number(this.facture.validateur2Id));
  }

  getSelectedTresorier(): User | undefined {
    if (!this.facture.tresorierIdId) return undefined;
    return this.getTresoriersOnly().find(t => t.id === Number(this.facture.tresorierIdId));
  }

  // ===== GESTION DES COMMENTAIRES =====

  getCommentairesLength(): number {
    return this.facture.commentaires?.length || 0;
  }

  updateCommentairesCount() {
    // Méthode appelée lors de la saisie des commentaires
  }

  // ===== VALIDATION =====

  private isFormValid(): boolean {
    const errors: string[] = [];

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

    if (this.facture.tauxTVA && (this.facture.tauxTVA < 0 || this.facture.tauxTVA > 100)) {
      errors.push('Le taux de TVA doit être entre 0 et 100%');
    }

    if (this.facture.rasTVA && this.facture.rasTVA < 0) {
      errors.push('La RAS TVA ne peut pas être négative');
    }

    if (this.facture.validateur1Id === this.facture.validateur2Id && this.facture.validateur1Id !== 0) {
      errors.push('Les validateurs V1 et V2 doivent être différents');
    }

    if (this.facture.nomFournisseur && this.facture.nomFournisseur.length > 200) {
      errors.push('Le nom du fournisseur ne peut pas dépasser 200 caractères');
    }

    if (this.facture.designation && this.facture.designation.length > 500) {
      errors.push('La désignation ne peut pas dépasser 500 caractères');
    }

    if (this.facture.commentaires && this.facture.commentaires.length > 1000) {
      errors.push('Les commentaires ne peuvent pas dépasser 1000 caractères');
    }

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

    if (!this.isFormValid()) {
      console.warn('⚠️ Formulaire invalide');
      return;
    }

    this.isSubmitting = true;

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

    this.factureService.createFacture(factureData).subscribe({
      next: (response) => {
        console.log('✅ Facture créée avec succès:', response);
        this.isSubmitting = false;

        this.showSuccess(`Facture créée avec succès !\nNuméro: ${response.numero || 'N/A'}`);

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

  private hasUnsavedChanges(): boolean {
    return !!(
      this.facture.nomFournisseur ||
      this.facture.montantHT > 0 ||
      this.facture.designation ||
      this.facture.commentaires ||
      this.facture.validateur1Id > 0 ||
      this.facture.validateur2Id > 0 ||
      this.selectedFile
    );
  }

  // ===== MÉTHODES D'AFFICHAGE =====

  private showSuccess(message: string) {
    alert('✅ ' + message);
  }

  private showError(message: string) {
    alert('❌ ' + message);
  }

  private showInfo(message: string) {
    alert('ℹ️ ' + message);
  }

  // ===== MÉTHODES DE DEBUG =====

  logCurrentState() {
    console.log('🔍 État actuel du composant:', {
      isLoading: this.isLoading,
      hasError: this.hasError,
      errorMessage: this.errorMessage,
      facture: this.facture,
      selectedFile: this.selectedFile,
      validateursV1Count: this.validateursV1.length,
      validateursV2Count: this.validateursV2.length,
      tresorierCount: this.tresoriers.length,
      montantTVA: this.getMontantTVA(),
      montantTTC: this.getMontantTTC(),
      dateEcheance: this.getDateEcheance(),
      joursRestants: this.getJoursRestants()
    });
  }
}
