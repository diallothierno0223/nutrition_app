# 03: Jauges du jour

**What to build:** Je saisis à la main mes Objectifs journaliers et je vois sur le Dashboard les 7 jauges du jour, avec leur état selon le sens de chaque nutriment : Plafond (AGS, Sel), Cible (Protéines, Fibres), Plage (Calories, Glucides, Lipides).

**Blocked by:** 02

**Status:** ready-for-agent

- [x] Objectifs journaliers modifiables à la main (seule source des seuils chiffrés).
- [x] Vue SQL des totaux du jour par nutriment.
- [x] Noyau métier : état d'une jauge. Plafond orange à 80 %, rouge au-delà de 100 % ; Plage en alerte hors ±10 %, au-dessus comme en dessous ; Cible sans alerte en journée.
- [ ] Les jauges se mettent à jour après l'enregistrement d'un Repas. *(implémenté : rechargement à chaque retour sur le Dashboard ; à vérifier sur le téléphone)*
- [x] Tests unitaires des seuils (79 %, 80 %, 100 %, 101 %, bords de Plage).
- [x] `analyser-repas` transmet à l'IA ce qui reste dans les Objectifs du jour, pour que le Commentaire du repas en tienne compte (repris du ticket 02).
- [x] Les totaux du jour du Dashboard viennent de la vue SQL (aujourd'hui calculés dans l'app) ; les Repas en attente restent exclus.

## Avancement

- **États des jauges :** `normal`, `approche`, `depasse`, `en_dessous` (Plage sous 90 %, couleur à part), `sans_objectif` (champ laissé vide). Un nutriment sans Objectif n'a pas de jauge colorée.
- **Objectifs restants :** ce qui reste du jour **sans compter le Repas analysé** (les totaux de la vue SQL, moins ce Repas s'il est relancé), quelle que soit l'heure des autres Repas de la Journée.
- **Hors ligne :** les totaux du jour viennent du serveur ; leur calcul local sans réseau viendra avec le cache (ticket 17).
- L'objectif d'Hydratation arrive au ticket 04 ; le Profil (et le titre « Objectifs & Profil ») au ticket 08.
