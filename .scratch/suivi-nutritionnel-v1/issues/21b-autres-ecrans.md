# 21b: Refonte des autres écrans

**What to build:** Tous les écrans hors page d'accueil adoptent la base commune du ticket 21a, avec les ajustements propres à chacun.

**Blocked by:** 21a

**Status:** done

- [x] Saisie : Plats de la semaine et Mes Plats en lignes de liste « › » (5 au plus, puis « Voir tout ») ; boutons photo et galerie secondaires ; « Analyser et enregistrer » principal, jamais coupé.
- [x] Profil et Pesées : libellés au-dessus des champs, hauteurs égales, dates courtes ; puces lisibles (sexe, activité).
- [x] Objectifs : titres de section, champs avec libellé, sens de l'Objectif partagé avec les jauges.
- [x] Samedi, Rendez-vous, Liste de courses : cartes, titres, cases et puces lisibles.
- [x] Règles du médecin : puces de catégorie et champs via les composants communs (plus de version dessinée à la main).
- [x] Fiche Repas, fiche Plat, Réglages (menu et sous-écrans), connexion : composants communs (plus de `TextInput` ni de bouton recodés à la main).
- [ ] Vérifier en clair et en sombre sur le téléphone.

## Avancement

- Saisie : carte « Nouveau Repas » en tête (photo, galerie, description avec libellé, « Analyser et enregistrer »), puis Plats de la semaine et Mes Plats en lignes de liste (5 au plus, « Voir tout »).
- Profil et Pesées, Objectifs (deux cartes : estimation, Objectifs journaliers), Samedi et Rendez-vous (Bilan avec la Liste de courses en ligne de liste, une carte par catégorie), Liste de courses (cartes, cases à cocher accessibles), Règles (puces et champs communs), fiches Repas et Plat, Réglages (menu en lignes de liste, Compte), connexion : cartes avec titres, libellés au-dessus des champs, boutons à trois niveaux.
- Nouveaux composants communs : `CaseACocher`, `Interrupteur` (curseur visible en clair et en sombre), `LibelleDeChamp`. Plus aucun `TextInput` ni bouton recodé à la main hors des composants.
- Les valeurs réaffichées dans un champ ont la virgule française (`versTexte`).
- Les tableaux de valeurs (Objectifs, Nombres du Rendez-vous, heures des notifications) gardent le libellé à gauche du champ : une ligne par valeur reste plus lisible qu'un libellé au-dessus.
- Supprimer un Repas ou un Plat : bouton discret, à part.
- Reste : vérification sur le téléphone, en clair et en sombre.
