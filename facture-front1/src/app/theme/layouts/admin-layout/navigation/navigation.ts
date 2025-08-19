// Fichier: facture-front1/src/app/theme/layouts/admin-layout/navigation/navigation.ts

export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
  roles?: string[]; // ✅ AJOUT: Rôles autorisés pour cette navigation
}

export const NavigationItems: NavigationItem[] = [
  /*{
    id: 'dashboard',
    title: 'Tableau de bord',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Accueil',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard/default',
        icon: 'dashboard',
        breadcrumbs: false,
        roles: ['U1', 'V1', 'V2', 'T1', 'ADMIN'] // Tous les rôles
      }
    ]
  },*/

  // ===== SECTION GESTION FACTURES =====
  {
    id: 'factures',
    title: 'Gestion des Factures',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'facture-create',
        title: 'Nouvelle Facture',
        type: 'item',
        classes: 'nav-item',
        url: '/factures/create',
        icon: 'plus',
        breadcrumbs: false,
        roles: ['U1'] // Seuls les utilisateurs de saisie
      },
      {
        id: 'facture-list',
        title: 'Mes Factures',
        type: 'item',
        classes: 'nav-item',
        url: '/factures/list',
        icon: 'file-text',
        breadcrumbs: false,
        roles: ['U1', 'V1', 'V2', 'T1', 'ADMIN']
      },
      {
        id: 'facture-validation-v1',
        title: 'Validation V1',
        type: 'item',
        classes: 'nav-item',
        url: '/factures/validation-v1',
        icon: 'check',
        breadcrumbs: false,
        roles: ['V1'] // Seuls les validateurs V1
      },
      {
        id: 'facture-validation-v2',
        title: 'Validation V2',
        type: 'item',
        classes: 'nav-item',
        url: '/factures/validation-v2',
        icon: 'check-circle',
        breadcrumbs: false,
        roles: ['V2'] // Seuls les validateurs V2
      },
      {
        id: 'facture-tresorerie',
        title: 'Trésorerie',
        type: 'item',
        classes: 'nav-item',
        url: '/factures/tresorerie',
        icon: 'dollar-sign',
        breadcrumbs: false,
        roles: ['T1'] // Seuls les trésoriers
      }
    ]
  },

  // ===== SECTION NOTIFICATIONS =====
  {
    id: 'notifications',
    title: 'Notifications',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'notifications-list',
        title: 'Mes Notifications',
        type: 'item',
        classes: 'nav-item',
        url: '/notifications',
        icon: 'bell',
        breadcrumbs: false,
        roles: ['U1', 'V1', 'V2', 'T1', 'ADMIN']
      }
    ]
  },

  // ===== SECTION ADMINISTRATION =====
  {
    id: 'administration',
    title: 'Administration',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'admin-users',
        title: 'Utilisateurs',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/users',
        icon: 'users',
        breadcrumbs: false,
        roles: ['ADMIN'] // Seuls les admins
      },
      {
        id: 'admin-statistics',
        title: 'Statistiques',
        type: 'item',
        classes: 'nav-item',
        url: '/admin/statistics',
        icon: 'bar-chart',
        breadcrumbs: false,
        roles: ['ADMIN'] // Seuls les admins
      }
    ]
  },

  // ===== SECTION PROFIL =====
  {
    id: 'profile',
    title: 'Mon Compte',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'user-profile',
        title: 'Mon Profil',
        type: 'item',
        classes: 'nav-item',
        url: '/profile',
        icon: 'user',
        breadcrumbs: false,
        roles: ['U1', 'V1', 'V2', 'T1', 'ADMIN']
      }
    ]
  },

  // ===== SECTION AUTHENTIFICATION (pour les tests uniquement) =====
  {
    id: 'authentication',
    title: 'Test Auth',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'login',
        title: 'Connexion',
        type: 'item',
        classes: 'nav-item',
        url: '/login',
        icon: 'log-in',
        target: true,
        breadcrumbs: false,
        roles: [] // Visible pour tous (déconnectés)
      }
    ]
  }
];
