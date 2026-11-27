# 14: Plats de la semaine

**What to build:** Les Recettes et petits-déjeuners du dernier Rendez-vous apparaissent en tête de la saisie rapide comme Plats de la semaine (une portion chacun), pour enregistrer une portion de batch cooking en un geste. Je peux enregistrer une Recette comme Plat permanent.

**Blocked by:** 07, 12

**Status:** done

- [x] À chaque génération, un Plat d'une portion est créé par Recette et par petit-déjeuner (ingrédients ÷ nombre de portions).
- [x] Section « Plats de la semaine » en tête de la saisie rapide ; réutilisation avec Coefficient de portion.
- [x] Les Plats de la semaine précédente quittent la section à la génération suivante, sans effet sur les Repas passés.
- [x] « Enregistrer comme Plat permanent » depuis une Recette.

## Avancement

Fait (non vérifié sur le téléphone). Chaque génération crée, dans la même transaction, un Plat d'une portion par Recette et petit-déjeuner (ingrédients ÷ portions, calculés par le noyau) et retire ceux de la génération précédente ; les Repas déjà enregistrés et les Plats permanents ne changent pas. La Saisie rapide affiche « Plats de la semaine » au-dessus de « Mes Plats » ; chaque Recette dépliée propose « Enregistrer comme Plat permanent ». Une génération automatique qui trouve un Rendez-vous existant ne touche à rien.
