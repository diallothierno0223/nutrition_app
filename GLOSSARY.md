# Suivi nutritionnel anti-cholestérol

Application personnelle (un seul utilisateur) de suivi nutritionnel, centrée sur le contrôle d'un cholestérol d'origine génétique, avec des suggestions de cuisine africaine adaptées.

## Langage

### Journal

**Repas** :
Ce que l'utilisateur a mangé à un moment donné, décrit librement en texte et/ou en photo, puis décomposé en Constituants.
_À éviter_ : Plat (sauf pour un Repas réutilisable), entrée, saisie

**Note** :
Le texte facultatif qui accompagne la photo d'un Repas (huile, cuisson, sauce, quantité). Elle tient la place de la description texte et l'IA la lit avec la photo.
_À éviter_ : Légende, commentaire (réservé au Commentaire du repas)

**Constituant** :
Un aliment d'un Repas, avec sa quantité estimée et ses valeurs nutritionnelles. Les totaux d'un Repas sont la somme de ses Constituants.
_À éviter_ : Ingrédient, aliment, composant

**Plat** :
Un modèle réutilisable de Repas (par exemple un plat de batch cooking), avec ses Constituants pour une portion. Réutiliser un Plat en copie les Constituants dans un nouveau Repas ; modifier le Plat ne change jamais les Repas déjà enregistrés.
_À éviter_ : Recette (réservé aux suggestions du samedi), repas global, modèle

**Coefficient de portion** :
Le multiplicateur (×0,5, ×1,5…) appliqué aux Constituants d'un Plat quand on le réutilise dans un Repas.
_À éviter_ : Ratio, facteur

**Commentaire du repas** :
Une courte appréciation d'un Repas par l'IA : point fort, point faible, amélioration possible, au regard des Règles du médecin.
_À éviter_ : Avis, feedback, analyse

**Hydratation** :
L'eau et les boissons sans calories (thé, tisane non sucrés) bues pendant une Journée. Toute boisson qui apporte des calories est un Repas.
_À éviter_ : Boissons

**Repas en attente** :
Un Repas saisi sans réseau, pas encore analysé par l'IA. Il n'est pas compté dans les jauges.
_À éviter_ : Brouillon, repas hors ligne

**Type de repas** :
Petit-déjeuner, déjeuner, dîner ou collation. Il est déduit de l'heure du Repas et modifiable.
_À éviter_ : Moment, créneau

**Plats de la semaine** :
Les Recettes du dernier Rendez-vous du samedi, automatiquement disponibles comme Plats (une portion chacune) en tête de la saisie rapide.
_À éviter_ : Batch, restes

**Journal des repas** :
L'historique chronologique de tous les Repas enregistrés.
_À éviter_ : Historique, log

**Journée** :
La période de 00 h 00 à 23 h 59 dans le fuseau horaire du téléphone, à laquelle chaque Repas est rattaché.
_À éviter_ : Jour calendaire

**Semaine** :
Les Journées du lundi au dimanche de la semaine en cours, utilisées par le récapitulatif du Dashboard et l'Objectif hebdomadaire.
_À éviter_ : 7 derniers jours (c'est la Période d'analyse)

### Objectifs

**Profil** :
Les données corporelles et personnelles de l'utilisateur (poids, taille, âge, sexe, niveau d'activité) qui servent à estimer les Objectifs journaliers.
_À éviter_ : Compte, fiche patient

**Objectifs personnels** :
Ce que l'utilisateur veut obtenir, en texte libre (« réduire le sucre », « prendre 2 kg en 6 mois »). L'IA s'en sert pour estimer les Objectifs journaliers.
_À éviter_ : Buts, souhaits, Objectifs (seul, ambigu avec Objectifs journaliers)

**Estimation des Objectifs** :
La proposition d'Objectifs journaliers faite par l'IA à partir du Profil, des Objectifs personnels et des Règles du médecin. Elle ne s'applique qu'après validation de l'utilisateur.
_À éviter_ : Calcul des objectifs, recommandation

**Pesée** :
Une mesure datée du poids de l'utilisateur. Le poids du Profil est celui de la dernière Pesée.
_À éviter_ : Mesure, relevé

**Objectif de poids** :
La variation de poids visée et son échéance (par exemple +2 kg en 6 mois), chiffrée pour la courbe de poids. Elle complète les Objectifs personnels.
_À éviter_ : But, cible de poids

**Objectif journalier** :
La valeur cible ou le plafond d'un nutriment (ou de l'eau) pour une Journée. C'est la seule source des seuils chiffrés.
_À éviter_ : Quota, limite, seuil (dans les Règles du médecin)

**Objectif hebdomadaire** :
L'Objectif journalier multiplié par 7. Il n'est jamais saisi directement.
_À éviter_ : Quota hebdo

**Plafond** :
Un Objectif journalier à ne pas dépasser (AGS, Sucres, Sel).
_À éviter_ : Limite, maximum

**Cible** :
Un Objectif journalier à atteindre au minimum (Protéines, Fibres, Hydratation).
_À éviter_ : Minimum, quota

**Plage** :
Un Objectif journalier à respecter à ±10 % près, en dessous comme au-dessus (Calories, Glucides, Lipides).
_À éviter_ : Fourchette, intervalle

**Règles du médecin** :
Les consignes médicales en texte libre (aliments à privilégier ou à éviter, conseils). Elles guident l'IA et ne contiennent pas de seuils chiffrés.
_À éviter_ : Prescription, recommandations médecin

### Rendez-vous du samedi

**Rendez-vous du samedi** :
L'ensemble produit chaque samedi matin : un Bilan de la semaine, des Recettes suggérées, des suggestions de petit-déjeuner et une Liste de courses.
_À éviter_ : Menu de la semaine, planning

**Recette** :
Un plat suggéré par l'IA lors du Rendez-vous du samedi, avec ingrédients, étapes et nutriments estimés par portion. Une Recette peut être enregistrée comme Plat.
_À éviter_ : Plat (avant enregistrement), suggestion, menu

**Petit-déjeuner nomade** :
Un petit-déjeuner suggéré qui se mange en marchant ou dans les transports. Les autres petits-déjeuners suggérés sont simplement rapides à préparer.
_À éviter_ : Petit-déjeuner à emporter, snack

**Bilan de la semaine** :
Le court texte qui résume la Période d'analyse et explique ce qui a orienté les Recettes.
_À éviter_ : Rapport, résumé

**Liste de courses** :
La liste des ingrédients des Recettes sélectionnées et des petits-déjeuners suggérés, rangée par Recette, avec cases à cocher et articles ajoutés à la main.
_À éviter_ : Panier, liste d'achats

**Période d'analyse** :
Les 7 Journées qui précèdent le samedi (du samedi précédent au vendredi), sur lesquelles se fondent les suggestions de la semaine.
_À éviter_ : Semaine écoulée, lundi–vendredi
