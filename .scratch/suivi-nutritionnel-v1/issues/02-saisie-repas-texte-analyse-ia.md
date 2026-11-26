# 02: Saisie d'un Repas en texte, analysé par l'IA

**What to build:** Je décris un repas en texte libre. L'IA le décompose en Constituants (quantités en g/ml avec équivalent en mesure de cuisine, nutriments), et le Repas est enregistré directement avec ses totaux et un Commentaire du repas (ADR 0003). Je vois le résultat dès qu'il est prêt, et le Repas apparaît dans le Journal des repas de la Journée.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Vérifier et documenter le modèle Gemini à utiliser (vision + sortie JSON structurée).
- [ ] Port IA avec implémentation Gemini et implémentation factice ; sortie JSON à schéma imposé.
- [ ] `analyser-repas` écrit les Constituants, les totaux (somme des Constituants, calculée par le noyau métier) et le Commentaire du repas (10 lignes max, point fort / point faible / amélioration).
- [ ] Le Commentaire tient compte de ce qui reste dans les Objectifs du jour (s'ils existent).
- [ ] Type de repas déduit de l'heure (avant 11 h, 11–16 h, 16–18 h, après 18 h) et rattachement à la Journée selon le fuseau (tests des cas 23 h 59 / 00 h 00).
- [ ] Les 7 nutriments sont estimés : Calories, Protéines, Glucides, Lipides, AGS, Fibres, Sel.
- [ ] La clé Gemini n'existe que dans les secrets des Edge Functions.
- [ ] Test backend : avec l'IA factice, le Repas analysé contient les Constituants et le Commentaire attendus.
