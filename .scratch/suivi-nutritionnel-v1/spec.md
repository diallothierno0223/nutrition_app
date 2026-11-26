# Spec : Suivi nutritionnel anti-cholestérol, V1

Status: ready-for-agent

Vocabulaire : voir `GLOSSARY.md`. Décisions d'architecture : `docs/adr/0001`, `0002`, `0003`.

## Problem Statement

J'ai un cholestérol d'origine génétique et un médecin qui me donne des consignes alimentaires. Les applications de nutrition existantes ne connaissent pas la cuisine africaine que je mange (mafé, fonio, attiéké, poisson braisé), ne surveillent pas en priorité les acides gras saturés, et demandent une saisie fastidieuse aliment par aliment. Je n'ai donc pas de vision claire de ce que je mange au jour le jour ni sur la semaine, ni de moyen simple de planifier des repas adaptés à mes consignes et à mon objectif de poids (+2 kg en 6 mois).

## Solution

Une application Android personnelle (un seul utilisateur) dans laquelle je décris un repas en texte, en photo ou les deux. L'IA le décompose en Constituants, estime les nutriments, enregistre directement le Repas et rédige un Commentaire du repas. Je ne corrige que si besoin. Un Dashboard affiche mes jauges du jour, de la Semaine et ma moyenne globale par rapport à mes Objectifs, calculés à partir de mon Profil et de mon Objectif de poids. Les Règles du médecin guident toutes les analyses. Chaque samedi matin, l'application prépare un Rendez-vous du samedi : un Bilan de la semaine, 3 Recettes de batch cooking (10 portions de déjeuners et dîners), des petits-déjeuners (dont des Petits-déjeuners nomades) et une Liste de courses rangée par Recette. Des notifications locales me rappellent de manger, de boire et de saisir mes repas. L'app reste utilisable sans réseau pour l'essentiel, notamment au marché.

## User Stories

### Saisie d'un Repas

1. En tant qu'utilisateur, je veux décrire un repas en texte libre, afin de l'enregistrer sans chercher chaque aliment dans une base.
2. En tant qu'utilisateur, je veux prendre en photo mon assiette, afin que l'IA estime les quantités et les nutriments à ma place.
3. En tant qu'utilisateur, je veux ajouter une note à une photo (type d'huile, mode de cuisson, sauce allégée), afin de donner à l'IA ce que la photo ne montre pas.
4. En tant qu'utilisateur, je veux que mon Repas soit décomposé en Constituants avec quantité et nutriments, afin de comprendre d'où viennent les totaux.
5. En tant qu'utilisateur, je veux que le Repas analysé soit enregistré directement sans étape de validation, afin que la saisie soit la plus rapide possible.
6. En tant qu'utilisateur, je veux voir le résultat de l'analyse dès qu'il est disponible, afin de vérifier rapidement l'estimation.
7. En tant qu'utilisateur, je veux modifier la quantité d'un Constituant et voir ses nutriments recalculés proportionnellement sans nouvel appel à l'IA, afin de corriger vite et sans coût.
8. En tant qu'utilisateur, je veux saisir ou corriger une quantité en grammes/millilitres ou en mesure de cuisine (cuillère, louche), afin d'utiliser l'unité qui me parle.
9. En tant qu'utilisateur, je veux voir pour chaque quantité un équivalent en mesure de cuisine, afin de me représenter les grammes.
10. En tant qu'utilisateur, je veux supprimer ou ajouter un Constituant, afin de corriger une erreur d'identification.
11. En tant qu'utilisateur, je veux ajouter une précision en texte et relancer l'analyse, afin que l'IA corrige elle-même son estimation.
12. En tant qu'utilisateur, je veux que les totaux du Repas soient toujours la somme de ses Constituants, afin que les chiffres restent cohérents après correction.
13. En tant qu'utilisateur, je veux que le Type de repas soit déduit de l'heure (avant 11 h petit-déjeuner, 11 h–16 h déjeuner, 16 h–18 h collation, après 18 h dîner), afin de ne pas avoir à le choisir.
14. En tant qu'utilisateur, je veux pouvoir changer le Type de repas, notamment pour marquer une collation à n'importe quelle heure, afin que le classement soit juste.
15. En tant qu'utilisateur, je veux modifier la date et l'heure d'un Repas, afin de saisir après coup un repas oublié.
16. En tant qu'utilisateur, je veux supprimer un Repas, afin de retirer une saisie erronée.
17. En tant qu'utilisateur, je veux que les jauges et moyennes se recalculent après toute modification ou suppression, afin que mes indicateurs restent exacts.
18. En tant qu'utilisateur, je veux que chaque Repas soit rattaché à la Journée (00 h 00–23 h 59, fuseau du téléphone) de son heure, afin que les totaux du jour soient prévisibles.
19. En tant qu'utilisateur, je veux que les boissons caloriques (jus, bissap sucré, café au lait) soient saisies comme des Repas, afin que leurs calories soient comptées.

### Commentaire du repas

20. En tant qu'utilisateur, je veux un Commentaire du repas (10 lignes maximum) avec point fort, point faible et amélioration possible, afin d'apprendre à mieux composer mes assiettes.
21. En tant qu'utilisateur, je veux que le Commentaire tienne compte des Règles du médecin et de ce qui reste dans mes Objectifs du jour, afin qu'il soit utile pour la suite de ma journée.
22. En tant qu'utilisateur, je veux que le Commentaire soit régénéré quand je relance l'analyse, mais pas quand je modifie seulement une quantité, afin d'éviter des appels inutiles.

### Plats et réutilisation

23. En tant qu'utilisateur, je veux enregistrer un Repas comme Plat en un geste, afin de le réutiliser plus tard.
24. En tant qu'utilisateur, je veux réutiliser un Plat avec un Coefficient de portion (×0,5, ×1,5…), afin d'enregistrer rapidement un plat récurrent ou de batch cooking.
25. En tant qu'utilisateur, je veux que réutiliser un Plat copie ses Constituants dans un nouveau Repas, afin que modifier le Plat plus tard ne réécrive jamais mon historique.
26. En tant qu'utilisateur, je veux ajouter une précision à un Plat réutilisé (« j'ai ajouté une cuillère d'huile »), afin d'ajuster ce repas-là.
27. En tant qu'utilisateur, je veux voir les Plats de la semaine en tête de la saisie rapide, afin d'enregistrer une portion de batch cooking en un geste.
28. En tant qu'utilisateur, je veux modifier et supprimer mes Plats, afin de garder une bibliothèque propre.

### Hydratation

29. En tant qu'utilisateur, je veux ajouter de l'eau par +250 ml ou +500 ml, afin de suivre mon Hydratation en un geste.
30. En tant qu'utilisateur, je veux annuler un ajout d'eau, afin de corriger une erreur de saisie.
31. En tant qu'utilisateur, je veux que l'Hydratation ne compte que l'eau et les boissons sans calories, afin de ne pas mélanger hydratation et apports.

### Profil, Pesées et Objectifs

32. En tant qu'utilisateur, je veux renseigner mon Profil (poids, taille, âge, sexe, niveau d'activité, fuseau horaire), afin que mes Objectifs soient calculés pour moi.
33. En tant qu'utilisateur, je veux définir un Objectif de poids (texte libre, variation chiffrée et échéance, par exemple +2 kg en 6 mois), afin que mes calories soient ajustées en conséquence.
34. En tant qu'utilisateur, je veux enregistrer des Pesées datées, afin de suivre l'évolution de mon poids.
35. En tant qu'utilisateur, je veux que le poids du Profil soit celui de la dernière Pesée, afin de ne pas le saisir deux fois.
36. En tant qu'utilisateur, je veux que mes Objectifs journaliers soient calculés par formule (Mifflin-St Jeor × niveau d'activité + ajustement de l'Objectif de poids, macros selon les repères par défaut), afin d'avoir une base reproductible et explicable.
37. En tant qu'utilisateur, je veux pouvoir demander l'avis de l'IA sur ces Objectifs, afin qu'ils tiennent compte de mon objectif en texte libre et des Règles du médecin.
38. En tant qu'utilisateur, je veux valider explicitement tout nouvel Objectif proposé avant qu'il s'applique, afin que mes jauges ne changent jamais en silence.
39. En tant qu'utilisateur, je veux qu'un recalcul me soit proposé quand mon Profil ou mon Objectif de poids change, afin de garder des Objectifs à jour sans les subir.
40. En tant qu'utilisateur, je veux modifier à la main chaque Objectif journalier, afin d'appliquer un chiffre donné par mon médecin.
41. En tant qu'utilisateur, je veux que l'Objectif hebdomadaire soit toujours 7 fois l'Objectif journalier, afin de n'avoir qu'une valeur à maintenir.
42. En tant qu'utilisateur, je veux un objectif d'Hydratation en litres, afin de suivre ma consommation d'eau.
43. En tant qu'utilisateur, je veux suivre 7 nutriments (Calories, Protéines, Glucides, Lipides, AGS, Fibres, Sel), afin de couvrir l'essentiel sans surcharge.

### Règles du médecin

44. En tant qu'utilisateur, je veux tenir un carnet de Règles du médecin datées (à privilégier, à éviter, conseil), afin de garder la trace des consultations.
45. En tant qu'utilisateur, je veux archiver une consigne qui n'est plus valable plutôt que la supprimer, afin de conserver l'historique.
46. En tant qu'utilisateur, je veux que seules les consignes actives soient envoyées à l'IA pour chaque analyse et chaque génération, afin que l'IA suive les consignes du moment.
47. En tant qu'utilisateur, je veux que les Règles du médecin priment sur les repères par défaut dans toutes les réponses de l'IA, afin que l'avis médical l'emporte.

### Dashboard

48. En tant qu'utilisateur, je veux voir les jauges du jour pour chaque nutriment et l'Hydratation, afin de savoir où j'en suis.
49. En tant qu'utilisateur, je veux que les jauges des Plafonds (AGS, Sel) passent à l'orange à 80 % et au rouge au-delà de 100 %, afin d'être alerté avant de dépasser.
50. En tant qu'utilisateur, je veux que les jauges des Plages (Calories, Glucides, Lipides) signalent une sortie de ±10 %, en dessous comme au-dessus, afin de soutenir ma prise de poids.
51. En tant qu'utilisateur, je veux que les Cibles (Protéines, Fibres, Hydratation) ne déclenchent pas d'alerte en journée, afin de ne pas être harcelé le matin.
52. En tant qu'utilisateur, je veux un récapitulatif de la Semaine (lundi–dimanche) face à l'Objectif hebdomadaire, avec un mini-graphique par jour, afin de voir ma tendance.
53. En tant qu'utilisateur, je veux une moyenne globale par Journée, calculée uniquement sur les Journées où au moins un Repas est enregistré, afin qu'un oubli ne la fausse pas.
54. En tant qu'utilisateur, je veux choisir la période de la moyenne globale (30 jours par défaut, 90 jours, tout l'historique), afin de voir ma tendance de fond.
55. En tant qu'utilisateur, je veux voir mes pas du jour et ma courbe de poids, afin de relier activité, poids et alimentation.

### Health Connect

56. En tant qu'utilisateur, je veux que l'app lise mes pas depuis Health Connect, afin de ne pas les saisir.
57. En tant qu'utilisateur, je veux que les mesures de poids présentes dans Health Connect créent des Pesées, afin que ma balance ou une autre app alimente mon suivi.
58. En tant qu'utilisateur, je veux que l'activité lue n'ajuste pas mes Objectifs, afin qu'ils restent stables d'un jour à l'autre.

### Rendez-vous du samedi

59. En tant qu'utilisateur, je veux qu'un Rendez-vous du samedi soit généré automatiquement le samedi à partir de 6 h dans mon fuseau, afin de trouver mon plan de la semaine au réveil.
60. En tant qu'utilisateur, je veux un Bilan de la semaine sur la Période d'analyse (les 7 derniers jours), qui explique ce qui a orienté les Recettes, afin de comprendre les choix.
61. En tant qu'utilisateur, je veux 3 Recettes de cuisine africaine adaptées aux Règles du médecin, couvrant 10 portions de déjeuners et dîners, afin de faire mon batch cooking.
62. En tant qu'utilisateur, je veux que chaque Recette indique ingrédients, étapes courtes, nutriments estimés par portion, nombre de portions, conservation (réfrigérateur ou congélation) et ordre de consommation conseillé, afin de cuisiner et de stocker sans risque.
63. En tant qu'utilisateur, je veux des petits-déjeuners : une Recette de Petit-déjeuner nomade pour 3 portions (à manger en marchant ou dans les transports) et 2 idées rapides pour les 4 autres matins, afin de bien démarrer la journée.
64. En tant qu'utilisateur, je veux modifier dans les réglages le nombre de Recettes, de portions, de Petits-déjeuners nomades et de petits-déjeuners rapides, afin d'adapter le plan à ma semaine.
65. En tant qu'utilisateur, je veux que les Recettes et petits-déjeuners de la semaine deviennent automatiquement des Plats de la semaine (une portion chacun), afin de les enregistrer en un geste.
66. En tant qu'utilisateur, je veux que les Recettes des 3 dernières semaines ne soient pas reproposées, sauf celles que j'ai marquées « à refaire », afin d'avoir de la variété.
67. En tant qu'utilisateur, je veux marquer une Recette « à refaire », afin qu'elle puisse revenir.
68. En tant qu'utilisateur, je veux enregistrer une Recette comme Plat permanent, afin de la garder au-delà de la semaine.
69. En tant qu'utilisateur, je veux demander une nouvelle génération du Rendez-vous, afin d'obtenir d'autres propositions.
70. En tant qu'utilisateur, je veux que le Rendez-vous soit enregistré directement sans validation, afin de ne rien avoir à faire le samedi matin.
71. En tant qu'utilisateur, je veux que la génération soit réessayée automatiquement en cas d'échec, et lancée à la demande si elle n'est toujours pas prête à l'ouverture de l'app, afin de toujours obtenir mon Rendez-vous.
72. En tant qu'utilisateur, je veux qu'un Rendez-vous ne soit jamais généré deux fois pour la même semaine par le traitement automatique, afin de ne pas perdre mes cases cochées.
73. En tant qu'utilisateur, je veux consulter les Rendez-vous des semaines passées, afin de retrouver une Recette.

### Liste de courses

74. En tant qu'utilisateur, je veux une Liste de courses rangée par Recette (Recettes, puis Petits-déjeuners, puis Ajouts manuels), afin de cuisiner Recette par Recette.
75. En tant qu'utilisateur, je veux qu'un ingrédient commun à plusieurs Recettes apparaisse dans chacune avec sa propre case, avec l'indication du total (« oignon : 3 au total »), afin d'acheter la bonne quantité au marché.
76. En tant qu'utilisateur, je veux cocher et décocher les articles, afin de suivre mes achats.
77. En tant qu'utilisateur, je veux ajouter des articles à la main, afin de compléter la liste.
78. En tant qu'utilisateur, je veux sélectionner les Recettes à inclure (toutes par défaut), afin de ne pas acheter pour une Recette que je ne ferai pas.
79. En tant qu'utilisateur, je veux que désélectionner une Recette recalcule la liste sans perdre mes cases cochées ni mes ajouts manuels, afin de ne pas tout refaire.

### Notifications

80. En tant qu'utilisateur, je veux une notification à 10 h (petit-déjeuner, verre d'eau, objectif du jour), afin de bien démarrer.
81. En tant qu'utilisateur, je veux une notification à 14 h (saisie du déjeuner, Hydratation), afin de ne pas oublier ma saisie.
82. En tant qu'utilisateur, je veux une notification à 21 h avec les quotas restants pour le dîner, les Cibles non atteintes et un rappel d'eau, afin d'ajuster mon dernier repas.
83. En tant qu'utilisateur, je veux que la notification du soir soit reprogrammée avec des chiffres à jour à chaque enregistrement de Repas ou d'eau, afin qu'elle ne soit jamais périmée.
84. En tant qu'utilisateur, je veux une notification le samedi à 9 h pour mon Rendez-vous du samedi, afin de penser à mes courses.
85. En tant qu'utilisateur, je veux modifier l'heure de chaque notification et en désactiver certaines, afin de les adapter à mon rythme.

### Hors ligne

86. En tant qu'utilisateur, je veux que l'app s'ouvre instantanément et reste consultable sans réseau, afin de l'utiliser partout.
87. En tant qu'utilisateur, je veux consulter et cocher ma Liste de courses sans réseau, afin de l'utiliser au marché.
88. En tant qu'utilisateur, je veux ajouter de l'eau et enregistrer un Repas à partir d'un Plat sans réseau, ce Repas étant compté tout de suite dans les jauges, afin de ne pas perdre de saisies.
89. En tant qu'utilisateur, je veux qu'un Repas saisi en texte ou en photo sans réseau devienne un Repas en attente, analysé et enregistré automatiquement au retour du réseau, afin de ne rien avoir à refaire.
90. En tant qu'utilisateur, je veux que les Repas en attente ne comptent pas dans les jauges tant qu'ils ne sont pas analysés, afin d'éviter des chiffres faux.
91. En tant qu'utilisateur, je veux voir les jauges du jour calculées en local hors ligne, avec l'heure de la dernière synchro, afin de savoir sur quoi je m'appuie.
92. En tant qu'utilisateur, je veux que les actions faites hors ligne soient rejouées dans l'ordre au retour du réseau, afin que mes données serveur soient complètes.
93. En tant qu'utilisateur, je veux que la modification des Objectifs, du Profil et des Règles du médecin ne soit possible qu'en ligne, afin d'éviter les incohérences.

### Compte, photos et données

94. En tant qu'utilisateur, je veux me connecter une fois avec e-mail et mot de passe et rester connecté, afin de ne pas me reconnecter sans cesse.
95. En tant qu'utilisateur, je veux que personne d'autre ne puisse créer de compte ni lire mes données, afin de protéger mes données de santé.
96. En tant qu'utilisateur, je veux que mes photos d'assiettes soient conservées (compressées), afin de revoir un Repas ou de relancer une analyse.
97. En tant qu'utilisateur, je veux exporter toutes mes données (ZIP de CSV), afin d'avoir une sauvegarde.
98. En tant qu'utilisateur, je veux un rappel mensuel d'export, afin de ne pas oublier de sauvegarder.

## Implementation Decisions

### Architecture générale

- App Android en **Expo + TypeScript**, distribuée par APK. Une build de développement (pas Expo Go) est nécessaire pour Health Connect.
- Backend entièrement **Supabase** (ADR 0001) : Postgres, Storage, Auth, Edge Functions, `pg_cron`. Pas de serveur à héberger.
- Le backend vit dans le repo (migrations SQL, fonctions) et se déploie avec la Supabase CLI. Seuls les secrets (clé Gemini) sont configurés hors du repo.
- La clé Gemini n'existe que dans les secrets des Edge Functions, jamais dans l'app.

### Modules

1. **Noyau métier** (TypeScript pur, sans I/O), partagé entre l'app et les Edge Functions. C'est le module profond qui porte la logique :
   - calcul des Objectifs journaliers à partir du Profil et de l'Objectif de poids ; Objectif hebdomadaire = ×7 ;
   - sens de chaque nutriment (Plafond, Cible, Plage) et état d'une jauge (normal, approche, dépassement, hors plage) selon les seuils (80 % / 100 % pour les Plafonds, ±10 % pour les Plages) ;
   - totaux d'un Repas à partir des Constituants, application d'un Coefficient de portion, recalcul proportionnel d'un Constituant dont la quantité change ;
   - rattachement à la Journée, à la Semaine et à la Période d'analyse selon un fuseau, Type de repas selon l'heure ;
   - moyenne globale sur les Journées renseignées ;
   - construction de la Liste de courses (sections par Recette, totaux des ingrédients communs, conservation des cases cochées et ajouts manuels lors d'un recalcul) ;
   - règle de variété (exclusion des Recettes des 3 dernières semaines sauf « à refaire ») ;
   - décision de génération du Rendez-vous (samedi, ≥ 6 h dans le fuseau du Profil, pas déjà généré pour cette semaine) ;
   - contenu de la notification du soir (quotas restants, Cibles non atteintes).
2. **Port IA** : une seule interface vers Gemini, avec trois opérations : analyser un Repas, proposer des Objectifs, générer un Rendez-vous du samedi. Chaque opération utilise une sortie JSON à schéma imposé et reçoit toujours les Règles du médecin actives, avec la consigne qu'elles priment sur les repères par défaut. Une implémentation réelle (Gemini) et une implémentation factice pour les tests.
3. **Edge Functions** :
   - `analyser-repas` : reçoit l'identifiant d'un Repas (texte, note, photo en Storage), construit le contexte (Règles actives, Objectifs restants du jour), appelle le Port IA et **écrit** les Constituants, les totaux et le Commentaire du repas dans le Repas (ADR 0003). Sert aussi à relancer une analyse avec une précision.
   - `proposer-objectifs` : renvoie une proposition d'Objectifs ; **n'écrit rien**, l'app applique seulement après validation explicite.
   - `generer-rendez-vous` : idempotente par semaine pour le traitement automatique ; peut être forcée pour une nouvelle génération. Écrit en une transaction le Bilan de la semaine, les Recettes, les petits-déjeuners, les Plats de la semaine et la Liste de courses.
4. **Base Postgres** : une table par concept du glossaire (Profil, Pesée, Objectif journalier, Règle du médecin, Repas, Constituant, Plat et ses Constituants, Hydratation, Rendez-vous du samedi, Recette et ses ingrédients, article de Liste de courses, Réglages). Des **vues SQL** calculent les totaux du jour, de la Semaine et la moyenne globale. RLS sur toutes les tables, liée à l'utilisateur authentifié.
5. **Planification** : un job `pg_cron` s'exécute chaque heure du vendredi soir au samedi midi (UTC) et appelle `generer-rendez-vous`. La fonction décide elle-même via le noyau métier s'il faut générer. Cela couvre les nouveaux essais et l'heure d'été.
6. **Synchronisation de l'app** : cache `expo-sqlite` en lecture + file d'envoi (ADR 0002). Elle expose : lecture des données en cache, mise en file d'une action, rejeu ordonné au retour du réseau, rafraîchissement du cache à l'ouverture et après chaque écriture. La dernière écriture l'emporte.
7. **Intégration Health Connect** : lecture seule des pas et du poids ; les nouvelles mesures de poids sont envoyées comme Pesées (sans doublon).
8. **Notifications locales** : programmées sur le téléphone ; celle du soir est reprogrammée après chaque enregistrement de Repas ou d'eau, à partir des données locales.
9. **Interface** : 5 onglets (Dashboard, Saisie rapide « + », Objectifs & Profil, Règles du médecin, Rendez-vous du samedi & Liste de courses), plus un écran Réglages (heures de notifications, paramètres du samedi, export).

### Règles de données

- Les quantités des Constituants sont stockées en grammes ou en millilitres, avec un libellé d'équivalent en mesure de cuisine fourni par l'IA.
- Un Repas a un statut : en attente (pas encore analysé, exclu des jauges) ou analysé.
- Un Repas créé depuis un Plat est une copie : aucun lien qui propagerait une modification du Plat.
- Les Objectifs journaliers n'ont de nouvelle valeur qu'après validation explicite ; seuls les seuils chiffrés y vivent, les Règles du médecin sont du texte libre.
- Les photos sont compressées sur le téléphone (environ 1600 px) avant envoi dans un bucket privé et conservées.
- Les nombres du Rendez-vous (3 Recettes, 10 portions, 3 Petits-déjeuners nomades, 4 rapides, 2 portions par défaut quand pertinent) sont des Réglages.
- La Recette nomade est une Recette préparée en avance ; les idées rapides couvrent les autres matins.
- Les heures de notification par défaut : 10 h, 14 h, 21 h, samedi 9 h.
- L'export produit un ZIP de CSV (une table par fichier) enregistrable via le partage Android.

## Testing Decisions

- Un bon test vérifie un comportement observable depuis l'extérieur du module (entrées → sorties, ou état de la base après un appel), jamais les détails internes. Les tests ne doivent pas casser lors d'une refonte interne qui ne change pas le comportement.
- **Frontière 1, noyau métier (principale)** : tests unitaires rapides couvrant toutes les règles listées au module 1, notamment les cas limites (Repas à 23 h 59 / 00 h 00, changement d'heure, semaine à cheval sur deux mois, Coefficient de portion, ingrédient commun à 3 Recettes, Recette « à refaire » dans les 3 dernières semaines, samedi 5 h 59 vs 6 h 00, Rendez-vous déjà généré).
- **Frontière 2, backend Supabase en local** : tests d'intégration qui appellent les Edge Functions par HTTP avec le Port IA en implémentation factice (réponses JSON prédéfinies) et vérifient la base : Repas analysé avec ses Constituants et son Commentaire, relance d'analyse, `proposer-objectifs` qui n'écrit rien, Rendez-vous créé une seule fois par semaine, nouvelle génération forcée, RLS qui bloque un accès non authentifié, vues de jauges correctes.
- **Frontière 3, synchronisation de l'app** : SQLite en mémoire et faux Supabase ; vérifier la mise en file, le rejeu ordonné, l'analyse automatique des Repas en attente au retour du réseau, les jauges calculées hors ligne, le refus des modifications d'Objectifs/Profil/Règles hors ligne.
- Pas de tests automatisés de l'interface en V1 : vérification manuelle sur le téléphone.
- Pas de code existant : aucun test antérieur ne sert de modèle. Ces trois suites deviennent la référence.

## Out of Scope

- iOS et tout autre utilisateur que moi.
- Ajustement des Objectifs selon l'activité mesurée (pas, calories actives).
- Ancrage des estimations sur des tables de référence (table FAO Afrique de l'Ouest, Ciqual) : Gemini seul en V1.
- Export vers Google Sheets ; sauvegarde automatique côté serveur.
- Notifications push serveur (Firebase / Expo push).
- Architecture hors ligne d'abord avec synchronisation dans les deux sens.
- Modification hors ligne des Objectifs, du Profil et des Règles du médecin.
- Tests automatisés de l'interface.
- Avertissement médical dans l'app.
- Suivi du cholestérol alimentaire, des acides gras trans et des sucres en jauges (l'IA peut les mentionner dans les Commentaires).

## Further Notes

- Repères par défaut des Objectifs (les Règles du médecin priment) : AGS < 7–10 % de l'énergie, Fibres ≥ 25–30 g/jour, Sel < 5 g/jour, Protéines ~1–1,2 g/kg, Glucides ~45–55 % et Lipides ~30–35 % de l'énergie. +2 kg en 6 mois ≈ +85 kcal/jour.
- À vérifier avant l'implémentation : l'absence de sauvegarde automatique sur l'offre gratuite de Supabase, le modèle Gemini à utiliser (vision + sortie JSON structurée), et l'état de l'API Google Fit (remplacée par Health Connect).
- Un projet Supabase gratuit se met en pause après 7 jours sans activité ; sans effet avec un usage quotidien.
- Les estimations de l'IA sur photo sont approximatives, surtout pour les plats en sauce ; la note sur la photo, les Plats réutilisables et la correction après coup sont les leviers de précision.
