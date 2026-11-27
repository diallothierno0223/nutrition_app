# 12: Rendez-vous du samedi, génération à la demande

**What to build:** Je lance la génération du Rendez-vous du samedi et j'obtiens un Bilan de la semaine sur la Période d'analyse, 3 Recettes de cuisine africaine pour 10 portions de déjeuners et dîners, et des petits-déjeuners (1 Recette de Petit-déjeuner nomade pour 3 portions + 2 idées rapides pour les 4 autres matins). Le tout est enregistré directement, consultable, et je peux en demander une nouvelle génération.

**Blocked by:** 07, 10, 11

**Status:** done

- [x] Noyau métier : Période d'analyse = les 7 Journées précédant le samedi.
- [x] `generer-rendez-vous` envoie les totaux de la Période d'analyse, les Objectifs, les Règles actives et les Recettes des 3 dernières semaines ; écrit le tout en une transaction.
- [x] Chaque Recette : ingrédients, étapes courtes, nutriments par portion, nombre de portions, conservation, ordre de consommation conseillé.
- [x] Règle de variété : pas de Recette des 3 dernières semaines sauf celles marquées « à refaire » ; bouton « à refaire » sur chaque Recette.
- [x] Nombres réglables : Recettes, portions, Petits-déjeuners nomades, petits-déjeuners rapides.
- [x] Nouvelle génération forcée possible ; historique des Rendez-vous passés consultable.
- [x] Tests backend avec l'IA factice : contenu écrit, une génération forcée remplace celle de la semaine.

## Avancement

Fait (non vérifié sur le téléphone ; Gemini réel non testé). Onglet Samedi : « Préparer mon Rendez-vous » (idempotent), « Nouvelle génération » (forcée, même Rendez-vous, Recettes remplacées), Bilan, Recettes par catégorie (dépliables : nutriments par portion calculés par le noyau depuis les ingrédients, ingrédients, étapes, conservation, ordre conseillé), « à refaire », historique des Rendez-vous passés et Réglages du samedi. Le samedi de référence est le samedi même à partir de 6 h (heure locale), sinon le précédent. La règle de variété ne porte que sur les Recettes de déjeuners et dîners : les petits-déjeuners peuvent revenir. Le Rendez-vous n'est écrit que par l'Edge Function (rôle de service, `ecrire_rendez_vous`) ; l'utilisateur ne peut modifier que « à refaire ».
