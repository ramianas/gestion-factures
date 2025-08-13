// Fichier: facture-front1/src/environments/environment.ts

export const environment = {
  production: false,
  appVersion: '1.0.0',
  apiUrl: 'http://localhost:8088',
  authConfig: {
    tokenKey: 'jwt_token',
    userKey: 'current_user',
    refreshTokenKey: 'refresh_token'
  },
  features: {
    enableMockData: true,
    enableDebugMode: true,
    enableNotifications: true
  }
};
