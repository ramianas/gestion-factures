// Fichier: facture-front1/src/app/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

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
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        const requiredRoles = route.data?.['roles'] as string[];
        if (!requiredRoles || requiredRoles.length === 0) {
          return true; // Pas de rôle spécifique requis
        }

        const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);

        if (!hasRequiredRole) {
          console.log(`Access denied. Required roles: ${requiredRoles.join(', ')}, User role: ${user.role}`);
          this.router.navigate(['/dashboard/default']);
          return false;
        }

        return true;
      })
    );
  }
}
