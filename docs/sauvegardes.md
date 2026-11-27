# Sauvegardes

Vérifié le 27 novembre 2026 sur la [page des tarifs](https://supabase.com/pricing) et la
[documentation des sauvegardes](https://supabase.com/docs/guides/platform/backups) de Supabase.

## Ce que fait Supabase sur l'offre gratuite

- **Aucune sauvegarde automatique.** Les sauvegardes quotidiennes sont réservées aux offres payantes (7 jours de
  rétention en Pro, 14 en Team). Pas de restauration à un instant donné (PITR, option payante).
- **Les fichiers Storage ne sont jamais dans les sauvegardes**, quelle que soit l'offre : les photos des Repas
  (bucket `photos-repas`) ne sont couvertes par rien.
- **Un projet gratuit est mis en pause après une semaine sans activité.** L'usage quotidien de l'app suffit à
  l'éviter.
- La documentation recommande aux projets gratuits d'exporter régulièrement leurs données (`supabase db dump`) et
  d'en garder une copie ailleurs.

## Ce que fait l'app

- **Réglages › Données › Exporter mes données** : un ZIP avec un CSV par table (séparateur `;`, UTF-8), enregistré
  via la feuille de partage Android (téléphone, Drive…). Les photos n'y sont pas copiées : `photos.csv` donne pour
  chacune un lien de téléchargement valable 7 jours.
- **Rappel mensuel** : une notification locale le 1er de chaque mois (10 h par défaut), réglable et désactivable dans
  Réglages › Notifications.

## Copie complète, depuis le PC

Pour une copie restaurable de la base (schéma et données), en plus de l'export de l'app :

```powershell
npx supabase db dump --linked -f sauvegarde-schema.sql
npx supabase db dump --linked --data-only -f sauvegarde-donnees.sql
```
