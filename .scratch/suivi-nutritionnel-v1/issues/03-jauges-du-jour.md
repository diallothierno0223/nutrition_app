# 03: Jauges du jour

**What to build:** Je saisis à la main mes Objectifs journaliers et je vois sur le Dashboard les 7 jauges du jour, avec leur état selon le sens de chaque nutriment : Plafond (AGS, Sel), Cible (Protéines, Fibres), Plage (Calories, Glucides, Lipides).

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Objectifs journaliers modifiables à la main (seule source des seuils chiffrés).
- [ ] Vue SQL des totaux du jour par nutriment.
- [ ] Noyau métier : état d'une jauge. Plafond orange à 80 %, rouge au-delà de 100 % ; Plage en alerte hors ±10 %, au-dessus comme en dessous ; Cible sans alerte en journée.
- [ ] Les jauges se mettent à jour après l'enregistrement d'un Repas.
- [ ] Tests unitaires des seuils (79 %, 80 %, 100 %, 101 %, bords de Plage).
