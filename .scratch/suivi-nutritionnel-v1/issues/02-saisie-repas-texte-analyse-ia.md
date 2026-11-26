# 02: Saisie d'un Repas en texte, analysé par l'IA

**What to build:** Je décris un repas en texte libre. L'IA le décompose en Constituants (quantités en g/ml avec équivalent en mesure de cuisine, nutriments), et le Repas est enregistré directement avec ses totaux et un Commentaire du repas (ADR 0003). Je vois le résultat dès qu'il est prêt, et le Repas apparaît dans le Journal des repas de la Journée.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] Vérifier et documenter le modèle Gemini à utiliser (vision + sortie JSON structurée).
- [ ] Vérifier qu'un vrai `supabase functions deploy` embarque bien le noyau métier importé depuis l'extérieur de `supabase/` (repris du ticket 01, testé seulement en local) ; sinon, ajuster la configuration.
- [x] Port IA avec implémentation Gemini et implémentation factice ; sortie JSON à schéma imposé.
- [x] `analyser-repas` écrit les Constituants, les totaux (somme des Constituants, calculée par le noyau métier) et le Commentaire du repas (10 lignes max, point fort / point faible / amélioration).
- [ ] Le Commentaire tient compte de ce qui reste dans les Objectifs du jour (s'ils existent).
- [x] Type de repas déduit de l'heure (avant 11 h, 11–16 h, 16–18 h, après 18 h) et rattachement à la Journée selon le fuseau (tests des cas 23 h 59 / 00 h 00).
- [x] Les 7 nutriments sont estimés : Calories, Protéines, Glucides, Lipides, AGS, Fibres, Sel.
- [x] La clé Gemini n'existe que dans les secrets des Edge Functions.
- [x] Test backend : avec l'IA factice, le Repas analysé contient les Constituants et le Commentaire attendus.

## Avancement

- **Totaux :** ils ne sont pas stockés en base. Ils se calculent toujours à partir des Constituants (`totauxDuRepas` du noyau, puis vues SQL au ticket 03), pour qu'une correction de Constituant ne puisse jamais les désynchroniser.
- **Modèle Gemini :** `gemini-3.8-flash` (stable, image + sortie JSON d'après la documentation Google de novembre 2026), modifiable par `GEMINI_MODELE`. Appel REST `generateContent` avec `responseMimeType` et `responseJsonSchema` ; la documentation était ambiguë sur ce dernier champ. La réponse est toujours validée par le noyau (`lireAnalyseRepas`). **Pas encore testé avec une vraie clé**, et la vision sera vérifiée au ticket 05.
- **Objectifs restants :** il n'existe pas encore d'Objectifs ; leur prise en compte dans le Commentaire est reportée au ticket 03.
- **Déploiement réel :** à vérifier lors de la création du projet Supabase distant.
- **En plus du ticket :** un bouton « Relancer l'analyse » sur un Repas en attente (sinon un échec d'analyse serait une impasse) et les totaux du jour affichés sur le Dashboard (remplacés par les jauges au ticket 03).
