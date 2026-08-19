# Cookies, traceurs et consentement

Document d’argumentaire RNCP (Bloc 2 : RGPD / mentions légales).  
Complète le ticket [NIR-97](https://linear.app/nirbyfr/issue/NIR-97/add-cookie-consent-banner) / GitHub [#198](https://github.com/brissboss/Nirby/issues/198).

UI : bandeau modal (`CookieConsent`) + bouton « Gérer les cookies » dans `ProfilePrivacyView`.  
Le choix (et sa date) est stocké dans `localStorage` sous `nirby.cookie-consent`.  
La classification ci-dessous est celle que le jury interrogera, plus que le composant.

Le droit à la portabilité est décrit dans [gdpr-data-export.md](./gdpr-data-export.md) ; l’effacement dans [gdpr-account-deletion.md](./gdpr-account-deletion.md).

---

## 1. Cadre

Le RGPD et la directive ePrivacy (reprise en droit français) distinguent :

- les traceurs **strictement nécessaires** au service demandé (pas de consentement préalable) ;
- les traceurs **non nécessaires** (mesure d’audience, télémétrie, publicité) — consentement libre, éclairé, spécifique, et révocable.

Nirby n’a **pas** de mesure d’audience (pas de GA, Matomo, etc.). Le seul traceur optionnel côté navigateur est **Sentry client**.

---

## 2. Strictement nécessaires (pas de consentement)

| Nom            | Type                         | Finalité                                        | Durée / attributs                                         |
| -------------- | ---------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| `refreshToken` | Cookie httpOnly              | Session authentifiée (renouvellement JWT)       | TTL refresh, `Secure` (prod), `SameSite=strict`, `path=/` |
| `NEXT_LOCALE`  | Cookie                       | Langue de l’interface (`fr` / `en`)             | 1 an, `SameSite=lax`, `path=/`                            |
| `theme`        | localStorage (`next-themes`) | Préférence d’affichage clair / sombre / système | Persistant ; **pas un traceur**                           |

**Mapbox GL** charge des tuiles et un style depuis `*.mapbox.com`. C’est indispensable au produit (carte de POI) : le refuser casserait l’application. Il n’est **pas** soumis au bandeau.

**Google Places** est appelé **uniquement via l’API Nirby** (`POST /google-place/search`, photos proxifiées). Le navigateur ne dépose pas de cookie Google pour la recherche.

---

## 3. Optionnel (consentement requis)

| Nom                 | Type                     | Finalité                                       |
| ------------------- | ------------------------ | ---------------------------------------------- |
| Sentry (SDK client) | Script + stockage Sentry | Télémétrie d’erreurs (`tracesSampleRate: 0.1`) |

- `Sentry.init` n’est appelé que si `sentry: true` dans `nirby.cookie-consent`.
- Points d’entrée : `sentry.client.config.ts`, `instrumentation-client.ts`, et après un choix dans le bandeau (`applySentryConsent`).
- Un refus (ou une révocation) n’initialise pas le SDK ; `Sentry.close()` est appelé si le client était déjà actif.
- Sentry **serveur / edge** n’écrit pas de cookie navigateur : inchangé (erreurs d’infrastructure).

En développement, `sentrySharedOptions.enabled` reste `false` même après consentement (pas de DSN / `NODE_ENV === development`).

---

## 4. Choix utilisateur

```json
{ "version": 1, "sentry": true, "decidedAt": "2026-08-14T15:00:00.000Z" }
```

- **Accepter** → `sentry: true` puis `Sentry.init` si autorisé.
- **Refuser** → `sentry: false`, pas d’init.
- **Personnaliser** → case Sentry ; les nécessaires restent toujours actifs.
- Le choix se modifie depuis Profil → Confidentialité.

---

## 5. Ce que ce n’est pas

Pas de CMP tierce, pas de gate Mapbox, pas de cookies publicitaires, pas de Sentry conditionné côté serveur.
