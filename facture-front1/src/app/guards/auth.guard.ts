// Fichier: facture-front1/src/app/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {

    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        const isAuthenticated = this.authService.isAuthenticated();

        if (!isAuthenticated) {
          console.log('User not authenticated, redirecting to login');
          this.router.navigate(['/login']);
          return false;
        }

        // Vérifier les rôles requis si spécifiés dans la route
        const requiredRoles = route.data?.['roles'] as string[];
        if (requiredRoles && requiredRoles.length > 0) {
          const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);

          if (!hasRequiredRole) {
            console.log('User does not have required role, redirecting to dashboard');
            this.router.navigate(['/dashboard/default']);
            return false;
          }
        }

        return true;
      })
    );
  }
}
