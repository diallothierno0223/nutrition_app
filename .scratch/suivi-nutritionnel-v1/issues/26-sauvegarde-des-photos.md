# 26: Sauvegarde des photos des Repas

**What to build:** Les photos de mes Repas ont une copie hors de Supabase, pour ne pas les perdre si le projet est supprimé ou corrompu.

**Blocked by:** 20

**Status:** done

Contexte : les photos sont dans le bucket privé `photos-repas` du Storage Supabase (1 600 px, JPEG, environ 200 à 400 Ko chacune ; 1 Go inclus dans l'offre gratuite, soit quelques milliers de photos). Le Storage n'est couvert par aucune sauvegarde Supabase, et l'Export (ticket 20) ne contient que des liens valables 7 jours.

Pistes, à trancher avec l'utilisateur :

1. **Photos dans l'Export** (le plus simple) : option « Inclure les photos » ; l'app les télécharge et les ajoute au ZIP, dans un dossier `photos/`. Aucun service en plus ; le ZIP grossit (et le téléphone doit le construire en mémoire : prévoir un export par lots ou par période si besoin).
2. **Dossier Google Drive** : chaque photo est aussi copiée dans un dossier Drive. Demande l'accès Google (OAuth) et une synchronisation à gérer (échecs, suppressions).
3. **Autre stockage (Vercel Blob, R2…)** : un second service à payer ou surveiller, sans sauvegarde garantie non plus ; n'apporte rien de plus que la piste 1 pour un usage personnel.

- [x] Choisir la piste.
- [x] Définir le comportement quand une photo est supprimée dans l'app.
- [x] Mettre à jour `docs/sauvegardes.md`.

## Avancement

- Piste 1 retenue : interrupteur « Inclure les photos » (activé par défaut) dans Réglages › Données ; les photos vont dans `photos/<Journée>_<Repas>.jpg`, et `photos.csv` indique le fichier de chacune en plus de son lien.
- ZIP écrit en flux dans le fichier (une seule photo en mémoire), JPEG stockés sans recompression ; progression « Photos : x sur y ».
- Une photo isolée qui échoue est signalée à l'écran (colonne `fichier` vide) ; trois échecs de suite arrêtent l'export (connexion perdue). Les anciens exports sont retirés du cache.
- Photo supprimée dans l'app : elle disparaît des exports suivants, les ZIP déjà enregistrés la gardent (documenté dans `docs/sauvegardes.md`).
- Pas d'export par lots ou par période : le flux règle la mémoire ; à reconsidérer si la durée ou la taille deviennent gênantes.
