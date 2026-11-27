# 25: Maintien en activité du projet Supabase

**What to build:** Le projet Supabase gratuit n'est jamais mis en pause, même si je n'ouvre pas l'app pendant plus d'une semaine (vacances, téléphone perdu…). Une requête automatique, une fois par jour, suffit à le garder actif.

**Blocked by:** 31 (le vrai projet Supabase doit exister).

**Status:** needs-triage

Contexte (`docs/sauvegardes.md`) : un projet gratuit est mis en pause après une semaine sans activité. Les tâches `pg_cron` internes (génération du samedi) ne comptent probablement pas comme activité : Supabase mesure les requêtes reçues par l'API.

- [ ] Vérifier dans la documentation Supabase ce qui compte comme « activité » (requête REST ? Edge Function ? connexion à la base ?).
- [ ] Une tâche planifiée hors de Supabase, une fois par jour : workflow GitHub Actions (`schedule`) sur le dépôt, qui fait une lecture simple via l'API REST.
- [ ] Clé utilisée : la clé publique (anon) et une lecture autorisée sans compte (ex. une fonction `ping()` dédiée qui ne renvoie rien de personnel). Jamais la clé service dans le dépôt : secrets GitHub uniquement.
- [ ] Le workflow échoue visiblement (e-mail GitHub) si le projet ne répond pas.
- [ ] Documenter dans le README et `docs/sauvegardes.md`.
