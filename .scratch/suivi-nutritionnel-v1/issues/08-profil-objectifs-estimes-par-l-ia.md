# 08: Profil, Objectifs personnels et Objectifs estimés par l'IA

**What to build:** Sur une même page (onglet « Objectifs & Profil »), je renseigne mon Profil, mes Objectifs personnels en texte libre (« réduire le sucre », « prendre 2 kg en 6 mois ») et mon Objectif de poids chiffré, et j'enregistre mes Pesées. L'IA estime mes Objectifs journaliers à partir de tout cela et des Règles du médecin, avec une courte justification par nutriment. La proposition arrive pré-remplie et modifiable ; elle ne s'applique que quand j'appuie sur « Appliquer » (ADR 0004). Remplace l'ancien découpage 08 (calcul par formule) + 09 (avis de l'IA).

**Blocked by:** 10, 22

**Status:** ready-for-agent

- [ ] Profil : taille, âge, sexe, niveau d'activité, fuseau horaire ; poids = dernière Pesée.
- [ ] Objectifs personnels (texte libre) et Objectif de poids chiffré (variation + échéance).
- [ ] Pesées datées (ajout, suppression) et courbe de poids sur le Dashboard.
- [ ] Noyau métier : formule garde-fou (Mifflin-St Jeor × niveau d'activité) et détection d'une proposition de calories qui s'en écarte trop (seuil à définir, testé).
- [ ] `estimer-objectifs` (port IA, factice + Gemini) : reçoit Profil, Objectifs personnels, Objectif de poids, Règles du médecin actives et la formule ; renvoie les 8 Objectifs avec une justification chacun ; **n'écrit rien** (testé).
- [ ] Écran : proposition pré-remplie à côté des valeurs actuelles, justifications visibles, chaque valeur modifiable, puis « Appliquer ». Écart avec la formule signalé.
- [ ] Une nouvelle estimation est proposée (bannière) quand le Profil, les Objectifs personnels ou les Règles du médecin changent ; bouton « Réestimer » toujours disponible.
- [ ] Profil, Objectifs et Règles non modifiables hors ligne (message clair).
