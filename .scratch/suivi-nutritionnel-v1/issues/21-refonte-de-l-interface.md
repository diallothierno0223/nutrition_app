# 21: Refonte de l'interface

**What to build:** Une interface lisible, avec une identité propre : on voit au premier coup d'œil où l'on en est aujourd'hui, ce qui est sélectionné et sur quoi on peut appuyer. Décisions prises lors du grill du 27 novembre 2026, à partir des captures de l'utilisateur.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human — maquette à valider, puis découpé en 21a et 21b.

- [ ] Maquette HTML (page d'accueil, Saisie, Profil, planche des éléments de base ; clair et sombre) validée par l'utilisateur.
- [ ] 21a livré : base commune et page d'accueil (`21a-base-commune-et-accueil.md`).
- [ ] 21b livré : tous les autres écrans (`21b-autres-ecrans.md`).

## Décisions

- **Identité :** couleur principale terracotta (boutons principaux, sélection, onglet actif), déclinée en clair et en sombre ; contraste du texte au moins 4,5:1. Police du téléphone (pas de police personnalisée). Pas d'icônes en dehors des onglets.
- **Titres sur trois niveaux :** titre d'écran (grand) ; titre de section net (environ 22 px, gras, nom court : « Eau », « Repas du jour », « Semaine », « Moyenne ») ; détail en petit texte gris dessous (ex. « face à l'Objectif hebdomadaire »).
- **Cartes :** chaque section dans une carte (fond légèrement différent, coins arrondis, espace entre les cartes).
- **Puces (sélection) :** choisie = fond terracotta plein, texte blanc ; non choisie = fond transparent, bordure fine. Les sélections dessinées à la main (catégories des Règles, jours de la Semaine) suivent la même règle.
- **Boutons :** principal (terracotta plein, pleine largeur), secondaire (bordure et texte terracotta), discret (texte coloré : « Effacer », « Annuler »). Désactivé : gris plein, texte lisible. Le texte d'un bouton n'est jamais coupé (il passe à la ligne).
- **Ce qui ouvre un écran ressemble à une ligne de liste** (« Yassa de poulet › »), jamais à une puce : les puces ne servent qu'à choisir.
- **Champs :** libellé au-dessus de chaque champ (« Taille (cm) »), même hauteur pour tous, dates courtes sur une ligne (« 3 mars 2004 ») ; le format long reste dans les listes.
- **Nombres à la française** partout (« 1 522,5 g »).
- **Onglet actif :** icône et libellé en terracotta, fond léger ; les autres en gris.
- **Jauges :** vert = dans l'objectif, orange = près du plafond, rouge = dépassé, gris-bleu = en dessous d'une Cible. Sous chaque nom, le sens de l'Objectif (« à ne pas dépasser », « à atteindre », « à ±10 % ») ; libellés déplacés dans le noyau métier et partagés avec l'écran Objectifs.
- **Page d'accueil, de haut en bas :** bandeau hors ligne (s'il y a lieu) ; résumé du jour (« 1 240 kcal sur 1 959 · reste 719 », nutriments dépassés) ; jauges ; eau ; Repas du jour ; Semaine ; Moyenne ; poids et pas.
- **Semaine :** graphique par jour avec son sélecteur de nutriment, plus une ligne de total pour le nutriment choisi (plus de liste de barres). **Moyenne :** tableau compact (nutriment, moyenne, objectif), valeur colorée selon l'état, sans barres ; sélecteur 30 jours / 90 jours / Tout.

## Remarques des captures

- Sélection presque invisible (Homme/Femme, niveau d'activité, nutriment de la Semaine, période de la Moyenne).
- Bouton « Analyser et… » coupé et illisible quand il est désactivé ; puce « Très actif » coupée.
- Titres de section aussi petits que le texte (« Semaine (face à l'Objectif hebdomadaire) », « Moyenne par Journée »).
- Profil : champs de hauteurs différentes, date de naissance sur trois lignes, « 175 » sans libellé ni unité.
- La roue dentée ronde en haut à droite est le menu du client de développement Expo : absente de l'app finale.
