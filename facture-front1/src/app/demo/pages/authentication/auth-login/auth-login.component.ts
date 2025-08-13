// Fichier: facture-front1/src/app/demo/pages/authentication/auth-login/auth-login.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService, LoginRequest } from '../../../../services/auth.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth-login.component.html',
  styleUrl: './auth-login.component.scss'
})
export class AuthLoginComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // Modèle du formulaire
  loginData: LoginRequest = {
    email: 'admin@example.com',
    password: 'admin123'
  };

  // États du composant
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard/default']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(form: NgForm): void {
    if (form.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('🔐 Tentative de connexion:', this.loginData.email);

    this.authService.login(this.loginData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Connexion réussie:', response);
          this.isLoading = false;

          // Redirection basée sur le rôle
          this.redirectAfterLogin(response.user.role);
        },
        error: (error) => {
          console.error('❌ Erreur de connexion:', error);
          this.isLoading = false;
          this.errorMessage = error.message || 'Erreur lors de la connexion';
        }
      });
  }

  private redirectAfterLogin(userRole: string): void {
    // Redirection personnalisée selon le rôle
    switch (userRole) {
      case 'ADMIN':
        this.router.navigate(['/admin/users']);
        break;
      case 'U1':
        this.router.navigate(['/factures/create']);
        break;
      case 'V1':
        this.router.navigate(['/factures/validation-v1']);
        break;
      case 'V2':
        this.router.navigate(['/factures/validation-v2']);
        break;
      case 'T1':
        this.router.navigate(['/factures/tresorerie']);
        break;
      default:
        this.router.navigate(['/dashboard/default']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Méthodes de test rapide (à supprimer en production)
  loginAsAdmin(): void {
    this.loginData = { email: 'admin@factureapp.com', password: 'admin123' };
    this.submitLogin();
  }

  loginAsUser(): void {
    this.loginData = { email: 'user@factureapp.com', password: 'user123' };
    this.submitLogin();
  }

  loginAsValidator1(): void {
    this.loginData = { email: 'validator1@factureapp.com', password: 'validator123' };
    this.submitLogin();
  }

  loginAsValidator2(): void {
    this.loginData = { email: 'validator2@factureapp.com', password: 'validator123' };
    this.submitLogin();
  }

  loginAsTreasurer(): void {
    this.loginData = { email: 'treasurer@factureapp.com', password: 'treasurer123' };
    this.submitLogin();
  }

  private submitLogin(): void {
    // Simuler la soumission du formulaire
    if (this.loginData.email && this.loginData.password) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.redirectAfterLogin(response.user.role);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error.message || 'Erreur lors de la connexion';
          }
        });
    }
  }

  clearError(): void {
    this.errorMessage = '';
  }
}
