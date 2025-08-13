// Fichier: facture-front1/src/app/guards/guest.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user && this.authService.isAuthenticated()) {
          // L'utilisateur est déjà connecté, rediriger vers le dashboard
          this.router.navigate(['/dashboard/default']);
          return false;
        }
        return true; // Permettre l'accès aux pages de connexion/inscription
      })
    );
  }
}
