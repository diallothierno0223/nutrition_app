# Cache local SQLite avec file d'envoi, pas d'architecture hors ligne d'abord

L'app garde dans `expo-sqlite` une copie en lecture des données du quotidien (Liste de courses, Recettes, Plats, Objectifs, Profil, Règles du médecin actives, Repas et Hydratation des 7 derniers jours, Réglages), plus une file d'envoi des actions faites hors ligne. Supabase reste la seule source de vérité. Nous avons écarté une architecture hors ligne d'abord, avec synchronisation dans les deux sens : avec un seul utilisateur sur un seul téléphone, il n'y a pas de vrai conflit, et la dernière écriture l'emporte.

## Conséquences

- Hors ligne, seules certaines actions sont permises : cocher une course, ajouter de l'eau, enregistrer un Repas à partir d'un Plat, saisir un Repas en attente. Les Objectifs, le Profil et les Règles du médecin ne se modifient qu'en ligne.
- Les jauges du jour en cours sont calculées en local quand il n'y a pas de réseau. Les vues SQL du serveur restent la référence et remplacent ces valeurs au retour du réseau.
