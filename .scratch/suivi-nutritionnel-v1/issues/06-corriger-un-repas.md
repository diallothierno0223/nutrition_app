# 06: Corriger un Repas

**What to build:** Après l'analyse, je corrige un Repas si besoin : je modifie la quantité d'un Constituant (recalcul proportionnel sans appel à l'IA), j'ajoute ou supprime un Constituant, j'ajoute une précision et je relance l'analyse, je change la date, l'heure ou le Type de repas, ou je supprime le Repas. Les jauges suivent.

**Blocked by:** 02

**Status:** done

- [x] Modifier une quantité en g/ml ou en mesure de cuisine ; nutriments recalculés proportionnellement par le noyau métier.
- [x] Ajouter / supprimer un Constituant ; totaux recalculés.
- [x] Précision en texte + relance : les Constituants et le Commentaire sont régénérés.
- [x] Une simple modification de quantité ne régénère pas le Commentaire.
- [x] Changement de date/heure (rattachement à la bonne Journée) et du Type de repas.
- [x] Suppression d'un Repas ; jauges et totaux recalculés.
- [x] Tests unitaires du recalcul proportionnel ; test backend de la relance.

## Avancement

Fait (non vérifié sur le téléphone ; aucune nouvelle build nécessaire par rapport au ticket 05). Sur la fiche d'un Repas :
- chaque Constituant se corrige en g/ml ou en nombre d'ustensiles (Équivalent en cuisine), recalcul proportionnel par le noyau, sans IA ni nouveau Commentaire ; ou se supprime ;
- un Constituant oublié s'ajoute à la main (nutriments saisis) ;
- une Précision se saisit puis relance l'analyse (Constituants et Commentaire régénérés ; la Précision est conservée pour les relances suivantes) ;
- date, heure et Type de repas se changent (le Type suit l'heure tant qu'on ne le choisit pas ; la Journée n'est recalculée que si le moment change) ;
- le Repas se supprime après confirmation, avec sa photo.
Les jauges suivent via la vue des totaux du jour.
