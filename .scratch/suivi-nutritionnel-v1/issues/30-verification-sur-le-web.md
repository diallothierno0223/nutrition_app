# 30: Vérifier un Repas sur le web

**What to build:** Pour un plat inconnu ou un produit de marque, j'appuie sur « Vérifier sur le web » dans la fiche du Repas : l'IA relance l'analyse en s'aidant d'une recherche web limitée. Jamais automatiquement : le coût reste maîtrisé (1 à 2 centimes par appui).

**Blocked by:** 27

**Status:** needs-triage

Contexte (documentation OpenRouter lue le 27 novembre 2026) : la recherche web passe par le plugin `web` ; une recherche par requête, `max_results` fixé (5 par défaut, 10 au plus). Moteur Exa : 0,007 $ par recherche, plus la lecture des extraits par le modèle.

- [ ] Bouton « Vérifier sur le web » sur la fiche d'un Repas analysé (et d'un Repas dont l'analyse a échoué).
- [ ] Relance de l'analyse avec le plugin `web`, `max_results` à 3, sur la liste de modèles d'analyse ; la précision éventuelle de l'utilisateur est reprise.
- [ ] Le Commentaire cite les sources utilisées (titre ou site), pour que je puisse juger.
- [ ] Garde-fou : nombre de vérifications web par jour plafonné côté serveur (ex. 10), avec un message clair au-delà.
- [ ] Jamais de recherche web dans les analyses automatiques, l'estimation des Objectifs ou le Rendez-vous du samedi.
