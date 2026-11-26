# 08: Profil, Objectifs personnels et Objectifs estimés par l'IA

**What to build:** Sur une même page (onglet « Objectifs & Profil »), je renseigne mon Profil, mes Objectifs personnels en texte libre (« réduire le sucre », « prendre 2 kg en 6 mois ») et mon Objectif de poids chiffré, et j'enregistre mes Pesées. L'IA estime mes Objectifs journaliers à partir de tout cela et des Règles du médecin, avec une courte justification par nutriment. La proposition arrive pré-remplie et modifiable ; elle ne s'applique que quand j'appuie sur « Appliquer » (ADR 0004). Remplace l'ancien découpage 08 (calcul par formule) + 09 (avis de l'IA).

**Blocked by:** 10, 22

**Status:** ready-for-agent

- [x] Profil : taille, âge, sexe, niveau d'activité, fuseau horaire ; poids = dernière Pesée.
- [x] Objectifs personnels (texte libre) et Objectif de poids chiffré (variation + échéance).
- [x] Pesées datées (ajout, suppression) et courbe de poids sur le Dashboard.
- [x] Noyau métier : formule garde-fou (Mifflin-St Jeor × niveau d'activité) et détection d'une proposition de calories qui s'en écarte trop (seuil à définir, testé).
- [x] `estimer-objectifs` (port IA, factice + Gemini) : reçoit Profil, Objectifs personnels, Objectif de poids, Règles du médecin actives et la formule ; renvoie les 8 Objectifs avec une justification chacun ; **n'écrit rien** (testé).
- [x] Écran : proposition pré-remplie à côté des valeurs actuelles, justifications visibles, chaque valeur modifiable, puis « Appliquer ». Écart avec la formule signalé.
- [x] Une nouvelle estimation est proposée (bannière) quand le Profil, les Objectifs personnels ou les Règles du médecin changent ; bouton « Réestimer » toujours disponible.
- [ ] Profil, Objectifs et Règles non modifiables hors ligne (message clair). *(reporté au ticket 17 : sans cache local, tout passe déjà par le réseau et affiche une erreur hors ligne)*

## Avancement

- **Âge :** saisi comme date de naissance (l'âge se recalcule seul). **Fuseau :** celui du téléphone, affiché et enregistré avec le Profil.
- **Garde-fou :** au-delà de **20 %** d'écart entre les calories proposées et la formule, la proposition est signalée (et l'IA doit s'en justifier).
- **Bannière de réestimation :** déclenchée par un changement réel du Profil (dont Objectifs personnels et Objectif de poids) ou des Règles du médecin. Réenregistrer à l'identique ne compte pas. **Une nouvelle Pesée ne la déclenche pas** (sinon elle apparaîtrait à chaque pesée) : on réestime à la main quand le poids a vraiment bougé.
- **Sûreté :** recharger l'écran écarte une proposition ouverte, pour n'appliquer que ce qui est affiché.
- **En plus du ticket :** une Pesée par date (repeser le même jour remplace), bouton « Écarter la proposition ».
- **Non vérifié :** l'écran sur le téléphone, et un vrai appel à Gemini.
