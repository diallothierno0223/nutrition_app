# 07: Plats réutilisables

**What to build:** J'enregistre un Repas comme Plat en un geste, puis je le réutilise avec un Coefficient de portion (×0,5, ×1,5…). Réutiliser un Plat copie ses Constituants dans un nouveau Repas : modifier le Plat ensuite ne change jamais mes Repas passés. Je gère ma liste de Plats.

**Blocked by:** 02

**Status:** done

- [x] « Enregistrer comme Plat » depuis un Repas.
- [x] Réutiliser un Plat avec Coefficient de portion ; les Constituants copiés sont multipliés (noyau métier).
- [x] Ajout d'une précision possible lors de la réutilisation (relance de l'analyse sur la base du Plat).
- [x] Modifier ou supprimer un Plat sans effet sur les Repas existants (testé).
- [x] Réutiliser un Plat n'appelle pas l'IA (sauf précision ajoutée).

## Avancement

Fait (non vérifié sur le téléphone). « Enregistrer comme Plat » sur la fiche d'un Repas analysé. Les Plats apparaissent en tête de la Saisie rapide ; un Plat s'ouvre pour choisir le Coefficient de portion (×0,5 à ×2), ajouter une précision facultative et enregistrer le Repas. Sans précision, le Repas est créé déjà analysé, sans Commentaire ni appel à l'IA ; avec une précision, l'analyse est relancée sur la base des Constituants copiés (que l'IA reçoit désormais à chaque relance). Le Plat se renomme, se supprime et ses Constituants se corrigent comme ceux d'un Repas.
