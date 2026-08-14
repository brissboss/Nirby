# Droit à l’effacement — suppression de compte

Document d’argumentaire RNCP (Bloc 2 : RGPD / protection des données, gestion des transactions).  
Complète le ticket [NIR-89](https://linear.app/nirbyfr/issue/NIR-89/fix-account-deletion-for-users-owning-pois-or-lists) / GitHub [#190](https://github.com/brissboss/Nirby/issues/190).

Endpoint : `DELETE /auth/account` (`apps/api/src/auth/routes.ts`).

---

## 1. Cadre RGPD (art. 17)

Nirby traite des données personnelles : identifiants de compte, email, avatar, bio, lieux custom (notes, photos, coordonnées) et listes. L’article 17 du RGPD (droit à l’effacement) impose de supprimer ces données lorsque la personne le demande, ici après confirmation du mot de passe.

Le flux vérifie le mot de passe **avant** toute écriture. Un mot de passe invalide renvoie `401 INVALID_CREDENTIALS` et **ne touche aucune session**.

---

## 2. Cascade plutôt qu’anonymisation

Deux stratégies étaient possibles :

| Stratégie             | Effet                                                                     | Pourquoi retenue / écartée                                                                                                            |
| --------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Cascade** (retenue) | `User` supprimé → sessions, POI custom, listes possédées, médias associés | Effacement réel des données personnelles de l’auteur (photos, notes, descriptions).                                                   |
| Anonymisation         | `createdBy` nullable ou user fantôme, contenu conservé                    | Le contenu reste identifiable (style, photos, géolocalisation). Plus complexe (schéma, user sentinel) pour un bénéfice faible en MVP. |

`ListCollaborator.user` cascadait déjà : un utilisateur qui n’est **pas** propriétaire d’une liste tierce disparaît comme collaborateur, **la liste survit**.

Les favoris **Google Places** (`SavedPoi.googlePlaceId`) ne sont pas liés à `User` : ils restent dans les listes des autres. Ce n’est pas une donnée personnelle de l’utilisateur qui part.

### Impact assumé : `SavedPoi` vers un POI custom

`SavedPoi.poi` a déjà `onDelete: Cascade`. Si un tiers a enregistré un POI custom de l’utilisateur dans sa propre liste, cette entrée disparaît avec le POI. C’est cohérent avec l’art. 17 : le lieu et ses photos appartiennent à l’auteur. Un transfert / copie vers les listes tierces dépasserait le périmètre MVP.

`ListCollaborator.invitedBy` n’est pas une clé étrangère : un CUID orphelin peut rester. Hors périmètre.

---

## 3. Graphe des suppressions

```
User
 ├── Session              onDelete: Cascade
 ├── Poi (custom)         onDelete: Cascade
 │    └── SavedPoi.poi    onDelete: Cascade (déjà en place)
 ├── PoiList (possédées)  onDelete: Cascade
 │    ├── SavedPoi.list   onDelete: Cascade (déjà en place)
 │    └── ListCollaborator.list  onDelete: Cascade (déjà en place)
 └── ListCollaborator.user       onDelete: Cascade (déjà en place)
```

`GooglePlaceCache` n’est pas touché.

---

## 4. Atomicité et stockage objet

Ordre d’exécution :

1. Validation Zod + chargement user (POI / listes pour collecter les URLs S3).
2. Vérification du mot de passe (aucune écriture si échec).
3. `prisma.$transaction` interactive : `session.deleteMany` puis `user.delete`. Postgres enchaîne les cascades FK **dans la même transaction**.
4. **Après commit** : `deleteFile()` (S3) en best-effort — un échec S3 est logué et **n’annule pas** la 200. Le droit à l’effacement porte d’abord sur la base ; un retry S3 hors bande est acceptable.
5. Email de confirmation **après** le commit. Un échec d’email est logué sans faire échouer la suppression (le compte est déjà effacé).

Pourquoi S3 hors transaction : l’API objet n’est pas transactionnelle avec Postgres. Inverser l’ordre (S3 d’abord) ferait perdre des fichiers si le `DELETE` SQL échoue. Des orphelins S3 en cas d’indisponibilité objet sont le moindre mal ; ils ne ré-identifient pas le compte une fois la base purgée.

En cas d’échec de la transaction : `500 ACCOUNT_DELETION_FAILED` (pas le `INTERNAL_ERROR` générique). Rollback Postgres : user et sessions intacts.

---

## 5. Démo jury

Prérequis : API + PostgreSQL de test (voir [`test-strategy.md`](./test-strategy.md)).

```bash
# Scénarios d’intégration (owner + POI/liste, collaborateur, 401, rollback)
pnpm -C apps/api test -- __test__/auth/routes.test.ts
```

Scénario oral :

1. Compte avec un POI custom et une liste → `DELETE /auth/account` + mot de passe valide → `200`, plus aucune ligne `User` / `Poi` / `PoiList` / `Session`.
2. Mot de passe faux → `401`, sessions toujours présentes (atomicité).
3. Montrer `onDelete: Cascade` dans `apps/api/prisma/schema.prisma` et la transaction dans le handler.
4. Rappeler ce document pour le choix cascade vs anonymisation.
