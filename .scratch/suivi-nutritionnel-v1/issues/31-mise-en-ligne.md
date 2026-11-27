# 31: Mise en ligne (Supabase et build autonome)

**What to build:** L'app fonctionne au quotidien sans mon PC : la base, les Edge Functions et l'IA tournent sur Supabase en ligne, et j'installe une APK autonome.

**Blocked by:** 27

**Status:** ready-for-human (comptes et mots de passe à créer par l'utilisateur), puis ready-for-agent

Étapes réservées à l'utilisateur : créer le projet Supabase (offre gratuite, région Europe), créer la clé OpenRouter, créer son compte dans l'app. L'agent fait le reste et dit exactement quoi saisir.

- [ ] Projet Supabase créé ; `supabase link`, puis `supabase db push` (toutes les migrations, jamais `db reset`).
- [ ] Edge Functions déployées (`supabase functions deploy`) ; vérifier que le noyau métier, importé hors de `supabase/`, est bien embarqué (case restée ouverte au ticket 02).
- [ ] Secrets des Edge Functions : `IA_MODE=openrouter`, clé OpenRouter, listes de modèles ; jamais dans Git.
- [ ] Génération automatique du samedi : secrets Vault `url_projet` et `cle_service` (README), puis vérifier un déclenchement de `pg_cron`.
- [ ] Auth : inscriptions fermées une fois le compte créé (un seul utilisateur).
- [ ] App : profil EAS `preview` (APK autonome) avec l'URL et la clé publique du projet en variables d'environnement EAS ; build et installation.
- [ ] Recette sur le téléphone : saisie texte et photo, Plat, eau, notifications, Health Connect, Rendez-vous, Liste de courses, export, mode avion (tickets 17 et 18), en clair et en sombre.
- [ ] Mettre à jour le README (procédure de mise en ligne) et cocher les cases restées ouvertes des tickets 02, 03, 08, 17, 18, 21a et 21b.
