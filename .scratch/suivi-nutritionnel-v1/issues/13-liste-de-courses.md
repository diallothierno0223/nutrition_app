# 13: Liste de courses

**What to build:** À partir du Rendez-vous du samedi, j'ai une Liste de courses rangée par Recette (Recettes, puis Petits-déjeuners, puis Ajouts manuels), avec le total des ingrédients communs, des cases à cocher et des articles ajoutés à la main. Je choisis quelles Recettes inclure.

**Blocked by:** 12

**Status:** done

- [x] Sections par Recette ; un ingrédient commun reste dans chaque Recette avec sa case, et affiche son total (« oignon : 3 au total »).
- [x] Cocher / décocher ; ajouter des articles à la main.
- [x] Sélection des Recettes (toutes par défaut) ; recalcul qui conserve les cases cochées et les ajouts manuels.
- [x] Tests unitaires du noyau métier : ingrédient commun à 3 Recettes, désélection puis resélection.

## Avancement

Fait (non vérifié sur le téléphone). Bouton « Liste de courses » sur l'onglet Samedi : sélection des Recettes à inclure (toutes par défaut), sections par Recette puis petits-déjeuners puis Ajouts manuels, cases à cocher (enregistrées tout de suite), ajout et retrait d'articles. Un ingrédient commun (même nom, même unité) garde sa case dans chaque Recette et affiche le total des Recettes sélectionnées, en g ou ml (« Oignon : 500 g au total ») : les ingrédients sont estimés en masse ou volume pour les nutriments. La consultation hors ligne viendra avec le ticket 17.
