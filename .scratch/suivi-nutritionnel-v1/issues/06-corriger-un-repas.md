# 06: Corriger un Repas

**What to build:** Après l'analyse, je corrige un Repas si besoin : je modifie la quantité d'un Constituant (recalcul proportionnel sans appel à l'IA), j'ajoute ou supprime un Constituant, j'ajoute une précision et je relance l'analyse, je change la date, l'heure ou le Type de repas, ou je supprime le Repas. Les jauges suivent.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Modifier une quantité en g/ml ou en mesure de cuisine ; nutriments recalculés proportionnellement par le noyau métier.
- [ ] Ajouter / supprimer un Constituant ; totaux recalculés.
- [ ] Précision en texte + relance : les Constituants et le Commentaire sont régénérés.
- [ ] Une simple modification de quantité ne régénère pas le Commentaire.
- [ ] Changement de date/heure (rattachement à la bonne Journée) et du Type de repas.
- [ ] Suppression d'un Repas ; jauges et totaux recalculés.
- [ ] Tests unitaires du recalcul proportionnel ; test backend de la relance.
