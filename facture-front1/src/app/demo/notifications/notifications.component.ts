// Fichier: facture-front1/src/app/demo/notifications/notifications.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Import des composants partagés
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

// Import du service d'authentification
import { AuthService, User } from '../../services/auth.service';

export interface Notification {
  id: number;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TASK';
  title: string;
  message: string;
  dateCreation: string;
  isRead: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  icon: string;
  iconColor: string;
  actionUrl?: string;
  metadata?: any;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // État du composant
  isLoading = false;
  currentUser: User | null = null;

  // Données des notifications
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];

  // Filtres
  selectedFilter = 'ALL';
  showOnlyUnread = false;

  // Statistiques
  stats = {
    total: 0,
    unread: 0,
    high: 0,
    urgent: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Récupérer l'utilisateur actuel
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.loadNotifications();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  loadNotifications() {
    this.isLoading = true;

    // Simulation d'un délai de chargement
    setTimeout(() => {
      this.notifications = this.getMockNotifications();
      this.filteredNotifications = [...this.notifications];
      this.calculateStats();
      this.isLoading = false;
    }, 500);
  }

  // ===== DONNÉES STATIQUES =====

  private getMockNotifications(): Notification[] {
    const baseNotifications: Notification[] = [
      {
        id: 1,
        type: 'SUCCESS',
        title: 'Facture créée avec succès',
        message: 'Votre facture FAC-2025-0001 a été créée et envoyée pour validation V1.',
        dateCreation: '2025-01-18T09:30:00Z',
        isRead: false,
        priority: 'MEDIUM',
        icon: 'fas fa-check-circle',
        iconColor: 'text-success',
        actionUrl: '/factures/FAC-2025-0001',
        metadata: { factureId: 'FAC-2025-0001', statut: 'EN_VALIDATION_V1' }
      },
      {
        id: 2,
        type: 'INFO',
        title: 'Rappel de saisie',
        message: 'N\'oubliez pas de saisir vos factures en attente. 3 factures sont en cours de rédaction.',
        dateCreation: '2025-01-18T08:15:00Z',
        isRead: false,
        priority: 'LOW',
        icon: 'fas fa-info-circle',
        iconColor: 'text-info',
        actionUrl: '/factures/create'
      },
      {
        id: 3,
        type: 'WARNING',
        title: 'Facture rejetée par V1',
        message: 'Votre facture FAC-2025-0002 a été rejetée. Motif: Montant incohérent avec le bon de commande.',
        dateCreation: '2025-01-17T16:45:00Z',
        isRead: true,
        priority: 'HIGH',
        icon: 'fas fa-exclamation-triangle',
        iconColor: 'text-warning',
        actionUrl: '/factures/FAC-2025-0002',
        metadata: { factureId: 'FAC-2025-0002', statut: 'REJETEE', motif: 'Montant incohérent' }
      },
      {
        id: 4,
        type: 'SUCCESS',
        title: 'Facture validée V1',
        message: 'Votre facture FAC-2025-0003 a été validée par le validateur niveau 1 et envoyée en validation V2.',
        dateCreation: '2025-01-17T14:20:00Z',
        isRead: true,
        priority: 'MEDIUM',
        icon: 'fas fa-thumbs-up',
        iconColor: 'text-success',
        actionUrl: '/factures/FAC-2025-0003',
        metadata: { factureId: 'FAC-2025-0003', statut: 'EN_VALIDATION_V2' }
      },
      {
        id: 5,
        type: 'WARNING',
        title: 'Facture urgente en attente',
        message: 'La facture FAC-2025-0004 marquée comme urgente attend votre attention depuis 2 jours.',
        dateCreation: '2025-01-16T10:30:00Z',
        isRead: false,
        priority: 'URGENT',
        icon: 'fas fa-fire',
        iconColor: 'text-danger',
        actionUrl: '/factures/FAC-2025-0004',
        metadata: { factureId: 'FAC-2025-0004', statut: 'BROUILLON', urgent: true }
      },
      {
        id: 6,
        type: 'INFO',
        title: 'Nouvelle fonctionnalité',
        message: 'Découvrez la nouvelle fonction d\'export PDF pour vos factures dans la section "Mes Factures".',
        dateCreation: '2025-01-16T09:00:00Z',
        isRead: true,
        priority: 'LOW',
        icon: 'fas fa-star',
        iconColor: 'text-primary',
        actionUrl: '/factures/list'
      },
      {
        id: 7,
        type: 'SUCCESS',
        title: 'Facture payée',
        message: 'La facture FAC-2025-0005 a été marquée comme payée par la trésorerie.',
        dateCreation: '2025-01-15T15:30:00Z',
        isRead: true,
        priority: 'MEDIUM',
        icon: 'fas fa-money-bill-wave',
        iconColor: 'text-success',
        actionUrl: '/factures/FAC-2025-0005',
        metadata: { factureId: 'FAC-2025-0005', statut: 'PAYEE' }
      },
      {
        id: 8,
        type: 'ERROR',
        title: 'Erreur de saisie détectée',
        message: 'Une erreur a été détectée dans la facture FAC-2025-0006. Veuillez vérifier les informations fournisseur.',
        dateCreation: '2025-01-15T11:15:00Z',
        isRead: false,
        priority: 'HIGH',
        icon: 'fas fa-exclamation-circle',
        iconColor: 'text-danger',
        actionUrl: '/factures/FAC-2025-0006',
        metadata: { factureId: 'FAC-2025-0006', statut: 'ERREUR', erreur: 'Informations fournisseur' }
      },
      {
        id: 9,
        type: 'INFO',
        title: 'Rapport mensuel disponible',
        message: 'Le rapport mensuel de vos factures créées en décembre 2024 est maintenant disponible.',
        dateCreation: '2025-01-15T08:00:00Z',
        isRead: true,
        priority: 'LOW',
        icon: 'fas fa-chart-bar',
        iconColor: 'text-info',
        actionUrl: '/rapports/mensuel/2024-12'
      },
      {
        id: 10,
        type: 'WARNING',
        title: 'Échéance proche',
        message: 'La facture FAC-2025-0007 arrive bientôt à échéance (dans 3 jours). Statut actuel: En validation V2.',
        dateCreation: '2025-01-14T16:45:00Z',
        isRead: false,
        priority: 'MEDIUM',
        icon: 'fas fa-clock',
        iconColor: 'text-warning',
        actionUrl: '/factures/FAC-2025-0007',
        metadata: { factureId: 'FAC-2025-0007', statut: 'EN_VALIDATION_V2', echeance: '2025-01-21' }
      }
    ];

    // Trier par date (plus récent en premier)
    return baseNotifications.sort((a, b) =>
      new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    );
  }

  // ===== CALCULS ET STATISTIQUES =====

  calculateStats() {
    this.stats = {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.isRead).length,
      high: this.notifications.filter(n => n.priority === 'HIGH').length,
      urgent: this.notifications.filter(n => n.priority === 'URGENT').length
    };
  }

  // ===== FILTRAGE =====

  applyFilter(filter: string) {
    this.selectedFilter = filter;
    this.filterNotifications();
  }

  toggleUnreadFilter() {
    this.showOnlyUnread = !this.showOnlyUnread;
    this.filterNotifications();
  }

  private filterNotifications() {
    let filtered = [...this.notifications];

    // Filtre par type
    if (this.selectedFilter !== 'ALL') {
      filtered = filtered.filter(n => n.type === this.selectedFilter);
    }

    // Filtre non lues
    if (this.showOnlyUnread) {
      filtered = filtered.filter(n => !n.isRead);
    }

    this.filteredNotifications = filtered;
  }

  // ===== ACTIONS =====

  markAsRead(notification: Notification) {
    notification.isRead = true;
    this.calculateStats();
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.isRead = true);
    this.calculateStats();
    this.filterNotifications();
  }

  deleteNotification(notificationId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.calculateStats();
      this.filterNotifications();
    }
  }

  // ===== UTILITAIRES =====

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('fr-FR');
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'badge bg-danger';
      case 'HIGH': return 'badge bg-warning';
      case 'MEDIUM': return 'badge bg-primary';
      case 'LOW': return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'Urgent';
      case 'HIGH': return 'Élevée';
      case 'MEDIUM': return 'Moyenne';
      case 'LOW': return 'Faible';
      default: return priority;
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'SUCCESS': return 'Succès';
      case 'WARNING': return 'Attention';
      case 'ERROR': return 'Erreur';
      case 'INFO': return 'Information';
      case 'TASK': return 'Tâche';
      default: return type;
    }
  }

  // Navigation vers une URL
  navigateToAction(notification: Notification) {
    if (notification.actionUrl) {
      // Marquer comme lue si ce n'est pas déjà fait
      if (!notification.isRead) {
        this.markAsRead(notification);
      }
      // Ici vous pouvez ajouter la navigation
      console.log('Navigation vers:', notification.actionUrl);
    }
  }

  // Fonction trackBy pour optimiser le rendu de la liste
  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }
}
