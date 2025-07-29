# 💼 Gestion de Factures – DAF

Une application complète de gestion de factures multi-utilisateurs avec workflow de validation.

## 🚀 Technologies utilisées

- **Back-end** : Java 17, Spring Boot, JPA, PostgreSQL
- **Front-end** : Angular 16 (facture-front)
- **Base de données** : PostgreSQL
- **Docker** : docker-compose pour le backend et le mail
- **Architecture** : RESTful API, couche service, DTOs, sécurité

## 👥 Types d'utilisateurs

- `U1` : Utilisateur saisie de factures
- `V1` : Validateur N1
- `V2` : Validateur N2
- `T1` : Trésorier
- `ADMIN` : Administrateur (gestion des utilisateurs)

## 🔄 Workflow

1. U1 saisit une facture et choisit les validateurs + trésorier
2. V1 et V2 valident successivement
3. T1 traite le paiement
4. Notifications automatiques envoyées à chaque étape


