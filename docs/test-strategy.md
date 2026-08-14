# Stratégie et plans de tests — Nirby

Document de référence pour la soutenance RNCP (Bloc 3 : tests, déploiement, DevOps).  
Complète les slides Figma et sert de base si le jury demande les plans de tests ou les rapports d’exécution.

---

## 1. Objectifs

- **Limiter les régressions** sur les zones à fort impact métier : authentification, permissions, CRUD listes/POI.
- **Automatiser** l’exécution à chaque PR et push sur `main` / `staging` via GitHub Actions.
- **Documenter** les scénarios dans le code (`describe` / `it`) et consolider les scénarios représentatifs dans ce fichier.
- **Mesurer** la couverture API et web (seuils Vitest bloquants en CI) et disposer de rapports HTML/JSON en artifacts.

---

## 2. Pyramide et outils

| Niveau                   | Outil                                | Périmètre                                                                  | Statut                   |
| ------------------------ | ------------------------------------ | -------------------------------------------------------------------------- | ------------------------ |
| Unitaires                | Vitest                               | Règles métier (`list-policy`, `poi-policy`), schémas, utils front          | ✅ Implémenté            |
| Intégration API          | Vitest + Supertest                   | Routes Express, middleware auth, base PostgreSQL de test                   | ✅ Implémenté            |
| Composants / pages front | Vitest + Testing Library + jsdom     | Vues listes, hooks, formulaires                                            | ✅ Implémenté            |
| Accessibilité            | ESLint `jsx-a11y` recommended + axe  | Login, index/détail listes, create POI (jsdom ; pas les primitives shadcn) | ✅ Implémenté            |
| Smoke / health check     | Docker + `curl` (CI) + `HEALTHCHECK` | Conteneurs API et web non-root, `/health` et `/` répondent                 | ✅ Implémenté            |
| Sécurité (OWASP)         | Vitest + Supertest                   | Injection, IDOR, XSS stocké, upload malveillant                            | ✅ Implémenté            |
| Audit dépendances (SCA)  | `pnpm audit` + Dependabot            | CVE dans `pnpm-lock.yaml`, PRs de mise à jour hebdomadaires                | ✅ Implémenté            |
| DAST                     | OWASP ZAP Baseline (CI)              | Scan passif/actif sur l’API Docker en CI                                   | ✅ Implémenté            |
| E2E                      | Playwright                           | Parcours utilisateur complets                                              | ⏳ Prévu, non implémenté |

**Rapports de tests :**

- **CI GitHub Actions** : [workflow `ci-cd.yaml`](../.github/workflows/ci-cd.yaml) — couverture bloquante API et web (`test:coverage`), artifacts HTML/JSON.
- **Badge CI** : visible dans le [README](../README.md).
- **Couverture locale** : `pnpm -C apps/web test:coverage` et `pnpm -C apps/api test:coverage`.

---

## 3. Environnement de test

### Local

- API : PostgreSQL `nirby_test`, Redis, variables définies dans `apps/api/vitest.config.ts`.
- Web : jsdom, mocks Next.js (`next/navigation`, `next-intl`) et matchers axe (`vitest-axe`) dans `apps/web/src/test/setup.ts`.
- Lancement : `pnpm test` (racine, via Turbo) ou `pnpm -C apps/api test` / `pnpm -C apps/web test`.

### CI (GitHub Actions)

- Déclenchement : **pull request** et **push** sur `main` / `staging`.
- Job `ci-api` : PostGIS 16, base `nirby_test`, migrations Prisma, Redis, secrets factices (`JWT_SECRET`, `GOOGLE_PLACES_API_KEY`, …), tests + couverture (seuils 70 %) + artifact `api-coverage-report`.
- Job `ci-web` : tests + couverture (seuils 36 / 30 / 26) + assertions axe (login, listes, create POI) + artifact `web-coverage-report` + build de vérification.
- Job `setup` : `pnpm lint` (dont `jsx-a11y` recommended sur `apps/web`).
- Job `api-docker` : image API (`USER node`), health check HTTP + assert uid ≠ 0, scan OWASP ZAP Baseline (rapport artifact).
- Job `security-audit` : `pnpm audit --audit-level=high` (rapport artifact, non bloquant).
- Job `web-docker` : image web (`USER node`), health check HTTP + assert uid ≠ 0.
- **Dependabot** : PRs hebdomadaires npm, Docker et GitHub Actions (`.github/dependabot.yml`).

Chaque run CI recrée un environnement isolé ; les tests API nettoient les données (`deleteMany` en `beforeEach` / `afterAll`).

---

## 4. Données de test isolées

| Mécanisme                                           | Usage                                                   |
| --------------------------------------------------- | ------------------------------------------------------- |
| Base dédiée `nirby_test`                            | Isolation dev / CI / prod                               |
| `beforeEach` / `afterAll` + `prisma.*.deleteMany()` | Reset entre scénarios d’intégration                     |
| Variables d’env de test                             | `vitest.config.ts` (API), env CI dans le workflow       |
| Mocks front                                         | Router Next, i18n, thème (`apps/web/src/test/setup.ts`) |
| Secrets factices                                    | JWT, clés API, Resend — jamais de secrets prod en CI    |

---

## 5. Périmètre et risques

### Priorité (effort de test concentré)

1. **Auth JWT** — accès non autorisé = faille critique.
2. **Permissions listes** — rôles OWNER / EDITOR / VIEWER / ADMIN.
3. **CRUD listes & POI** — routes API + isolation inter-utilisateurs.
4. **Front critique** — affichage et actions selon le rôle sur les vues listes.
5. **Sécurité** — hash mot de passe, rate limiting, OWASP Top 10 (injection, IDOR, XSS, upload).

### Hors périmètre (assumé)

- Intégration **Mapbox** / rendu carte (mock ou non testé en E2E).
- **UI cosmétique** (design system shadcn, styles).
- **E2E Playwright** (prévu, pas encore en place).
- **Pentest manuel** complet (hors scope projet étudiant).

### Risque métier ciblé

> Une régression sur les **droits d’accès** (ex. un VIEWER qui pourrait supprimer une liste) a un impact direct sur la confiance des utilisateurs — c’est la zone la plus testée en unitaire et en intégration.

---

## 6. Plans de tests par domaine

Les scénarios détaillés vivent dans les fichiers `*.test.ts` / `*.test.tsx`.  
Ci-dessous : **extraits représentatifs** au format attendu par la checklist (entrée → sortie attendue → résultat).

### 6.1 Permissions de listes

| Scénario                               | Entrée                                 | Sortie attendue | Résultat | Fichier                                 |
| -------------------------------------- | -------------------------------------- | --------------- | -------- | --------------------------------------- |
| VIEWER ne peut pas modifier une liste  | `canUpdateList("VIEWER")`              | `false`         | ✅ Pass  | `apps/api/src/list/list-policy.test.ts` |
| VIEWER ne peut pas supprimer une liste | `canDeleteList("VIEWER")`              | `false`         | ✅ Pass  | `apps/api/src/list/list-policy.test.ts` |
| OWNER peut supprimer une liste         | `canDeleteList("OWNER")`               | `true`          | ✅ Pass  | idem                                    |
| VIEWER ne gère pas les collaborateurs  | `canManageCollaborators("VIEWER")`     | `false`         | ✅ Pass  | idem                                    |
| Partage réservé OWNER/ADMIN            | `canManageShareAndEditLinks("EDITOR")` | `false`         | ✅ Pass  | idem                                    |

### 6.2 Permissions POI

| Scénario                            | Entrée                           | Sortie attendue          | Résultat | Fichier                               |
| ----------------------------------- | -------------------------------- | ------------------------ | -------- | ------------------------------------- |
| Lecture POI privé par un autre user | `visibility: PRIVATE`, `otherId` | `canReadPoi` → `false`   | ✅ Pass  | `apps/api/src/poi/poi-policy.test.ts` |
| Édition réservée au créateur        | `createdBy !== userId`           | `canEditPoi` → `false`   | ✅ Pass  | idem                                  |
| Suppression réservée au créateur    | `createdBy !== userId`           | `canDeletePoi` → `false` | ✅ Pass  | idem                                  |

### 6.3 Authentification JWT

| Scénario                          | Entrée                                    | Sortie attendue               | Résultat | Fichier                                     |
| --------------------------------- | ----------------------------------------- | ----------------------------- | -------- | ------------------------------------------- |
| Requête sans header Authorization | `GET /protected` sans token               | HTTP 401, `UNAUTHORIZED`      | ✅ Pass  | `apps/api/__test__/auth/middleware.test.ts` |
| Token JWT invalide                | `Authorization: Bearer invalid-token-123` | HTTP 401                      | ✅ Pass  | idem                                        |
| Token valide, user existant       | Bearer token signé + user en BDD          | HTTP 200, `user` dans body    | ✅ Pass  | idem                                        |
| Email non vérifié                 | user `emailVerified: false`               | HTTP 403 sur route protégée   | ✅ Pass  | idem                                        |
| POST /poi sans email vérifié      | JWT user `emailVerified: false`           | HTTP 403, aucun POI créé      | ✅ Pass  | `apps/api/__test__/poi/routes.test.ts`      |
| POST /list sans email vérifié     | idem                                      | HTTP 403, aucune liste créée  | ✅ Pass  | `apps/api/__test__/list/routes.test.ts`     |
| Invite collab. sans email vérifié | idem                                      | HTTP 403                      | ✅ Pass  | idem                                        |
| Login mot de passe incorrect      | email valide, mauvais password            | HTTP 401                      | ✅ Pass  | `apps/api/__test__/auth/routes.test.ts`     |
| Refresh token invalide            | cookie `refreshToken=invalid-token`       | HTTP 401                      | ✅ Pass  | idem                                        |
| Suppression compte + POI et liste | `DELETE /auth/account`, user owner        | HTTP 200, plus de données     | ✅ Pass  | idem                                        |
| Collaborateur d’une liste tierce  | delete du non-owner                       | liste intacte, collab. parti  | ✅ Pass  | idem                                        |
| Mot de passe invalide (delete)    | mauvais password, session existante       | HTTP 401, sessions intactes   | ✅ Pass  | idem                                        |
| Rollback transaction delete       | `user.delete` lève en cours de TX         | user + sessions intacts       | ✅ Pass  | idem                                        |
| Rollback reset password           | `session.deleteMany` lève dans la TX      | hash inchangé, session là     | ✅ Pass  | idem                                        |
| Rollback change password          | idem                                      | hash inchangé, sessions là    | ✅ Pass  | idem                                        |
| Upload avatar, update SQL échoue  | `user.update` throw après S3              | URL non persistée, S3 nettoyé | ✅ Pass  | `apps/api/__test__/upload/routes.test.ts`   |

### 6.4 CRUD listes & POI (routes API)

| Scénario                         | Entrée                            | Sortie attendue | Résultat | Fichier                                 |
| -------------------------------- | --------------------------------- | --------------- | -------- | --------------------------------------- |
| Création liste sans auth         | `POST /list` sans token           | HTTP 401        | ✅ Pass  | `apps/api/__test__/list/routes.test.ts` |
| Création liste valide            | `POST /list` + auth + `{ name }`  | HTTP 201        | ✅ Pass  | idem                                    |
| Accès POI privé d’un autre user  | `GET /poi/:id` (auteur différent) | HTTP 403/404    | ✅ Pass  | `apps/api/__test__/poi/routes.test.ts`  |
| Suppression POI par non-créateur | `DELETE /poi/:id`                 | refus           | ✅ Pass  | idem                                    |
| Partage liste par non-owner      | `POST /list/:id/share` (VIEWER)   | refus           | ✅ Pass  | `apps/api/__test__/list/routes.test.ts` |

### 6.5 Composants front critiques

| Scénario                              | Entrée                          | Sortie attendue            | Résultat | Fichier                                                        |
| ------------------------------------- | ------------------------------- | -------------------------- | -------- | -------------------------------------------------------------- |
| Bouton édition masqué pour VIEWER     | `role: VIEWER` sur détail liste | pas de bouton edit         | ✅ Pass  | `apps/web/src/features/lists/views/lists-detail-view.test.tsx` |
| Bouton suppression masqué pour VIEWER | `role: VIEWER`                  | pas de bouton delete       | ✅ Pass  | idem                                                           |
| Bouton suppression visible pour OWNER | `role: OWNER`                   | bouton delete présent      | ✅ Pass  | idem                                                           |
| État loading                          | API en pending                  | skeleton affiché           | ✅ Pass  | idem                                                           |
| Liste introuvable                     | erreur `LIST_NOT_FOUND`         | message not found          | ✅ Pass  | idem                                                           |
| Index listes vide                     | `lists: []`                     | empty state + CTA création | ✅ Pass  | `apps/web/src/features/lists/views/lists-index-view.test.tsx`  |

### 6.6 Sécurité

| Scénario                            | Entrée                           | Sortie attendue              | Résultat | Fichier                                           |
| ----------------------------------- | -------------------------------- | ---------------------------- | -------- | ------------------------------------------------- |
| Hash mot de passe                   | `hashPassword("test123")`        | hash ≠ mot de passe en clair | ✅ Pass  | `apps/api/__test__/auth/hash.test.ts`             |
| Vérification mot de passe correct   | `verifyPassword(password, hash)` | `true`                       | ✅ Pass  | idem                                              |
| Vérification mot de passe incorrect | mauvais password                 | `false`                      | ✅ Pass  | idem                                              |
| Salage unique                       | deux hash du même password       | hash1 ≠ hash2                | ✅ Pass  | idem                                              |
| Rate limiters exportés              | import middleware                | fonctions définies           | ✅ Pass  | `apps/api/__test__/middleware/rate-limit.test.ts` |
| Rate limit désactivé en test        | `NODE_ENV=test`                  | `next()` appelé sans blocage | ✅ Pass  | idem                                              |

### 6.7 Sécurité — OWASP Top 10

Fichier dédié : `apps/api/__test__/security/owasp.test.ts`.  
Les scénarios ci-dessous couvrent les risques les plus pertinents pour Nirby (API Express + Prisma + JWT).

| Scénario OWASP                     | Entrée                                        | Sortie attendue                      | Résultat | Fichier                                         |
| ---------------------------------- | --------------------------------------------- | ------------------------------------ | -------- | ----------------------------------------------- |
| A03 — Injection SQL (signup)       | email `'; DROP TABLE users; --@example.com`   | HTTP 400, table `User` intacte       | ✅ Pass  | `owasp.test.ts`                                 |
| A03 — Injection SQL (nom de liste) | `name: "'; DROP TABLE users; --"`             | HTTP 201, texte stocké littéralement | ✅ Pass  | idem                                            |
| A03 — Injection SQL (query params) | `latitude='; DROP TABLE...` sur `/poi/nearby` | HTTP 400 validation                  | ✅ Pass  | idem                                            |
| A01 — IDOR liste privée            | `GET /list/:id` avec token d’un autre user    | HTTP 404                             | ✅ Pass  | idem                                            |
| A01 — IDOR suppression liste       | `DELETE /list/:id` par non-propriétaire       | HTTP 404, liste intacte en BDD       | ✅ Pass  | idem                                            |
| A01 — IDOR POI privé               | `GET /poi/:id` par non-créateur               | HTTP 403 `POI_ACCESS_DENIED`         | ✅ Pass  | idem                                            |
| A07 — JWT altéré                   | Bearer token modifié                          | HTTP 401 `UNAUTHORIZED`              | ✅ Pass  | idem                                            |
| A07 — JWT user supprimé            | token valide mais user absent en BDD          | HTTP 401                             | ✅ Pass  | idem                                            |
| XSS stocké (liste)                 | `name: <script>alert("xss")</script>`         | stocké et renvoyé en texte JSON      | ✅ Pass  | idem (échappement côté React front)             |
| XSS stocké (POI)                   | `description` avec balise script              | stocké et renvoyé en texte JSON      | ✅ Pass  | idem                                            |
| A08 — Upload malveillant           | fichier `.exe` (`application/x-msdownload`)   | HTTP 400 `UPLOAD_INVALID_FILE_TYPE`  | ✅ Pass  | idem                                            |
| A06 — Composants vulnérables       | `pnpm audit --audit-level=high`               | rapport CI + alertes Dependabot      | ✅ CI    | job `security-audit` + `.github/dependabot.yml` |
| A05 — Headers / config             | scan OWASP ZAP Baseline sur API Docker        | rapport HTML artifact CI             | ✅ CI    | job `api-docker`                                |

**Mitigations code associées :** Prisma (requêtes paramétrées), Zod (validation entrées), Helmet + CORS (`server.ts`), cookies `httpOnly` / `sameSite: strict`, rate limiting auth.

---

## 7. Résultats et couverture

### Volume

- **91 fichiers de test** (`apps/api` 18 + `apps/web` 73), dont `security/owasp.test.ts`.
- **CI verte** requise pour merge (lint + tests + smoke Docker sur les chemins modifiés).

### Couverture (seuils Vitest)

| App | Seuils configurés                            | Commande                                                        |
| --- | -------------------------------------------- | --------------------------------------------------------------- |
| Web | ~36 % lignes, 30 % fonctions, 26 % branches  | `pnpm -C apps/web test:coverage` (exécuté en CI, artifact HTML) |
| API | 70 % lignes, fonctions, branches, statements | `pnpm -C apps/api test:coverage` (exécuté en CI, artifact HTML) |

Les seuils web sont volontairement modestes : exclusion des composants UI génériques et du code généré (OpenAPI). L’effort porte sur les **features métier** (listes, auth).

Constat local (août 2026) : API ~80 % statements / ~71 % branches. Le seuil CI à 70 % est un **plancher** : une régression en dessous fait échouer `ci-api`.

### Exemple de bug détecté et corrigé

**Contexte :** revue des règles `canDeleteList` — un VIEWER ne doit jamais pouvoir supprimer une liste.

**Entrée :** `canDeleteList("VIEWER")`  
**Attendu :** `false`  
**Constat initial :** comportement incorrect ou test manquant selon l’itération du code.  
**Correction :** règle explicite dans `list-policy.ts` + tests unitaires `denies EDITOR and VIEWER`.  
**Résultat actuel :** ✅ tests verts en local et CI.

_(Adapter la formulation à l’oral si le bug a été trouvé manuellement avant d’ajouter le test — l’important est le lien scénario → correction → test de non-régression.)_

---

## 8. Limites identifiées

| Limite                                        | Impact                                                           | Piste d’amélioration                                           |
| --------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| Pas d’E2E Playwright                          | Parcours multi-pages non automatisés                             | Ajouter 2–3 scénarios critiques (login → créer liste)          |
| Tests sécurité limités à l’API                | XSS stocké testé en JSON, pas le rendu React / navigateur        | Tests composants ou E2E avec payload XSS sur le front          |
| ZAP Baseline API uniquement                   | Le front Next.js n’est pas scanné en DAST                        | Étendre ZAP à `web-docker` ou scan staging périodique          |
| ZAP / audit non bloquants en CI               | CVE et alertes DAST documentées sans empêcher le merge           | Corriger les CVE high, puis retirer `continue-on-error`        |
| CVE dans dépendances transitives              | `pnpm audit` remonte des vulnérabilités (ex. `axios`)            | PRs Dependabot + overrides / mises à jour des packages parents |
| Upload : validation MIME seulement            | Un binaire malveillant avec `Content-Type: image/jpeg` passerait | Ajouter une détection par magic bytes (ex. `file-type`)        |
| Rate limiting non exercé en tests intégration | `NODE_ENV=test` désactive le blocage réel                        | Tests dédiés avec `NODE_ENV=production` ou tests de charge     |
| CSRF / SSRF non couverts explicitement        | API stateless JWT ; proxy Google Places côté serveur             | Tests ciblés refresh cookie + validation stricte des URLs      |
| Conteneurs : pas de drop de capabilities      | `USER node` + HEALTHCHECK suffisent pour le MVP ANSSI            | `cap_drop: ALL` Compose / distroless plus tard                 |
| Monitoring prod                               | Health check CI + HEALTHCHECK image ; pas d’alerting 5xx         | Prometheus / alertes HTTP 5xx                                  |
| Mapbox / carte                                | Non couvert par tests automatisés                                | Tests manuels ou E2E visuels                                   |
| Pentest manuel absent                         | Pas d’audit humain ni de fuzzing avancé                          | Audit externe avant mise en prod réelle                        |

---

## 9. Exécution et rapports (pour le jury)

```bash
# Tous les tests
pnpm test

# API seule avec couverture (comme en CI)
pnpm -C apps/api test:coverage -- --reporter=verbose

# Tests sécurité OWASP uniquement
pnpm -C apps/api test -- security/owasp

# Audit dépendances (SCA)
pnpm audit --audit-level=high

# Web avec couverture
pnpm -C apps/web test:coverage
```

**Rapports CI :** GitHub → onglet _Actions_ → workflow _CI/CD_ :

- job `ci-api` → logs + artifact `api-coverage-report` (`apps/api/coverage`) ;
- job `ci-web` → logs + artifact `web-coverage-report` (`apps/web/coverage`) ;
- job `security-audit` → artifact `pnpm-audit-report` ;
- job `api-docker` → artifact `zap-baseline-report` ;
- onglet _Security_ → alertes **Dependabot**.

**Couverture HTML :** `apps/api/coverage/` et `apps/web/coverage/` après `test:coverage` (local ou artifact CI).

---

## 10. Lien avec la présentation

| Slide / oral                      | Section doc          |
| --------------------------------- | -------------------- |
| Stratégie de tests (pyramide, CI) | §2, §3               |
| Plans & Résultats (domaines)      | §6                   |
| Tests sécurité OWASP              | §6.7                 |
| Périmètre & risques               | §5                   |
| Résultats & limites               | §7, §8               |
| Démo live                         | §9 + `owasp.test.ts` |
