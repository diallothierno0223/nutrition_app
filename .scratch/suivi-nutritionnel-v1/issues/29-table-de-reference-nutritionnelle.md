# 29: Table de référence nutritionnelle

**What to build:** L'IA s'appuie sur des valeurs officielles pour les aliments courants de mes repas au lieu de sa seule mémoire, ce qui rend les estimations plus fiables et plus régulières, sans coût de recherche.

**Blocked by:** 27

**Status:** needs-triage

- [ ] Choisir les sources et vérifier leurs conditions de réutilisation : table CIQUAL (ANSES) et table de composition des aliments d'Afrique de l'Ouest (FAO/INFOODS). Noter la version et la date dans `docs/`.
- [ ] Extraire environ 150 aliments courants (céréales, tubercules, huiles dont huile de palme, arachide, légumineuses, poissons, viandes, sauces de base, fruits), pour 100 g : les 8 nutriments suivis.
- [ ] La table vit dans le noyau métier (données versionnées, testées : unités, valeurs plausibles) et est ajoutée à la consigne d'analyse ; l'IA doit s'en servir quand un Constituant y figure.
- [ ] Mesurer l'effet avec le banc d'essai (ticket 28) : écart avant et après, coût en tokens de la consigne plus longue.
