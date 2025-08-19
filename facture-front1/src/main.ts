// Fichier: facture-front1/src/main.ts

import { enableProdMode, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';

import { environment } from './environments/environment';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';

import { AuthInterceptor } from './app/interceptors/auth.interceptor';
import { ErrorInterceptor } from './app/interceptors/error.interceptor';

// Import des services
import { AuthService } from './app/services/auth.service';
import {jwtInterceptor} from "./app/interceptors/jwt.interceptor";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule),
    provideAnimations(),
    provideHttpClient(),
    provideHttpClient(withInterceptors([jwtInterceptor])),

    // Configuration des interceptors HTTP
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },

    // Services
    AuthService
  ]
}).catch((err) => console.error(err));
