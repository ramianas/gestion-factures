// Fichier: facture-front1/src/app/demo/factures/mes-factures/mes-factures.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

// Import des composants partagés
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Import des services
import { AuthService, User } from '../../../services/auth.service';
import { FactureService, Facture } from '../services/facture.service';

@Component({
  selector: 'app-mes-factures',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, RouterModule],
  templateUrl: './mes-factures.component.html',
  styleUrls: ['./mes-factures.component.scss']
})
export class MesFacturesComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // État du composant
  isLoading = false;
  errorMessage = '';
  currentUser: User | null = null;

  // Données
  factures: Facture[] = [];
  facturesFiltrees: Facture[] = [];

  // Filtres
  filtreStatut = '';
  filtreRecherche = '';
  filtresAvances = false;

  // Pagination
  pageActuelle = 1;
  elementsParPage = 10;
  totalElements = 0;

  // Expose Math for template
  Math = Math;

  // Statistiques rapides
  stats = {
    total: 0,
    enCours: 0,
    validees: 0,
    payees: 0,
    rejetees: 0
  };

  constructor(
    private authService: AuthService,
    private factureService: FactureService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.chargerFactures();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  chargerFactures() {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Charger les factures selon le rôle
    let serviceCall;

    switch (this.currentUser.role) {
      case 'U1':
        serviceCall = this.factureService.getMesFacturesCreees();
        break;
      case 'V1':
        serviceCall = this.factureService.getFacturesEnAttenteV1();
        break;
      case 'V2':
        serviceCall = this.factureService.getFacturesEnAttenteV2();
        break;
      case 'T1':
        serviceCall = this.factureService.getFacturesEnAttenteTresorerie();
        break;
      case 'ADMIN':
        serviceCall = this.factureService.getToutesLesFactures();
        break;
      default:
        this.errorMessage = 'Rôle non reconnu';
        this.isLoading = false;
        return;
    }

    serviceCall.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (factures) => {
          console.log('Factures chargées:', factures);
          this.factures = factures;
          this.appliquerFiltres();
          this.calculerStatistiques();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des factures:', error);
          this.errorMessage = error.message || 'Erreur lors du chargement des factures';
          this.isLoading = false;
        }
      });
  }

  // ===== FILTRAGE ET RECHERCHE =====

  appliquerFiltres() {
    let facturesFiltrees = [...this.factures];

    // Filtre par statut
    if (this.filtreStatut) {
      facturesFiltrees = facturesFiltrees.filter(f => f.statut === this.filtreStatut);
    }

    // Filtre par recherche textuelle
    if (this.filtreRecherche) {
      const terme = this.filtreRecherche.toLowerCase();
      facturesFiltrees = facturesFiltrees.filter(f =>
        f.numero?.toLowerCase().includes(terme) ||
        f.nomFournisseur?.toLowerCase().includes(terme) ||
        f.designation?.toLowerCase().includes(terme)
      );
    }

    this.facturesFiltrees = facturesFiltrees;
    this.totalElements = facturesFiltrees.length;
    this.pageActuelle = 1; // Reset pagination
  }

  onFiltreChange() {
    this.appliquerFiltres();
  }

  onRechercheChange() {
    this.appliquerFiltres();
  }

  // ===== PAGINATION =====

  get facturesPaginees(): Facture[] {
    const debut = (this.pageActuelle - 1) * this.elementsParPage;
    const fin = debut + this.elementsParPage;
    return this.facturesFiltrees.slice(debut, fin);
  }

  get nombrePages(): number {
    return Math.ceil(this.totalElements / this.elementsParPage);
  }

  changerPage(page: number) {
    if (page >= 1 && page <= this.nombrePages) {
      this.pageActuelle = page;
    }
  }

  // ===== STATISTIQUES =====

  calculerStatistiques() {
    this.stats = {
      total: this.factures.length,
      enCours: this.factures.filter(f =>
        ['SAISIE', 'EN_VALIDATION_V1', 'EN_VALIDATION_V2', 'EN_TRESORERIE'].includes(f.statut)
      ).length,
      validees: this.factures.filter(f => f.statut === 'VALIDEE').length,
      payees: this.factures.filter(f => f.statut === 'PAYEE').length,
      rejetees: this.factures.filter(f => f.statut === 'REJETEE').length
    };
  }

  // ===== ACTIONS =====

  voirDetails(facture: Facture) {
    this.router.navigate(['/factures', facture.id]);
  }

  modifierFacture(facture: Facture) {
    if (this.peutModifier(facture)) {
      this.router.navigate(['/factures/edit', facture.id]);
    }
  }

  supprimerFacture(facture: Facture) {
    if (this.peutSupprimer(facture) && confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      this.factureService.supprimerFacture(facture.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.chargerFactures(); // Recharger la liste
          },
          error: (error) => {
            this.errorMessage = error.message || 'Erreur lors de la suppression';
          }
        });
    }
  }

  soumettreValidation(facture: Facture) {
    if (this.peutSoumettre(facture)) {
      this.factureService.soumettreValidationV1(facture.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.chargerFactures(); // Recharger la liste
          },
          error: (error) => {
            this.errorMessage = error.message || 'Erreur lors de la soumission';
          }
        });
    }
  }

  // ===== PERMISSIONS =====

  peutModifier(facture: Facture): boolean {
    return this.currentUser?.role === 'U1' &&
      facture.statut === 'SAISIE' &&
      facture.createurId === this.currentUser?.id;
  }

  peutSupprimer(facture: Facture): boolean {
    return this.currentUser?.role === 'U1' &&
      facture.statut === 'SAISIE' &&
      facture.createurId === this.currentUser?.id;
  }

  peutSoumettre(facture: Facture): boolean {
    return this.currentUser?.role === 'U1' &&
      facture.statut === 'SAISIE' &&
      facture.createurId === this.currentUser?.id;
  }

  peutValider(facture: Facture): boolean {
    if (this.currentUser?.role === 'V1') {
      return facture.statut === 'EN_VALIDATION_V1' &&
        facture.validateur1Id === this.currentUser?.id;
    }
    if (this.currentUser?.role === 'V2') {
      return facture.statut === 'EN_VALIDATION_V2' &&
        facture.validateur2Id === this.currentUser?.id;
    }
    return false;
  }

  peutTraiter(facture: Facture): boolean {
    return this.currentUser?.role === 'T1' &&
      facture.statut === 'EN_TRESORERIE' &&
      facture.tresorierIdId === this.currentUser?.id;
  }

  // ===== MÉTHODES UTILITAIRES =====

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'SAISIE': 'badge bg-secondary',
      'EN_VALIDATION_V1': 'badge bg-warning',
      'EN_VALIDATION_V2': 'badge bg-info',
      'EN_TRESORERIE': 'badge bg-primary',
      'VALIDEE': 'badge bg-success',
      'PAYEE': 'badge bg-success',
      'REJETEE': 'badge bg-danger'
    };
    return classes[statut] || 'badge bg-light';
  }

  getStatutLibelle(statut: string): string {
    const libelles: { [key: string]: string } = {
      'SAISIE': 'En saisie',
      'EN_VALIDATION_V1': 'Validation V1',
      'EN_VALIDATION_V2': 'Validation V2',
      'EN_TRESORERIE': 'Trésorerie',
      'VALIDEE': 'Validée',
      'PAYEE': 'Payée',
      'REJETEE': 'Rejetée'
    };
    return libelles[statut] || statut;
  }

  getTitreSection(): string {
    switch (this.currentUser?.role) {
      case 'U1':
        return 'Mes Factures Créées';
      case 'V1':
        return 'Factures à Valider (Niveau 1)';
      case 'V2':
        return 'Factures à Valider (Niveau 2)';
      case 'T1':
        return 'Factures à Traiter (Trésorerie)';
      case 'ADMIN':
        return 'Toutes les Factures';
      default:
        return 'Mes Factures';
    }
  }

  getDescriptionSection(): string {
    switch (this.currentUser?.role) {
      case 'U1':
        return 'Factures que vous avez créées et leur statut de traitement';
      case 'V1':
        return 'Factures en attente de votre validation niveau 1';
      case 'V2':
        return 'Factures en attente de votre validation niveau 2';
      case 'T1':
        return 'Factures validées en attente de traitement par la trésorerie';
      case 'ADMIN':
        return 'Vue d\'ensemble de toutes les factures du système';
      default:
        return 'Liste de vos factures';
    }
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(montant);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  actualiser() {
    this.chargerFactures();
  }

  exporterDonnees() {
    const donnees = this.facturesFiltrees.map(f => ({
      numero: f.numero,
      fournisseur: f.nomFournisseur,
      montant: f.montantTTC,
      statut: this.getStatutLibelle(f.statut),
      dateFacture: f.dateFacture,
      dateEcheance: f.dateEcheance
    }));

    const dataStr = JSON.stringify(donnees, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `factures-${this.currentUser?.role}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // ===== TRACK BY FUNCTION =====
  trackByFactureId(index: number, facture: Facture): any {
    return facture.id || index;
  }
}
