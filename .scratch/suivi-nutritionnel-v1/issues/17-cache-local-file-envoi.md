# 17: Cache local et file d'envoi

**What to build:** L'app s'ouvre instantanément et reste utilisable sans réseau (ADR 0002). Au marché, je consulte et coche ma Liste de courses hors ligne. J'ajoute de l'eau et j'enregistre un Repas à partir d'un Plat sans réseau, et mes jauges du jour sont calculées en local avec l'heure de la dernière synchro. Tout est rejoué dans l'ordre au retour du réseau.

**Blocked by:** 04, 13, 14

**Status:** ready-for-agent

- [ ] Cache `expo-sqlite` : Liste de courses, Recettes, Plats, Objectifs, Profil, Règles actives, Repas et Hydratation des 7 derniers jours, Réglages ; rafraîchi à l'ouverture et après chaque écriture.
- [ ] File d'envoi pour : cocher/décocher et ajouter une course, ajouter de l'eau, enregistrer un Repas depuis un Plat.
- [ ] Rejeu ordonné au retour du réseau ; la dernière écriture l'emporte.
- [ ] Jauges du jour calculées en local hors ligne avec « dernière synchro à HH:MM » ; Semaine et moyenne affichent leur dernière valeur synchronisée.
- [ ] Modification des Objectifs, du Profil et des Règles refusée hors ligne, avec un message clair.
- [ ] La notification du soir utilise les données locales.
- [ ] Tests de synchronisation (SQLite en mémoire + faux Supabase) : mise en file, rejeu ordonné, jauges locales.
