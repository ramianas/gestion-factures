// Fichier: facture-front1/src/environments/environment.prod.ts

export const environment = {
  production: true,
  appVersion: '1.0.0',
  apiUrl: 'https://votre-api-production.com',
  authConfig: {
    tokenKey: 'jwt_token',
    userKey: 'current_user',
    refreshTokenKey: 'refresh_token'
  },
  features: {
    enableMockData: false,
    enableDebugMode: false,
    enableNotifications: true
  }
};
