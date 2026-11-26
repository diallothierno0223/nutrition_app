# 05: Saisie d'un Repas par photo (+ note)

**What to build:** Je prends en photo mon assiette, en ajoutant éventuellement une note (huile, cuisson, sauce). L'IA analyse la photo et la note, et le Repas est enregistré comme pour une saisie texte. La photo reste visible dans le Repas.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Prise de photo ou choix dans la galerie.
- [ ] Compression sur le téléphone (environ 1600 px) avant envoi dans un bucket privé.
- [ ] `analyser-repas` lit la photo côté serveur et l'envoie à l'IA avec la note.
- [ ] Les photos sont conservées et visibles depuis le Repas.
- [ ] Le bucket n'est pas lisible sans session (testé).
