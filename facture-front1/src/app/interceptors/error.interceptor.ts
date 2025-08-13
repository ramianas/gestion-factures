// Fichier: facture-front1/src/app/interceptors/error.interceptor.ts

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Une erreur s\'est produite';

        if (error.error instanceof ErrorEvent) {
          // Erreur côté client
          errorMessage = `Erreur: ${error.error.message}`;
        } else {
          // Erreur côté serveur
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Requête invalide';
              break;
            case 401:
              errorMessage = 'Session expirée, veuillez vous reconnecter';
              break;
            case 403:
              errorMessage = 'Accès non autorisé';
              break;
            case 404:
              errorMessage = 'Ressource non trouvée';
              break;
            case 500:
              errorMessage = 'Erreur serveur interne';
              break;
            case 0:
              errorMessage = 'Impossible de contacter le serveur';
              break;
            default:
              errorMessage = error.error?.message || `Erreur ${error.status}`;
          }
        }

        console.error('HTTP Error:', error);

        // Créer un objet d'erreur standardisé
        const standardError = {
          message: errorMessage,
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          timestamp: new Date().toISOString()
        };

        return throwError(() => standardError);
      })
    );
  }
}
