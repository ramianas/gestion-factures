// Fichier: src/app/theme/layouts/admin-layout/navigation/navigation.ts
// Remplacez le contenu de NavigationItems par ceci :

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
}

export const NavigationItems: NavigationItem[] = [
  {
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
        breadcrumbs: false
      }
    ]
  },
  // ===== 🆕 SECTION GESTION FACTURES =====
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
        breadcrumbs: false
      },
      {
        id: 'facture-list',
        title: 'Mes Factures',
        type: 'item',
        classes: 'nav-item',
        url: '/factures/list',
        icon: 'receipt',
        breadcrumbs: false
      },
      {
        id: 'facture-validation',
        title: 'À Valider',
        type: 'item',
        classes: 'nav-item',
        url: '/factures/validation',
        icon: 'check',
        breadcrumbs: false
      }
    ]
  },
  // ===== SECTION AUTHENTIFICATION =====
  {
    id: 'authentication',
    title: 'Authentification',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'login',
        title: 'Connexion',
        type: 'item',
        classes: 'nav-item',
        url: '/login',
        icon: 'login',
        target: true,
        breadcrumbs: false
      },
      {
        id: 'register',
        title: 'Inscription',
        type: 'item',
        classes: 'nav-item',
        url: '/register',
        icon: 'profile',
        target: true,
        breadcrumbs: false
      }
    ]
  },
  // ===== SECTION COMPOSANTS UI =====
  {
    id: 'utilities',
    title: 'Composants UI',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'typography',
        title: 'Typographie',
        type: 'item',
        classes: 'nav-item',
        url: '/typography',
        icon: 'font-size'
      },
      {
        id: 'color',
        title: 'Couleurs',
        type: 'item',
        classes: 'nav-item',
        url: '/color',
        icon: 'bg-colors'
      },
      {
        id: 'ant-icons',
        title: 'Icônes',
        type: 'item',
        classes: 'nav-item',
        url: 'https://ant.design/components/icon',
        icon: 'ant-design',
        target: true,
        external: true
      }
    ]
  },
  // ===== SECTION AUTRES =====
  {
    id: 'other',
    title: 'Autres',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'sample-page',
        title: 'Page Exemple',
        type: 'item',
        url: '/sample-page',
        classes: 'nav-item',
        icon: 'chrome'
      },
      {
        id: 'document',
        title: 'Documentation',
        type: 'item',
        classes: 'nav-item',
        url: 'https://codedthemes.gitbook.io/mantis-angular/',
        icon: 'question',
        target: true,
        external: true
      }
    ]
  }
];
