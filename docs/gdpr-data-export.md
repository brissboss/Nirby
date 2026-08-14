# Droit à la portabilité — export des données

Document d’argumentaire RNCP (Bloc 2 : RGPD / protection des données).  
Complète le ticket [NIR-96](https://linear.app/nirbyfr/issue/NIR-96/add-user-data-export-endpoint) / GitHub [#197](https://github.com/brissboss/Nirby/issues/197).

Endpoint : `GET /auth/me/export` (`apps/api/src/auth/routes.ts`).  
UI : bouton de téléchargement dans `ProfilePrivacyView`.

Le droit à l’effacement (art. 17) est décrit dans [gdpr-account-deletion.md](./gdpr-account-deletion.md).

---

## 1. Cadre RGPD (art. 20)

L’article 20 du RGPD (droit à la portabilité) impose de fournir à la personne les données la concernant dans un **format structuré, couramment utilisé et lisible par machine**. Nirby expose un JSON unique, téléchargeable, qui agrège le profil et l’activité du compte.

L’export est toujours celui du JWT courant (`req.user.id`). Il n’existe pas de paramètre `userId` : un utilisateur ne peut pas exporter le compte d’un autre.

---

## 2. Contenu exporté vs secrets exclus

La requête Prisma utilise un `select` explicite (jamais `include` du `User` entier) pour **ne jamais charger** les secrets en mémoire.

```
User (profil)
 ├── id, email, name, avatarUrl, bio, emailVerified, createdAt, updatedAt
 ├── Poi (créés)          sans location PostGIS
 ├── PoiList (possédées)  + SavedPoi (poiId / googlePlaceId)
 ├── ListCollaborator     rôle + id/nom de la liste (pas l’email des autres)
 └── Session              id, expiresAt, createdAt
```

**Jamais inclus :**

| Champ                                                          | Raison                                           |
| -------------------------------------------------------------- | ------------------------------------------------ |
| `passwordHash`                                                 | secret d’authentification                        |
| `emailVerificationToken`, `passwordResetToken` (+ expirations) | secrets de recovery                              |
| `Session.refreshToken`                                         | secret de session                                |
| `PoiList.shareToken` / `editToken` (+ expirations)             | secrets de capacité (liens de partage / édition) |

`GooglePlaceCache` n’est pas une donnée personnelle du compte : seule la référence `googlePlaceId` des favoris est exportée.

Forme de la réponse :

```json
{
  "exportedAt": "ISO-8601",
  "profile": {},
  "createdPois": [],
  "ownedLists": [{ "savedPois": [] }],
  "collaborations": [],
  "sessions": []
}
```

En-tête `Content-Disposition: attachment; filename="nirby-export.json"` pour un téléchargement direct (curl / navigateur).

---

## 3. Rate limit

L’agrégation traverse plusieurs tables : la route est limitée à **5 requêtes / heure** (`authDataExportRateLimiter` dans `apps/api/src/middleware/rate-limit.ts`), après `requireAuth` pour cléer sur `req.user.id`. Réponse `429 RATE_LIMIT_EXCEEDED` au-delà.

---

## 4. Démo jury

Prérequis : API + PostgreSQL de test (voir [`test-strategy.md`](./test-strategy.md)).

```bash
pnpm -C apps/api test -- __test__/auth/routes.test.ts
```

Scénario oral :

1. Compte avec un POI custom, une liste (avec `shareToken`) et une collaboration → `GET /auth/me/export` → JSON complet (`profile`, `createdPois`, `ownedLists.savedPois`, `collaborations`).
2. Montrer que `JSON.stringify` de la réponse **ne contient pas** `passwordHash`, tokens, `refreshToken`, `shareToken`.
3. Un second compte authentifié n’obtient pas les POI / l’email du premier.
4. Dans l’app : Profil → Confidentialité → « Télécharger mes données » → fichier `nirby-export.json`.
