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

- `npx supabase db reset` réapplique toutes les migrations.
- Les inscriptions publiques sont fermées : le compte unique se crée depuis Supabase Studio (http://127.0.0.1:54323, Authentication → Add user) ou, en production, depuis le tableau de bord Supabase.

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
