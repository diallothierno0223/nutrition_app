# 21a: Base commune et page d'accueil

**What to build:** La nouvelle base visuelle (couleurs, titres, cartes, puces, boutons, champs, nombres) appliquée aux composants partagés, et la page d'accueil refaite selon les décisions du ticket 21.

**Blocked by:** 21 (maquette validée)

**Status:** needs-triage

- [ ] Thème : couleur principale terracotta et couleurs des jauges (vert, orange, rouge, gris-bleu), en clair et en sombre (`constants/theme.ts`).
- [ ] Textes : types de titre d'écran, de section et de détail (`themed-text.tsx`).
- [ ] Composants : `Carte`, `Puces` / `PucesMultiples` (choisie pleine, autres en bordure), `Bouton` (principal, secondaire, discret ; désactivé lisible ; texte jamais coupé), `Champ` et `ChampDate` / `ChampHeure` avec libellé au-dessus et hauteur commune, ligne de liste « › ».
- [ ] Nombres à la française dans tous les affichages (formatage partagé, noyau métier si possible).
- [ ] Onglet actif en terracotta.
- [ ] Sens de l'Objectif sous chaque jauge (libellés déplacés dans le noyau, partagés avec l'écran Objectifs).
- [ ] Page d'accueil : résumé du jour, jauges, eau, Repas du jour, Semaine (graphique + total), Moyenne (tableau compact), poids et pas, chacun dans sa carte avec un titre de section.
- [ ] Vérifier en clair et en sombre sur le téléphone.
