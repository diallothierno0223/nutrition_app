# Supabase plutôt que Google Sheets comme base de données et backend

L'idée de départ stockait les données dans Google Sheets et les photos dans Google Drive. Nous avons choisi Supabase (Postgres, Storage, Edge Functions, pg_cron, Auth) parce que le modèle est relationnel (Repas → Constituants, Plats réutilisables, Pesées) et qu'il faut de toute façon un serveur pour cacher la clé Gemini et lancer le traitement du samedi. Supabase réunit tout cela gratuitement pour un seul utilisateur, alors que Sheets n'offre ni contraintes, ni transactions, ni requêtes relationnelles, et impose une authentification OAuth Google depuis l'app.

## Conséquences

- Les données ne sont plus lisibles dans un tableur. Un export CSV/Sheets pourra être ajouté si besoin.
- Un projet Supabase gratuit se met en pause après 7 jours sans activité, ce qui est sans effet avec un usage quotidien.
