# 20: Export des données

**What to build:** Depuis les réglages, j'exporte toutes mes données dans un ZIP de CSV que j'enregistre via le partage Android. Une notification mensuelle me rappelle de le faire.

**Blocked by:** 16

**Status:** done

- [x] Vérifier et documenter les sauvegardes disponibles sur l'offre gratuite de Supabase.
- [x] Export ZIP : un CSV par table (photos exclues, listées par lien).
- [x] Partage Android (enregistrer sur le téléphone, Drive…).
- [x] Rappel mensuel par notification locale, désactivable.

## Avancement

- Sauvegardes Supabase gratuites : aucune (ni base ni Storage), documenté dans `docs/sauvegardes.md`.
- Réglages › Données › « Exporter mes données » : un CSV par table (séparateur `;`, UTF-8 avec BOM), un `LISEZMOI.txt`, et `photos.csv` qui liste les photos avec un lien valable 7 jours. ZIP construit dans le cache puis feuille de partage Android (`expo-sharing`, `fflate`).
- Liste des tables dans le noyau (`TABLES_EXPORTEES`) ; un test backend vérifie qu'elle couvre toutes les tables des migrations et que la RLS isole les comptes.
- Rappel mensuel : notification « export », le 1er du mois à 10 h, réglable et désactivable dans Réglages › Notifications ; la toucher ouvre Réglages › Données.
- Nécessite une nouvelle build (`expo-sharing`).
