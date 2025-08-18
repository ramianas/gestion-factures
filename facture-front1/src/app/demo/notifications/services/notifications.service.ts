// Fichier: facture-front1/src/app/demo/notifications/services/notifications.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';

import { Notification } from '../notifications.component';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  private apiUrl = 'http://localhost:8088/api/notifications';

  // Subject pour les notifications en temps réel
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  // Subject pour le compteur de notifications non lues
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===== MÉTHODES PRINCIPALES =====

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des notifications:', error);
          // En cas d'erreur, retourner les données de simulation
          return this.simulateGetNotifications();
        })
      );
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${notificationId}/read`, {})
      .pipe(
        catchError(error => {
          console.error('Erreur lors du marquage comme lu:', error);
          return of({ success: true });
        })
      );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-all-read`, {})
      .pipe(
        catchError(error => {
          console.error('Erreur lors du marquage de toutes les notifications:', error);
          return of({ success: true });
        })
      );
  }

  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${notificationId}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la suppression:', error);
          return of({ success: true });
        })
      );
  }

  // ===== MÉTHODES POUR LES PRÉFÉRENCES =====

  getNotificationSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/settings`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des paramètres:', error);
          return of(this.getDefaultSettings());
        })
      );
  }

  updateNotificationSettings(settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/settings`, settings)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la mise à jour des paramètres:', error);
          return of({ success: true });
        })
      );
  }

  // ===== MÉTHODES DE SIMULATION =====

  private simulateGetNotifications(): Observable<Notification[]> {
    const notifications: Notification[] = [
      {
        id: 1,
        type: 'SUCCESS',
        title: 'Facture créée avec succès',
        message: 'Votre facture FAC-2025-0001 a été créée et envoyée pour validation V1.',
        dateCreation: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2 heures
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
        dateCreation: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // Il y a 4 heures
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
        dateCreation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
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
        dateCreation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 1 jour
        isRead: true,
        priority: 'MEDIUM',
        icon: 'fas fa-thumbs-up',
        iconColor: 'text-success',
        actionUrl: '/factures/FAC-2025-0003',
        metadata: { factureId: 'FAC-2025-0003', statut: 'EN_VALIDATION_V2' }
      },
      {
        id: 5,
        type: 'ERROR',
        title: 'Facture urgente en attente',
        message: 'La facture FAC-2025-0004 marquée comme urgente attend votre attention depuis 2 jours.',
        dateCreation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 2 jours
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
        dateCreation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 2 jours
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
        dateCreation: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 3 jours
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
        dateCreation: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 3 jours
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
        dateCreation: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 3 jours
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
        dateCreation: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 4 jours
        isRead: false,
        priority: 'MEDIUM',
        icon: 'fas fa-clock',
        iconColor: 'text-warning',
        actionUrl: '/factures/FAC-2025-0007',
        metadata: { factureId: 'FAC-2025-0007', statut: 'EN_VALIDATION_V2', echeance: '2025-01-21' }
      }
    ];

    // Trier par date (plus récent en premier)
    const sortedNotifications = notifications.sort((a, b) =>
      new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    );

    return of(sortedNotifications).pipe(delay(500));
  }

  private getDefaultSettings(): any {
    return {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationTypes: {
        factureCreated: true,
        factureValidated: true,
        factureRejected: true,
        factureUrgent: true,
        factureEcheance: true,
        systemUpdate: false
      },
      frequency: 'IMMEDIATE' // IMMEDIATE, DAILY, WEEKLY
    };
  }

  // ===== MÉTHODES UTILITAIRES =====

  updateNotificationsSubject(notifications: Notification[]) {
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount(notifications);
  }

  private updateUnreadCount(notifications: Notification[]) {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Méthode pour créer une nouvelle notification (pour les tests)
  createNotification(notification: Omit<Notification, 'id' | 'dateCreation'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      dateCreation: new Date().toISOString()
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    this.updateNotificationsSubject(updatedNotifications);

    return newNotification;
  }

  // Méthode pour simuler l'arrivée de nouvelles notifications en temps réel
  simulateRealTimeNotifications() {
    setInterval(() => {
      const randomNotifications = [
        {
          type: 'INFO' as const,
          title: 'Nouveau message',
          message: 'Vous avez reçu un nouveau message concernant une facture.',
          isRead: false,
          priority: 'LOW' as const,
          icon: 'fas fa-envelope',
          iconColor: 'text-info'
        },
        {
          type: 'SUCCESS' as const,
          title: 'Validation automatique',
          message: 'Une facture a été automatiquement validée grâce aux nouvelles règles.',
          isRead: false,
          priority: 'MEDIUM' as const,
          icon: 'fas fa-robot',
          iconColor: 'text-success'
        }
      ];

      // Créer aléatoirement une notification (probabilité de 10%)
      if (Math.random() < 0.1) {
        const randomNotification = randomNotifications[Math.floor(Math.random() * randomNotifications.length)];
        this.createNotification(randomNotification);
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }
}
