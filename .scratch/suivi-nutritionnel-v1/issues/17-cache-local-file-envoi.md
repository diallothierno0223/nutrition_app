# 17: Cache local et file d'envoi

**What to build:** L'app s'ouvre instantanément et reste utilisable sans réseau (ADR 0002). Au marché, je consulte et coche ma Liste de courses hors ligne. J'ajoute de l'eau et j'enregistre un Repas à partir d'un Plat sans réseau, et mes jauges du jour sont calculées en local avec l'heure de la dernière synchro. Tout est rejoué dans l'ordre au retour du réseau.

**Blocked by:** 04, 13, 14

**Status:** done

- [x] Cache `expo-sqlite` : Liste de courses, Recettes, Plats, Objectifs, Profil, Règles actives, Repas et Hydratation des 7 derniers jours, Réglages ; rafraîchi à l'ouverture et après chaque écriture.
- [x] File d'envoi pour : cocher/décocher et ajouter une course, ajouter de l'eau, enregistrer un Repas depuis un Plat.
- [x] Rejeu ordonné au retour du réseau ; la dernière écriture l'emporte.
- [x] Jauges du jour calculées en local hors ligne avec « dernière synchro à HH:MM » ; Semaine et moyenne affichent leur dernière valeur synchronisée.
- [x] Modification des Objectifs, du Profil et des Règles refusée hors ligne, avec un message clair.
- [x] La notification du soir utilise les données locales.
- [x] Tests de synchronisation (SQLite en mémoire + faux Supabase) : mise en file, rejeu ordonné, jauges locales.
- [ ] Vérifier sur le téléphone, en mode avion : Liste de courses, eau, Repas depuis un Plat, jauges, bandeau « Hors ligne », rejeu au retour du réseau. *(non testé : backend local uniquement)*

## Avancement

- Cache `expo-sqlite` (`app/src/synchro/cache-local.ts`) : la dernière réponse de chaque lecture (table `lectures`, clé → JSON), plutôt qu'une copie table par table ; préchargé à l'ouverture (`prechargement.ts`) : Liste de courses, Recettes, Plats et leurs Constituants, Objectifs, Profil, Règles, Réglages, Repas, eau et totaux des 7 derniers jours, Semaine et moyennes. Chaque lecture réussie le met à jour.
- Lecture : serveur d'abord ; sans réseau, ou au-delà de 3 s, la valeur en cache (la réponse tardive met le cache à jour).
- File d'envoi (`envois.ts`, `rejeu.ts`, `executer.ts`) : cocher/décocher et ajouter une course, ajouter de l'eau (et annuler un ajout encore en file), Repas depuis un Plat (précision comprise). Identifiants choisis par le téléphone (`expo-crypto`) et insertions « ignorer si déjà là » : un rejeu ne crée jamais de doublon (migration `20261130090000_envois_rejouables.sql`, tests backend).
- Rejeu dans l'ordre à l'ouverture, au retour au premier plan et toutes les 30 s tant que la file n'est pas vide (pas de module réseau natif) ; arrêt au premier échec réseau ; refus du serveur retentés avec un délai croissant (30 s → 1 h) ; seules les cases cochées et les articles sont abandonnés après 5 refus.
- Affichage : les envois en file s'ajoutent aux valeurs en cache (`projection.ts`, testée) : eau, jauges (Repas depuis un Plat comptés), coches, articles, Repas du Journal. Bandeau « Hors ligne · dernière synchro à HH:MM · N action(s) en attente d'envoi » sur le Dashboard.
- Objectifs, Profil, Pesées et Règles : modification refusée hors ligne avec un message clair (`refuserHorsLigne`).
- Notification du soir : calculée à partir des mêmes lectures (cache + file), reprogrammée après chaque rejeu.
- Le cache appartient au compte connecté : il est vidé si un autre compte se connecte.
- Tests : `file-d-envoi.test.ts` et `projection.test.ts` (SQLite en mémoire, exécution factice). `executer.ts` (appels Supabase réels) n'a pas de test unitaire : ses requêtes rejouées sont couvertes par `tests/backend/envois-rejoues.test.ts` et `plats.test.ts`.
- Reste connu : entre l'envoi d'un ajout d'eau et son retrait de la file, l'eau peut être comptée deux fois quelques instants (corrigé au rechargement qui suit le rejeu).
