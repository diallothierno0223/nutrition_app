# 18: Repas en attente

**What to build:** Sans réseau, je saisis quand même un Repas en texte ou en photo. Il devient un Repas en attente, non compté dans les jauges, puis il est analysé et enregistré automatiquement dès que le réseau revient, sans action de ma part.

**Blocked by:** 05, 17

**Status:** done

- [x] Saisie texte ou photo hors ligne stockée localement comme Repas en attente (photo comprise).
- [x] Les Repas en attente sont visibles dans le Journal avec un statut clair et exclus des jauges.
- [x] Au retour du réseau : envoi de la photo, création du Repas, appel à `analyser-repas`, mise à jour des jauges et de la notification du soir.
- [x] Un échec d'analyse laisse le Repas en attente et réessaie plus tard.
- [x] Tests de synchronisation : Repas en attente exclu des jauges puis analysé au retour du réseau.
- [ ] Vérifier sur le téléphone, en mode avion : saisie texte et photo, Journal, retour du réseau. *(non testé : backend local uniquement)*

## Avancement

- `saisirRepas` : sans réseau, la photo est compressée et gardée dans les documents de l'app, le Repas part dans la file d'envoi (`repas_en_attente`). Si le réseau lâche entre l'enregistrement et l'analyse, l'analyse est mise en file.
- Journal et fiche : le Repas en attente est affiché (« en attente de réseau »), photo locale comprise, non compté dans les jauges ; la fiche se recharge quand il est envoyé.
- Au retour du réseau : dépôt de la photo, création du Repas (même identifiant), appel à `analyser-repas`, puis rechargement des jauges et de la notification du soir ; la photo locale est supprimée.
- Échec d'analyse : le Repas reste en attente et l'analyse est retentée (délai croissant), puis abandonnée après 10 échecs, le Repas restant en attente avec sa relance manuelle. Supprimer le Repas retire aussi son envoi de la file.
