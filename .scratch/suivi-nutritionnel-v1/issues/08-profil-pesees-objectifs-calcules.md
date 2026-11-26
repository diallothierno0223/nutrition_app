# 08: Profil, Pesées et Objectifs calculés

**What to build:** Je renseigne mon Profil et mon Objectif de poids, j'enregistre des Pesées, et l'app me propose des Objectifs journaliers calculés par formule. Ils ne s'appliquent qu'après ma validation explicite. Quand mon Profil change, l'app me propose un recalcul. Je vois ma courbe de poids.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Profil : taille, âge, sexe, niveau d'activité, fuseau horaire ; poids = dernière Pesée.
- [ ] Objectif de poids : texte libre, variation chiffrée et échéance.
- [ ] Pesées datées (ajout, suppression) et courbe de poids sur le Dashboard.
- [ ] Noyau métier : Mifflin-St Jeor × niveau d'activité + ajustement de l'Objectif de poids (+2 kg en 6 mois ≈ +85 kcal/j) ; macros, AGS, Fibres, Sel selon les repères de la spec ; Objectif hebdomadaire = ×7.
- [ ] Les Objectifs proposés ne remplacent les actuels qu'après validation (ADR 0003, exception).
- [ ] Proposition de recalcul après changement du Profil ou de l'Objectif de poids.
- [ ] Tests unitaires du calcul.
