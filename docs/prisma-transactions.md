# Transactions Prisma — écritures multi-étapes

Document d’argumentaire RNCP (Bloc 2, BC02 : « Gestion des requêtes et transactions », Démo 2).  
Complète le ticket [NIR-90](https://linear.app/nirbyfr/issue/NIR-90/wrap-multi-step-writes-in-prisma-transactions) / GitHub [#191](https://github.com/brissboss/Nirby/issues/191).

La suppression de compte (premier `$transaction` du projet) est détaillée dans [gdpr-account-deletion.md](./gdpr-account-deletion.md).

---

## 1. Interactive vs séquentielle

Prisma propose deux formes :

| Forme            | Syntaxe                                      | Usage                                                            |
| ---------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| **Séquentielle** | `prisma.$transaction([op1, op2])`            | Liste de promises figée à l’avance.                              |
| **Interactive**  | `prisma.$transaction(async (tx) => { ... })` | Lectures puis écritures dans le même callback, même client `tx`. |

**Choix retenu : interactive**, pour trois raisons :

1. Alignement avec `DELETE /auth/account` (NIR-89) — un seul style à montrer au jury.
2. Le join par edit token doit **relire** la liste et l’éventuel collaborateur avant le `create`.
3. L’ordre `user.update` puis `session.deleteMany` est explicite dans le callback ; un échec du second annule le premier (rollback Postgres).

La forme séquentielle suffirait pour reset / change password seuls, mais elle ne couvre pas le join. Un seul pattern évite la confusion en soutenance.

---

## 2. Flux couverts

| Flux                      | Fichier                | Atomique ?                                  | Comportement si échec                                                    |
| ------------------------- | ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| Reset password            | `auth/routes.ts`       | TX : update hash + `session.deleteMany`     | Mot de passe et sessions inchangés                                       |
| Change password           | `auth/routes.ts`       | idem                                        | idem                                                                     |
| Delete account            | `auth/routes.ts`       | TX : sessions + `user.delete` (cascades FK) | Compte intact — voir doc RGPD                                            |
| Upload avatar / photo POI | `upload/routes.ts`     | **Compensation S3**, pas de TX objet        | Nouveau fichier S3 supprimé ; URL non persistée ; ancien avatar conservé |
| Join par edit token       | `list/share.routes.ts` | TX : relecture liste + create collaborateur | Unique `(listId, userId)` ; `P2002` → 200 idempotent                     |

S3 n’est pas transactionnel avec Postgres. Ordre : **upload objet d’abord**, puis écriture SQL. Si le SQL échoue, `deleteFile()` du **nouveau** fichier. L’ancien avatar n’est retiré qu’**après** un update réussi — l’inverse (supprimer l’ancien avant le SQL) faisait disparaître les deux URLs en cas d’échec.

---

## 3. Concurrence du join

Deux `POST /list/join` simultanés peuvent tous deux voir « pas encore collaborateur ». La contrainte `@@unique([listId, userId])` fait échouer le second `create` (`P2002`). Le handler attrape ce code et répond comme « déjà collaborateur » (200), pas 500.

La transaction interactive réduit la fenêtre (relecture + create sur le même `tx`) ; l’unicité Postgres reste le garde-fou réel. Pas de test HTTP de course (flaky) : le scénario se démontre en citant le `catch P2002` et le unique du schéma.

---

## 4. Démo jury — rollback

```bash
pnpm -C apps/api test -- __test__/auth/routes.test.ts
```

Scénario oral (reset password) :

1. Utilisateur avec un token de reset valide et une session.
2. Test « `session.deleteMany` lève au milieu de la TX » → HTTP 500, `passwordHash` identique, session toujours en base.
3. Montrer le callback `$transaction` dans `POST /auth/reset-password`.
4. Même histoire pour change password et, pour S3, le test upload avatar dont l’update SQL échoue (`deleteFile` appelé avec l’URL **nouvelle** uniquement).
