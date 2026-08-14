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
- Transactions Prisma (écritures multi-étapes, rollback) : voir [prisma-transactions.md](./prisma-transactions.md).
