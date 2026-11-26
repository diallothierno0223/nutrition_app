# 12: Rendez-vous du samedi, génération à la demande

**What to build:** Je lance la génération du Rendez-vous du samedi et j'obtiens un Bilan de la semaine sur la Période d'analyse, 3 Recettes de cuisine africaine pour 10 portions de déjeuners et dîners, et des petits-déjeuners (1 Recette de Petit-déjeuner nomade pour 3 portions + 2 idées rapides pour les 4 autres matins). Le tout est enregistré directement, consultable, et je peux en demander une nouvelle génération.

**Blocked by:** 07, 10, 11

**Status:** ready-for-agent

- [ ] Noyau métier : Période d'analyse = les 7 Journées précédant le samedi.
- [ ] `generer-rendez-vous` envoie les totaux de la Période d'analyse, les Objectifs, les Règles actives et les Recettes des 3 dernières semaines ; écrit le tout en une transaction.
- [ ] Chaque Recette : ingrédients, étapes courtes, nutriments par portion, nombre de portions, conservation, ordre de consommation conseillé.
- [ ] Règle de variété : pas de Recette des 3 dernières semaines sauf celles marquées « à refaire » ; bouton « à refaire » sur chaque Recette.
- [ ] Nombres réglables : Recettes, portions, Petits-déjeuners nomades, petits-déjeuners rapides.
- [ ] Nouvelle génération forcée possible ; historique des Rendez-vous passés consultable.
- [ ] Tests backend avec l'IA factice : contenu écrit, une génération forcée remplace celle de la semaine.
