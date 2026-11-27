# 28: Banc d'essai des modèles

**What to build:** Avant de figer les modèles, je compare 3 ou 4 candidats sur des Repas dont les vraies valeurs sont connues, pour choisir celui qui estime le mieux pour un coût raisonnable. On mesure au lieu de deviner.

**Blocked by:** 27

**Status:** ready-for-agent

## Jeu de référence

Fichiers téléchargés le 28 novembre 2026 dans `donnees-de-test/` (non versionné, voir `.gitignore`). Pour les retrouver :

- Table FAO/INFOODS d'Afrique de l'Ouest 2019 : https://www.fao.org/fileadmin/user_upload/faoweb/2020/WAFCT_2019.xlsx (feuille « 09 Mixed dishes » pour les recettes, feuille « 03 NV_sum_39 » pour les valeurs pour 100 g). Citation obligatoire : Vincent, A. et al. 2020, *FAO/INFOODS Food Composition Table for Western Africa (2019)*.
- Nutrition5k (Google Research, CC BY 4.0) : `https://storage.googleapis.com/nutrition5k_dataset/nutrition5k_dataset/metadata/dish_metadata_cafe1.csv` et photos `…/imagery/realsense_overhead/<plat>/rgb.png`.

### 1. Photos de plats pesés (Nutrition5k) : la portion vue sur une photo

Valeurs du plat entier. Pas de sucres, fibres, AGS ni sel dans ce jeu.

| Plat | Masse | kcal | Lipides (g) | Glucides (g) | Protéines (g) | Ingrédients principaux |
|---|---|---|---|---|---|---|
| `dish_1566417516` | 425 g | 385 | 36,5 | 23,5 | 33,7 | poisson 158 g, aubergine 109 g, pommes de terre rôties 40 g, blé 31 g, huile d'olive 12 g, salade |
| `dish_1561492204` | 334 g | 488 | 15,7 | 49,1 | 37,2 | riz frit 128 g, poulet 92 g, mil 23 g, épinards 31 g, huile d'olive 8 g |
| `dish_1562618000` | 448 g | 685 | 36,1 | 30,8 | 59,2 | hauts de cuisse de poulet 206 g, pois chiches 66 g, brocoli 68 g, riz complet 20 g, huile d'olive 16 g |
| `dish_1561753238` | 333 g | 298 | 13,7 | 14,0 | 28,9 | saumon 103 g, courge 68 g, tatsoi 72 g, riz complet 20 g |
| `dish_1559751801` | 343 g | 451 | 22,0 | 32,8 | 29,2 | œufs 122 g, saucisse poulet-pomme 89 g, igname 66 g, baies 66 g |

L'IA reçoit seulement la photo ; on compare les totaux.

### 2. Plats ouest-africains en texte (table FAO) : la connaissance des plats

Valeurs pour 100 g. Pas de sucres dans la table ; le sel se déduit du sodium (sel = sodium × 2,5).

| Code FAO | Plat | kcal | Protéines | Lipides | Glucides | Fibres | AGS | Sodium (mg) |
|---|---|---|---|---|---|---|---|---|
| 14_008 | Sauce d'arachide aux légumes et poisson | 166 | 6,6 | 12,5 | 5,3 | 2,6 | 2,36 | 297 |
| 01_158 | Riz avec poisson et légumes (Moui naagdme) | 157 | 3,9 | 5,6 | 22,0 | 1,4 | 0,92 | 220 |
| 07_135 | Kédjénou, poulet mijoté avec légumes | 48 | 4,9 | 2,2 | 2,0 | 0,6 | 0,67 | 490 |
| 14_018 | Sauce gombo séché avec bœuf, légumes et huile de palme rouge | 144 | 6,0 | 11,7 | 2,4 | 2,6 | 5,59 | 348 |
| 02_089 | Foufou de bananes plantain avec huile de palme rouge | 323 | 1,3 | 23 | 26 | 3,5 | 11,06 | 278 |
| 14_025 | Sauce de feuilles de manioc, poisson, huile de palme rouge | 264 | 6,4 | 23,7 | 4,6 | 3,5 | 11,40 | 432 |
| 03_143 | Niébé et riz, bouillis | 125 | 6,2 | 0,4 | 22,5 | 3,2 | 0,12 | 166 |

L'IA reçoit le nom du plat, ses ingrédients sans quantités (feuille « 09 Mixed dishes ») et un poids de portion (ex. « une assiette de 350 g ») ; on compare au total attendu (valeur pour 100 g × poids). Les plats riches en huile de palme et en AGS sont prioritaires : c'est l'enjeu du cholestérol.

### 3. Facultatif, plus tard

- 2 ou 3 plats préparés du commerce avec étiquette complète (Open Food Facts, choisis à la main sur le site ; ODbL, photos CC BY-SA) pour les sucres et le sel.
- Quelques photos de l'utilisateur, sans vérité de référence : jugement de vraisemblance.

## Travail

- [x] Constituer le jeu de référence (ci-dessus) : 5 photos pesées, 7 plats ouest-africains.
- [ ] Script de banc d'essai (hors app, lancé à la main) : envoie chaque Repas à chaque modèle candidat via le port IA, avec la même consigne que l'app, puis enregistre la réponse, la durée et le coût réel rapporté par OpenRouter.
- [ ] Rapport : écart moyen par nutriment (calories, lipides, AGS et sel en priorité, à cause du cholestérol), cas aberrants, coût pour 150 analyses par mois.
- [ ] Même chose, plus court, pour un Rendez-vous du samedi : jugement de l'utilisateur sur la variété et le réalisme des Recettes.
- [ ] Choisir les listes de modèles et les mettre à jour dans les secrets (ticket 27).
