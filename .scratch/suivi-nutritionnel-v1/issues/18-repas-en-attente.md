# 18: Repas en attente

**What to build:** Sans réseau, je saisis quand même un Repas en texte ou en photo. Il devient un Repas en attente, non compté dans les jauges, puis il est analysé et enregistré automatiquement dès que le réseau revient, sans action de ma part.

**Blocked by:** 05, 17

**Status:** ready-for-agent

- [ ] Saisie texte ou photo hors ligne stockée localement comme Repas en attente (photo comprise).
- [ ] Les Repas en attente sont visibles dans le Journal avec un statut clair et exclus des jauges.
- [ ] Au retour du réseau : envoi de la photo, création du Repas, appel à `analyser-repas`, mise à jour des jauges et de la notification du soir.
- [ ] Un échec d'analyse laisse le Repas en attente et réessaie plus tard.
- [ ] Tests de synchronisation : Repas en attente exclu des jauges puis analysé au retour du réseau.
