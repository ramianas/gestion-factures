import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ✅ LOG POUR DEBUG
    console.log('🔍 Intercepteur JWT appelé pour:', req.url);

    // Exclure les endpoints d'authentification
    if (req.url.includes('/auth/')) {
      console.log('🚫 Endpoint auth - pas de token ajouté');
      return next.handle(req);
    }

    const token = this.authService.getToken();
    console.log('🔑 Token récupéré:', token ? 'Présent' : 'Absent');

    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });

      console.log('✅ Header Authorization ajouté:', cloned.headers.get('Authorization'));
      return next.handle(cloned);
    }

    console.log('❌ Pas de token - requête envoyée sans Authorization');
    return next.handle(req);
  }
}
