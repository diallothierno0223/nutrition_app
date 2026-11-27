# 28: Banc d'essai des modèles

**What to build:** Avant de figer les modèles, je compare 3 ou 4 candidats sur des Repas dont je connais les vraies valeurs, pour choisir celui qui estime le mieux pour un coût raisonnable. On mesure au lieu de deviner.

**Blocked by:** 27

**Status:** needs-info

- [ ] Constituer une dizaine de Repas de référence aux valeurs connues : produits avec étiquette, plats pesés avec une recette connue, dont au moins 4 plats africains et 3 photos. L'utilisateur fournit les photos et les pesées ; les valeurs de référence viennent de l'étiquette ou de la table CIQUAL / FAO.
- [ ] Script de banc d'essai (hors app, lancé à la main) : envoie chaque Repas à chaque modèle candidat via le port IA, avec la même consigne que l'app, puis enregistre la réponse, la durée et le coût réel rapporté par OpenRouter.
- [ ] Rapport : écart moyen par nutriment (calories, lipides, AGS, sucres, sel en priorité, à cause du cholestérol), cas aberrants, coût pour 150 analyses par mois.
- [ ] Même chose, plus court, pour un Rendez-vous du samedi : jugement de l'utilisateur sur la variété et le réalisme des Recettes.
- [ ] Choisir les listes de modèles et les mettre à jour dans les secrets (ticket 27).
