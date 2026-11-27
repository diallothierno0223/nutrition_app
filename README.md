# Suivi nutritionnel anti-cholestérol

Application Android personnelle de suivi nutritionnel. Vocabulaire : [GLOSSARY.md](GLOSSARY.md). Décisions : [docs/adr/](docs/adr/). Spec et tickets : [.scratch/suivi-nutritionnel-v1/](.scratch/suivi-nutritionnel-v1/).

## Organisation du repo

| Dossier | Contenu |
|---|---|
| `noyau/` | Noyau métier : TypeScript pur, sans I/O, partagé entre l'app et les Edge Functions. Les imports internes portent l'extension `.ts` (compatibilité Deno). |
| `supabase/` | Backend : migrations SQL, Edge Functions, configuration locale. |
| `app/` | App mobile Expo + TypeScript (Expo Router). Importe le noyau via l'alias `@noyau`. |
| `tests/backend/` | Tests d'intégration contre le Supabase local. |

## Prérequis

- Node.js (LTS ou plus récent) et Docker Desktop démarré.
- `npm install` à la racine et dans `app/`.

## Tests

Trois suites, une par frontière de test de la spec :

```powershell
npm run test:noyau
```

```powershell
npm run test:synchro
```

```powershell
npm run test:backend
```

`test:backend` demande le Supabase local et ses Edge Functions :

```powershell
npx supabase start
```

```powershell
npx supabase functions serve
```

`npm test` lance les trois suites, et `npm run typecheck` vérifie les types (dans `app/`, `npx tsc --noEmit`).

## Backend local

- `npx supabase migration up` applique les nouvelles migrations en gardant les données. `npx supabase db reset` repart de zéro (**efface aussi ton compte**).
- Les inscriptions publiques sont fermées : le compte unique se crée depuis Supabase Studio (http://127.0.0.1:54323, Authentication → Add user) ou, en production, depuis le tableau de bord Supabase.
- Les Edge Functions lisent `supabase/functions/.env` (copier `supabase/functions/.env.example`).

## IA

Toutes les demandes à l'IA passent par le port IA des Edge Functions (`supabase/functions/_shared/ia.ts`) :

- `IA_MODE=factice` : réponses prédéfinies, utilisées par les tests et pour développer sans clé.
- `IA_MODE=gemini` : API Gemini, avec `GEMINI_API_KEY` (clé Google AI Studio) et `GEMINI_MODELE` (défaut `gemini-3.8-flash`). En production : `npx supabase secrets set IA_MODE=gemini GEMINI_API_KEY=...`.

La clé n'existe que côté serveur, jamais dans l'app. Chaque réponse de l'IA est validée par le noyau métier avant d'être enregistrée.

## Rendez-vous du samedi automatique

`pg_cron` appelle `generer-rendez-vous` chaque heure du vendredi 16 h au samedi 18 h (UTC, ce qui couvre tous les fuseaux) ; la fonction génère le Rendez-vous de chaque compte à partir de 6 h le samedi dans le fuseau de son Profil, une seule fois par semaine. En production, donner à la base l'adresse du projet et la clé de service (une fois, dans l'éditeur SQL de Supabase). `cle_service` doit être exactement la clé `service_role` que reçoivent les Edge Functions (`SUPABASE_SERVICE_ROLE_KEY`) :

```sql
select vault.create_secret('https://<projet>.supabase.co', 'url_projet');
select vault.create_secret('<clé service_role>', 'cle_service');
```

Sans ces secrets (en local), le traitement automatique ne fait rien ; l'app génère alors le Rendez-vous à l'ouverture de l'onglet Samedi.

## App mobile

1. Copier `app/.env.example` en `app/.env.local` et renseigner l'URL Supabase (IP du PC sur le Wi-Fi en local) et la clé `ANON_KEY` de `npx supabase status`.
2. Construire une fois l'APK de développement dans le cloud Expo (compte Expo requis) :

   ```powershell
   cd app; npx eas-cli build --profile development --platform android
   ```

3. Installer l'APK sur le téléphone, puis lancer le serveur de développement :

   ```powershell
   cd app; npx expo start --dev-client
   ```

Une nouvelle build n'est nécessaire que lorsqu'un module natif est ajouté (Health Connect, notifications…).
