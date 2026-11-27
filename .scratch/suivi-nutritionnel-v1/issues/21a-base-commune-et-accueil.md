# 21a: Base commune et page d'accueil

**What to build:** La nouvelle base visuelle (couleurs, titres, cartes, puces, boutons, champs, nombres) appliquée aux composants partagés, et la page d'accueil refaite selon les décisions du ticket 21.

**Blocked by:** 21 (maquette validée)

**Status:** done

- [x] Thème : couleur principale terracotta et couleurs des jauges (vert, orange, rouge, gris-bleu), en clair et en sombre (`constants/theme.ts`).
- [x] Textes : types de titre d'écran, de section et de détail (`themed-text.tsx`).
- [x] Composants : `Carte`, `Puces` / `PucesMultiples` (choisie pleine, autres en bordure), `Bouton` (principal, secondaire, discret ; désactivé lisible ; texte jamais coupé), `Champ` et `ChampDate` / `ChampHeure` avec libellé au-dessus et hauteur commune, ligne de liste « › ».
- [x] Nombres à la française dans tous les affichages (formatage partagé, noyau métier si possible).
- [x] Onglet actif en terracotta.
- [x] Sens de l'Objectif sous chaque jauge (libellés déplacés dans le noyau, partagés avec l'écran Objectifs).
- [x] Page d'accueil : résumé du jour, jauges, eau, Repas du jour, Semaine (graphique + total), Moyenne (tableau compact), poids et pas, chacun dans sa carte avec un titre de section.
- [ ] Vérifier en clair et en sombre sur le téléphone.

## Avancement

- Thème (`constants/theme.ts`) : palette de la maquette ; en clair, l'accent et les couleurs de jauge sont un peu plus foncés que la maquette pour que le texte atteigne 4,5:1 partout (accent `#A84A29`, vert `#1E6E44`, orange `#9A5A0A`, rouge `#B02E24`, gris-bleu `#5A6880`). En sombre, le texte posé sur l'accent est foncé : le blanc n'y atteint pas 4,5:1. Couleurs de jauge par thème (`useCouleursJauge`).
- Textes : types `ecran`, `section`, `detail`. Composants : `Carte` (titre et détail), `Puces` (rôle case à cocher pour `PucesMultiples`), `Bouton` principal / secondaire / discret (désactivé lisible, texte jamais coupé), `Champ` et `ChampDate` / `ChampHeure` avec `libelle` et hauteur commune (`CadreDeChamp`), dates courtes, `LigneDeListe`.
- Noyau : `formaterNombre`, `formaterQuantite`, `formaterLitres`, `libelleDuSens`, `libelleDEtat`, `libelleCourtDeJournee`, `resumeDuJour` (testés) ; notifications et Liste de courses passent par le même format.
- Onglet actif en couleur principale ; le premier onglet s'appelle « Accueil ».
- Page d'accueil : résumé du jour, Nutriments, Eau, Repas du jour (lignes de liste), Semaine (graphique + total), Moyenne (tableau), Poids et pas.
- Les boutons « Annuler », « Retirer la photo » et « Supprimer » (Pesée) des autres écrans passent en variante discrète ; le reste des écrans est au ticket 21b (dont les puces et le champ recodés à la main des Règles).
- Reste : vérification sur le téléphone, en clair et en sombre.
