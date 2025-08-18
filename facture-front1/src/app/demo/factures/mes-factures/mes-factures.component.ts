// Fichier: facture-front1/src/app/demo/factures/mes-factures/mes-factures.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Import des composants partagés
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Import des services
import { AuthService, User } from '../../../services/auth.service';
import { FactureApiService, FactureDto, PaginationParams } from '../services/facture-api.service';

export enum StatutFacture {
  BROUILLON = 'BROUILLON',
  EN_VALIDATION_V1 = 'EN_VALIDATION_V1',
  EN_VALIDATION_V2 = 'EN_VALIDATION_V2',
  EN_TRESORERIE = 'EN_TRESORERIE',
  VALIDEE = 'VALIDEE',
  REJETEE = 'REJETEE',
  PAYEE = 'PAYEE',
  ANNULEE = 'ANNULEE'
}

@Component({
  selector: 'app-mes-factures',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardComponent],
  templateUrl: './mes-factures.component.html',
  styleUrl: './mes-factures.component.scss'
})
export class MesFacturesComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // État du composant
  isLoading = false;
  currentUser: User | null = null;
  errorMessage = '';

  // Données des factures
  factures: FactureDto[] = [];
  filteredFactures: FactureDto[] = [];

  // Filtres
  selectedStatut = 'ALL';
  selectedPeriod = 'ALL';
  searchTerm = '';
  showOnlyUrgent = false;
  showOnlyMyFactures = true;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;

  // Tri
  sortField = 'dateCreation';
  sortDirection: 'ASC' | 'DESC' = 'DESC';

  // Statistiques
  stats = {
    total: 0,
    brouillon: 0,
    enValidation: 0,
    validees: 0,
    rejetees: 0,
    payees: 0,
    urgent: 0,
    montantTotal: 0
  };

  // Énumérations pour les templates
  StatutFacture = StatutFacture;

  constructor(
    private authService: AuthService,
    private factureApiService: FactureApiService
  ) {}

  ngOnInit() {
    // Récupérer l'utilisateur actuel
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadFactures();
          this.loadStatistiques();
        }
      });

    // S'abonner aux changements de factures en temps réel
    this.factureApiService.factures$
      .pipe(takeUntil(this.destroy$))
      .subscribe(factures => {
        this.factures = factures;
        this.applyFilters();
        this.calculateLocalStats();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  loadFactures() {
    this.isLoading = true;
    this.errorMessage = '';

    const params: PaginationParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortField,
      sortOrder: this.sortDirection
    };

    // Ajouter les filtres
    if (this.selectedStatut !== 'ALL') {
      params.statut = this.selectedStatut;
    }

    if (this.searchTerm.trim()) {
      params.search = this.searchTerm.trim();
    }

    this.factureApiService.getMesFactures(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.factures = response.data;
            this.totalItems = response.total;
            this.calculatePagination();
            this.applyFilters();
            this.calculateLocalStats();
          } else {
            this.errorMessage = response.message || 'Erreur lors du chargement des factures';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des factures:', error);
          this.errorMessage = 'Impossible de charger les factures. Vérifiez votre connexion.';
          this.isLoading = false;
        }
      });
  }

  loadStatistiques() {
    this.factureApiService.getStatistiques()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = {
            ...this.stats,
            ...stats
          };
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
          // Utiliser les statistiques locales en fallback
        }
      });
  }

  // ===== FILTRAGE ET RECHERCHE =====

  applyFilters() {
    let filtered = [...this.factures];

    // Filtre par statut (déjà appliqué côté serveur, mais on garde pour le fallback)
    if (this.selectedStatut !== 'ALL') {
      filtered = filtered.filter(f => f.statut === this.selectedStatut);
    }

    // Filtre par période
    if (this.selectedPeriod !== 'ALL') {
      const now = new Date();
      const filterDate = new Date();

      switch (this.selectedPeriod) {
        case 'TODAY':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(f => new Date(f.dateCreation) >= filterDate);
          break;
        case 'WEEK':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(f => new Date(f.dateCreation) >= filterDate);
          break;
        case 'MONTH':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(f => new Date(f.dateCreation) >= filterDate);
          break;
      }
    }

    // Filtre urgent
    if (this.showOnlyUrgent) {
      filtered = filtered.filter(f => f.priority === 'URGENT' || f.priority === 'CRITIQUE');
    }

    // Filtre mes factures
    if (this.showOnlyMyFactures && this.currentUser) {
      filtered = filtered.filter(f => f.createurId === this.currentUser?.id);
    }

    // Recherche textuelle (déjà appliquée côté serveur pour les gros datasets)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.numero.toLowerCase().includes(term) ||
        f.nomFournisseur.toLowerCase().includes(term) ||
        f.designation?.toLowerCase().includes(term) ||
        f.refCommande?.toLowerCase().includes(term)
      );
    }

    this.filteredFactures = filtered;
  }

  // ===== PAGINATION =====

  calculatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  get paginatedFactures(): FactureDto[] {
    // Si on utilise la pagination côté serveur, retourner toutes les factures
    // Sinon, paginer côté client
    if (this.totalItems > this.filteredFactures.length) {
      return this.filteredFactures;
    } else {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredFactures.slice(start, end);
    }
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadFactures(); // Recharger avec la nouvelle page
    }
  }

  // ===== TRI =====

  changeSorting(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortField = field;
      this.sortDirection = 'DESC';
    }
    this.currentPage = 1;
    this.loadFactures(); // Recharger avec le nouveau tri
  }

  // ===== STATISTIQUES =====

  calculateLocalStats() {
    this.stats = {
      total: this.factures.length,
      brouillon: this.factures.filter(f => f.statut === 'BROUILLON').length,
      enValidation: this.factures.filter(f =>
        f.statut === 'EN_VALIDATION_V1' ||
        f.statut === 'EN_VALIDATION_V2' ||
        f.statut === 'EN_TRESORERIE'
      ).length,
      validees: this.factures.filter(f => f.statut === 'VALIDEE').length,
      rejetees: this.factures.filter(f => f.statut === 'REJETEE').length,
      payees: this.factures.filter(f => f.statut === 'PAYEE').length,
      urgent: this.factures.filter(f => f.priority === 'URGENT' || f.priority === 'CRITIQUE').length,
      montantTotal: this.factures.reduce((sum, f) => sum + (f.montantTTC || f.montantHT), 0)
    };
  }

  // ===== ACTIONS =====

  editFacture(facture: FactureDto) {
    // Navigation vers l'édition
    console.log('Éditer facture:', facture.numero);
    // TODO: Implémenter la navigation vers l'édition
  }

  viewFacture(facture: FactureDto) {
    // Navigation vers le détail
    console.log('Voir facture:', facture.numero);
    // TODO: Implémenter la navigation vers le détail
  }

  deleteFacture(facture: FactureDto) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la facture ${facture.numero} ?`)) {
      this.factureApiService.deleteFacture(facture.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Facture supprimée:', facture.numero);
            this.loadFactures(); // Recharger la liste
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression de la facture.');
          }
        });
    }
  }

  duplicateFacture(facture: FactureDto) {
    this.factureApiService.dupliquerFacture(facture.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Facture dupliquée:', response.data.numero);
            this.loadFactures(); // Recharger la liste
          }
        },
        error: (error) => {
          console.error('Erreur lors de la duplication:', error);
          alert('Erreur lors de la duplication de la facture.');
        }
      });
  }

  exportFacture(facture: FactureDto) {
    console.log('Exporter facture:', facture.numero);
    // TODO: Implémenter l'export PDF
    alert(`Export PDF de la facture ${facture.numero} en cours...`);
  }

  sendToValidation(facture: FactureDto) {
    if (facture.statut === 'BROUILLON') {
      this.factureApiService.envoyerEnValidationV1(facture.id, 'Envoi automatique depuis l\'interface')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Facture envoyée en validation:', facture.numero);
            this.loadFactures(); // Recharger la liste
          },
          error: (error) => {
            console.error('Erreur lors de l\'envoi en validation:', error);
            alert('Erreur lors de l\'envoi en validation.');
          }
        });
    }
  }

  // ===== MÉTHODES UTILITAIRES =====

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'BROUILLON': return 'Brouillon';
      case 'EN_VALIDATION_V1': return 'En validation V1';
      case 'EN_VALIDATION_V2': return 'En validation V2';
      case 'EN_TRESORERIE': return 'En trésorerie';
      case 'VALIDEE': return 'Validée';
      case 'REJETEE': return 'Rejetée';
      case 'PAYEE': return 'Payée';
      case 'ANNULEE': return 'Annulée';
      default: return statut;
    }
  }

  getStatutBadgeClass(statut: string): string {
    switch (statut) {
      case 'BROUILLON': return 'badge bg-secondary';
      case 'EN_VALIDATION_V1': return 'badge bg-warning';
      case 'EN_VALIDATION_V2': return 'badge bg-info';
      case 'EN_TRESORERIE': return 'badge bg-primary';
      case 'VALIDEE': return 'badge bg-success';
      case 'REJETEE': return 'badge bg-danger';
      case 'PAYEE': return 'badge bg-success';
      case 'ANNULEE': return 'badge bg-dark';
      default: return 'badge bg-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'CRITIQUE': return 'badge bg-danger';
      case 'URGENT': return 'badge bg-warning';
      case 'NORMAL': return 'badge bg-light text-dark';
      default: return 'badge bg-light text-dark';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'CRITIQUE': return 'Critique';
      case 'URGENT': return 'Urgent';
      case 'NORMAL': return 'Normal';
      default: return priority || 'Normal';
    }
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR');
  }

  formatCurrency(amount: number): string {
    if (!amount) return '0,00 MAD';
    return amount.toLocaleString('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  getFileSizeDisplay(size: number): string {
    if (!size) return '0 B';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  canEdit(facture: FactureDto): boolean {
    return facture.statut === 'BROUILLON' || facture.statut === 'REJETEE';
  }

  canDelete(facture: FactureDto): boolean {
    return facture.statut === 'BROUILLON';
  }

  canSendToValidation(facture: FactureDto): boolean {
    return facture.statut === 'BROUILLON';
  }

  // ===== ÉVÉNEMENTS =====

  onSearchChange() {
    this.currentPage = 1;
    // Débounce la recherche pour éviter trop d'appels API
    setTimeout(() => {
      this.loadFactures();
    }, 500);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadFactures();
  }

  refreshData() {
    this.loadFactures();
    this.loadStatistiques();
  }

  // ===== INITIALISATION DES DONNÉES DE TEST =====

  initializeTestData() {
    if (confirm('Voulez-vous initialiser des factures de test dans la base de données ?')) {
      this.factureApiService.initializeTestFactures()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              alert('Factures de test créées avec succès !');
              this.loadFactures();
            } else {
              alert('Erreur lors de la création des factures de test.');
            }
          },
          error: (error) => {
            console.error('Erreur lors de l\'initialisation:', error);
            alert('Erreur lors de la création des factures de test.');
          }
        });
    }
  }

  // ===== GESTION DES ERREURS =====

  clearError() {
    this.errorMessage = '';
  }

  retryLoad() {
    this.clearError();
    this.loadFactures();
  }

  // ===== TRACK BY FUNCTIONS =====

  trackByFactureId(index: number, facture: FactureDto): number {
    return facture.id;
  }

  // ===== PAGINATION HELPER =====

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // ===== MÉTHODES DE CONVERSION =====

  /**
   * Convertir FactureDto en Facture pour la compatibilité avec l'ancien code
   */
  private convertToFacture(dto: FactureDto): any {
    return {
      ...dto,
      montantTVA: dto.montantTVA || (dto.montantHT * (dto.tauxTVA || 0)) / 100,
      montantTTC: dto.montantTTC || dto.montantHT + ((dto.montantHT * (dto.tauxTVA || 0)) / 100),
      priority: dto.priority || 'NORMAL',
      createur: {
        id: dto.createurId,
        nomComplet: this.currentUser?.nomComplet || 'Utilisateur',
        email: this.currentUser?.email || ''
      },
      pieceJointe: dto.pieceJointeNom ? {
        nom: dto.pieceJointeNom,
        taille: dto.pieceJointeTaille || 0,
        type: dto.pieceJointeType || 'application/pdf'
      } : undefined,
      historique: [] // À implémenter si nécessaire
    };
  }
}
