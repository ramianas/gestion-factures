// Fichier: facture-front1/src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Layouts
import { AdminComponent } from './theme/layouts/admin-layout/admin-layout.component';
import { GuestLayoutComponent } from './theme/layouts/guest-layout/guest-layout.component';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { GuestGuard } from './guards/guest.guard';

import { ValidationV1Component } from './demo/factures/validation-v1/validation-v1.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard/default',
        pathMatch: 'full'
      },
      {
        path: 'dashboard/default',
        loadComponent: () => import('./demo/dashboard/default/default.component').then((c) => c.DefaultComponent),
        canActivate: [AuthGuard]
      },

      // ===== ROUTES FACTURES =====
      {
        path: 'factures/create',
        loadComponent: () => import('./demo/factures/facture-create/facture-create.component').then((c) => c.FactureCreateComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['U1'] } // Seuls les utilisateurs U1 peuvent créer des factures
      },
      {
        path: 'factures/list',
        loadComponent: () => import('./demo/factures/mes-factures/mes-factures.component').then((c) => c.MesFacturesComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['U1', 'V1', 'V2', 'T1', 'ADMIN'] } // Tous les rôles peuvent voir leurs factures
      },
      {
        path: 'factures/validation-v1',
        loadComponent: () => import('./demo/factures/validation-v1/validation-v1.component').then((c) => c.ValidationV1Component),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['V1'] } // Seuls les validateurs V1
      },
      {
        path: 'factures/validation-v2',
        loadComponent: () => import('./demo/factures/validation-v2/validation-v2.component').then((c) => c.ValidationV2Component),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['V2'] } // Seuls les validateurs V2
      },
      {
        path: 'factures/tresorerie',
        loadComponent: () => import('./demo/others/sample-page/sample-page.component').then((c) => c.SamplePageComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['T1'] } // Seuls les trésoriers
      },
      {
        path: 'factures/:id',
        loadComponent: () => import('./demo/others/sample-page/sample-page.component').then((c) => c.SamplePageComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['U1', 'V1', 'V2', 'T1', 'ADMIN'] } // Détail accessible à tous
      },

      // ===== ROUTES ADMINISTRATION =====
      {
        path: 'admin/users',
        loadComponent: () => import('./demo/administration/gestion-utilisateurs/gestion-utilisateurs.component').then((c) => c.GestionUtilisateursComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['ADMIN'] } // Seuls les admins
      },
      {
        path: 'admin/statistics',
        loadComponent: () => import('./demo/others/sample-page/sample-page.component').then((c) => c.SamplePageComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['ADMIN'] } // Seuls les admins
      },

      // ===== ROUTES NOTIFICATIONS =====
      {
        path: 'notifications',
        loadComponent: () => import('./demo/notifications/notifications.component').then((c) => c.NotificationsComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['U1', 'V1', 'V2', 'T1', 'ADMIN'] } // Tous les rôles connectés
      },

      // ===== ROUTES PROFIL =====
      {
        path: 'profile',
        loadComponent: () => import('./demo/profil/mon-profil/mon-profil.component').then((c) => c.MonProfilComponent),
        canActivate: [AuthGuard] // Tous les utilisateurs connectés
      },
      {
        path: 'mon-profil', // Route alternative
        loadComponent: () => import('./demo/profil/mon-profil/mon-profil.component').then((c) => c.MonProfilComponent),
        canActivate: [AuthGuard]
      },

      // ===== ROUTES UTILITAIRES (pour la démo) =====
      {
        path: 'typography',
        loadComponent: () => import('./demo/component/basic-component/typography/typography.component').then((c) => c.TypographyComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'color',
        loadComponent: () => import('./demo/component/basic-component/color/color.component').then((c) => c.ColorComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./demo/others/sample-page/sample-page.component').then((c) => c.SamplePageComponent),
        canActivate: [AuthGuard]
      }
    ]
  },

  // ===== ROUTES PUBLIQUES (Guest Layout) =====
  {
    path: '',
    component: GuestLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./demo/pages/authentication/auth-login/auth-login.component').then((c) => c.AuthLoginComponent),
        canActivate: [GuestGuard] // Rediriger si déjà connecté
      },
      {
        path: 'register',
        loadComponent: () => import('./demo/pages/authentication/auth-register/auth-register.component').then((c) => c.AuthRegisterComponent),
        canActivate: [GuestGuard] // Rediriger si déjà connecté
      }
    ]
  },

  // ===== ROUTE WILDCARD =====
  {
    path: '**',
    redirectTo: '/dashboard/default'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false, // Mettre à true pour debug
    onSameUrlNavigation: 'reload'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
