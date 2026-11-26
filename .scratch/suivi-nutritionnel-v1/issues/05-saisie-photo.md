# 05: Saisie d'un Repas par photo (+ note)

**What to build:** Je prends en photo mon assiette, en ajoutant éventuellement une note (huile, cuisson, sauce). L'IA analyse la photo et la note, et le Repas est enregistré comme pour une saisie texte. La photo reste visible dans le Repas.

**Blocked by:** 02

**Status:** done

- [x] Prise de photo ou choix dans la galerie.
- [x] Compression sur le téléphone (environ 1600 px) avant envoi dans un bucket privé.
- [x] `analyser-repas` lit la photo côté serveur et l'envoie à l'IA avec la note.
- [x] Les photos sont conservées et visibles depuis le Repas.
- [x] Le bucket n'est pas lisible sans session (testé).

## Avancement

Fait (non vérifié sur le téléphone ; demande une nouvelle build EAS, à cause de la caméra et de la compression d'image). La Note est stockée dans la description du Repas, qui devient facultative quand il y a une photo. Les photos vont dans le bucket privé `photos-repas`, sous le dossier de l'utilisateur. Une photo déposée dont le Repas n'a pas pu être enregistré est retirée. La photo est relue à chaque relance d'analyse. La saisie photo hors ligne (Repas en attente) viendra avec la file d'envoi (ticket 17).
