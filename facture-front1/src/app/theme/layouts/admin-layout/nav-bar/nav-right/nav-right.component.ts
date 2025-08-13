// Fichier: facture-front1/src/app/theme/layouts/admin-layout/nav-bar/nav-right/nav-right.component.ts

import { Component, inject, input, output, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Project import
import { AuthService, User } from '../../../../../services/auth.service';

// icon
import { IconService, IconDirective } from '@ant-design/icons-angular';
import {
  BellOutline,
  SettingOutline,
  GiftOutline,
  MessageOutline,
  PhoneOutline,
  CheckCircleOutline,
  LogoutOutline,
  EditOutline,
  UserOutline,
  ProfileOutline,
  WalletOutline,
  QuestionCircleOutline,
  LockOutline,
  CommentOutline,
  UnorderedListOutline,
  ArrowRightOutline,
  GithubOutline
} from '@ant-design/icons-angular/icons';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-nav-right',
  imports: [CommonModule, IconDirective, RouterModule, NgScrollbarModule, NgbNavModule, NgbDropdownModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss']
})
export class NavRightComponent implements OnInit, OnDestroy {
  private iconService = inject(IconService);
  private destroy$ = new Subject<void>();

  styleSelectorToggle = input<boolean>();
  Customize = output();
  windowWidth: number;
  screenFull: boolean = true;

  // Propriétés utilisateur
  currentUser: User | null = null;
  isAuthenticated = false;

  constructor(private authService: AuthService) {
    this.windowWidth = window.innerWidth;
    this.iconService.addIcon(
      ...[
        CheckCircleOutline,
        GiftOutline,
        MessageOutline,
        SettingOutline,
        PhoneOutline,
        LogoutOutline,
        UserOutline,
        EditOutline,
        ProfileOutline,
        QuestionCircleOutline,
        LockOutline,
        CommentOutline,
        UnorderedListOutline,
        ArrowRightOutline,
        BellOutline,
        GithubOutline,
        WalletOutline
      ]
    );
  }

  ngOnInit() {
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isAuthenticated = this.authService.isAuthenticated();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Méthode de déconnexion
  logout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
    }
  }

  // Obtenir le nom d'affichage de l'utilisateur
  getUserDisplayName(): string {
    if (!this.currentUser) {
      return 'Utilisateur';
    }
    return this.currentUser.nomComplet || `${this.currentUser.prenom} ${this.currentUser.nom}`.trim() || this.currentUser.email;
  }

  // Obtenir le rôle affiché
  getUserRoleDisplay(): string {
    if (!this.currentUser) {
      return '';
    }

    const roleLabels: { [key: string]: string } = {
      'ADMIN': 'Administrateur',
      'U1': 'Utilisateur de saisie',
      'V1': 'Validateur niveau 1',
      'V2': 'Validateur niveau 2',
      'T1': 'Trésorier'
    };

    return roleLabels[this.currentUser.role] || this.currentUser.role;
  }

  // Actions du profil adaptées au rôle
  getProfileActions() {
    const baseActions = [
      {
        icon: 'user',
        title: 'Voir mon profil',
        action: () => this.navigateToProfile()
      },
      {
        icon: 'edit',
        title: 'Modifier mon profil',
        action: () => this.navigateToEditProfile()
      }
    ];

    if (this.currentUser?.role === 'ADMIN') {
      baseActions.push({
        icon: 'users',
        title: 'Gérer les utilisateurs',
        action: () => this.navigateToUserManagement()
      });
    }

    baseActions.push({
      icon: 'logout',
      title: 'Se déconnecter',
      action: () => this.logout()
    });

    return baseActions;
  }

  // Actions des paramètres adaptées au rôle
  getSettingActions() {
    const baseActions = [
      {
        icon: 'bell',
        title: 'Notifications',
        action: () => this.navigateToNotifications()
      },
      {
        icon: 'lock',
        title: 'Sécurité',
        action: () => this.navigateToSecurity()
      }
    ];

    if (this.currentUser?.role === 'ADMIN') {
      baseActions.push({
        icon: 'setting',
        title: 'Configuration système',
        action: () => this.navigateToSystemSettings()
      });
    }

    baseActions.push({
      icon: 'question-circle',
      title: 'Aide & Support',
      action: () => this.navigateToHelp()
    });

    return baseActions;
  }

  // Méthodes de navigation
  private navigateToProfile(): void {
    // Implémentation de la navigation vers le profil
    console.log('Navigate to profile');
  }

  private navigateToEditProfile(): void {
    // Implémentation de la navigation vers l'édition du profil
    console.log('Navigate to edit profile');
  }

  private navigateToUserManagement(): void {
    // Implémentation de la navigation vers la gestion des utilisateurs
    console.log('Navigate to user management');
  }

  private navigateToNotifications(): void {
    // Implémentation de la navigation vers les notifications
    console.log('Navigate to notifications');
  }

  private navigateToSecurity(): void {
    // Implémentation de la navigation vers la sécurité
    console.log('Navigate to security');
  }

  private navigateToSystemSettings(): void {
    // Implémentation de la navigation vers les paramètres système
    console.log('Navigate to system settings');
  }

  private navigateToHelp(): void {
    // Implémentation de la navigation vers l'aide
    console.log('Navigate to help');
  }

  profile = [
    {
      icon: 'edit',
      title: 'Edit Profile'
    },
    {
      icon: 'user',
      title: 'View Profile'
    },
    {
      icon: 'profile',
      title: 'Social Profile'
    },
    {
      icon: 'wallet',
      title: 'Billing'
    },
    {
      icon: 'logout',
      title: 'Logout'
    }
  ];

  setting = [
    {
      icon: 'question-circle',
      title: 'Support'
    },
    {
      icon: 'user',
      title: 'Account Settings'
    },
    {
      icon: 'lock',
      title: 'Privacy Center'
    },
    {
      icon: 'comment',
      title: 'Feedback'
    },
    {
      icon: 'unordered-list',
      title: 'History'
    }
  ];
}
