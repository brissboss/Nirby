# Vérification d’email — routes sensibles

Document d’argumentaire RNCP (Bloc 1 : « routes sensibles protégées »).  
Complète le ticket [NIR-100](https://linear.app/nirbyfr/issue/NIR-100/apply-or-remove-unused-email-verification-guard) / GitHub [#201](https://github.com/brissboss/Nirby/issues/201).

---

## 1. Pourquoi appliquer plutôt que supprimer

`requireVerifiedEmail` existait dans [`apps/api/src/auth/middleware.ts`](../apps/api/src/auth/middleware.ts) et était testé, mais n’était monté **nulle part**.

Le login refuse déjà les comptes non vérifiés (`403 EMAIL_NOT_VERIFIED`) et le signup n’émet pas de JWT. Fonctionnellement, ce contrôle suffirait.

On l’a **branché** quand même :

1. Du code mort, testé et commenté, est plus difficile à défendre qu’une défense en profondeur.
2. Un JWT peut exister sans passer par le login (tests, seed, token encore valide si le statut changeait).
3. Restreindre aux **écritures / emails** : GET `/auth/me` et lectures de listes restent possibles, ce qui permet d’afficher un CTA de vérification.

---

## 2. Périmètre

Après `requireAuth` :

| Route                                     | Raison              |
| ----------------------------------------- | ------------------- |
| `POST /poi`                               | Création de contenu |
| `POST /list`                              | Création de contenu |
| `POST /list/:listId/collaborators/invite` | Déclenche un email  |

Lectures, updates, uploads, join et Google Places : hors scope volontaire (moins de surface, fixtures existantes déjà `emailVerified: true` sur les writes).

---

## 3. Front

Parcours réel : le login. Sur `EMAIL_NOT_VERIFIED`, la page affiche le panneau « email non vérifié » et un bouton de renvoi (`resendEmail`), comme après le signup. Pas de handler global sur les mutations : un utilisateur réel n’obtient pas de token.

---

## 4. Démo jury

```bash
pnpm -C apps/api test -- __test__/auth/middleware.test.ts __test__/poi/routes.test.ts __test__/list/routes.test.ts
```

1. Montrer `requireVerifiedEmail` monté sur `POST /poi` (et list / invite).
2. Test : JWT d’un user `emailVerified: false` → `403 EMAIL_NOT_VERIFIED`, aucune ligne créée.
3. Login : toast n’est plus le seul feedback — CTA « renvoyer l’email ».
