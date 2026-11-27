# 11: Semaine et moyenne globale

**What to build:** Sur le Dashboard, je vois le récapitulatif de la Semaine (lundi–dimanche) face à l'Objectif hebdomadaire, avec un mini-graphique par jour, et la moyenne globale par Journée sur la période choisie.

**Blocked by:** 03

**Status:** done

- [x] Vue SQL des totaux de la Semaine en cours ; comparaison à l'Objectif hebdomadaire (×7).
- [x] Mini-graphique par jour.
- [x] Moyenne globale calculée uniquement sur les Journées avec au moins un Repas ; période 30 j (défaut), 90 j, tout.
- [x] Tests : semaine à cheval sur deux mois, changement d'heure, Journée sans Repas exclue de la moyenne.

## Avancement

Fait (non vérifié sur le téléphone). Sur le Dashboard, sous l'eau : la Semaine en cours (jauges face à l'Objectif hebdomadaire, vue SQL `totaux_de_la_semaine`), un mini-graphique jour par jour du nutriment choisi avec l'Objectif journalier en trait de repère, et la moyenne par Journée (30 jours, 90 jours ou tout) sur les seules Journées renseignées. Semaine et période sont calculées par le noyau sur les dates de Journée, donc sans effet des changements d'heure.
