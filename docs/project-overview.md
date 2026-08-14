# Nirby Vision

Nirby est une webapp « spatial IA » centrée sur la cartographie personnalisée des lieux d’intérêt (POI).

## Expérience utilisateur

- Accès en lecture anonyme à une carte Mapbox avec POI filtrables.
- Authentification requise pour créer des listes, ajouter/éditer des POI, joindre des médias ou collaborer.
- Recherche de POI via Google Places API et ajout manuel possible.

## Fonctionnalités clés

- **Listes hiérarchiques** : listes imbriquées, partageables et collaboratives.
- **Attributs POI** : photos/vidéos, description, notes, tags, statut (à faire / fait).
- **Visualisation avancée** : filtrage par pays, ville, géolocalisation, tags, listes.
- **Gestion des utilisateurs** : lecture publique, actions réservées aux comptes connectés.

## Contraintes / objectifs

- Interface front en React + Tailwind + shadcn/ui.
- Backend actuel Express/Prisma/PostgreSQL (PostGIS) + Redis.
- Projet de validation RNCP : stabilité, traçabilité et couverture fonctionnelle démontrables.
- Droit à l’effacement (RGPD art. 17) : voir [gdpr-account-deletion.md](./gdpr-account-deletion.md).
- Droit à la portabilité (RGPD art. 20) : voir [gdpr-data-export.md](./gdpr-data-export.md).
- Transactions Prisma (écritures multi-étapes, rollback) : voir [prisma-transactions.md](./prisma-transactions.md).
- Vérification d’email sur les routes d’écriture : voir [email-verification.md](./email-verification.md).
- Pages légales `/privacy` et `/mentions` (bandeau d’exemple assumé), liées depuis l’auth et le profil.
