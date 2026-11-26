# 22: Ajout des Sucres (8e nutriment)

**What to build:** Les Sucres deviennent un nutriment suivi comme les autres : l'IA les estime pour chaque Constituant, ils ont un Objectif journalier et une jauge de Plafond sur le Dashboard. C'est un refactor préalable à l'estimation des Objectifs (ticket 08), pour l'Objectif personnel « réduire le sucre ».

**Blocked by:** 03

**Status:** done

- [x] Noyau métier : Sucres ajouté aux nutriments, sens Plafond, libellé « Sucres », unité g (tests mis à jour).
- [x] Base : colonne Sucres sur les Constituants et les Objectifs journaliers, et dans la vue des totaux du jour. Les Constituants existants reçoivent 0 (historique court, accepté).
- [x] Port IA : Sucres demandé dans le schéma JSON et validé par le noyau ; l'IA factice renvoie une valeur.
- [x] App : jauge Sucres sur le Dashboard, champ dans l'écran Objectifs, valeur dans le détail d'un Repas.  *(les écrans parcourent la liste des nutriments du noyau ; à vérifier sur le téléphone)*
- [x] Tests backend mis à jour (totaux du jour, Objectifs restants).

## Avancement

Fait. Les Constituants analysés avant l'ajout gardent 0 g de sucres ; une nouvelle ligne doit désormais fournir sa valeur (pas de défaut). Les lignes d'Objectifs restants envoyées à l'IA sont maintenant formulées sans accord (« Sucres : reste 45.9 g »).
