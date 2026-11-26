# Les Objectifs journaliers sont estimés par l'IA, avec la formule comme garde-fou

Nous avions d'abord prévu de calculer les Objectifs journaliers par formule (Mifflin-St Jeor × niveau d'activité, plus un ajustement pour l'Objectif de poids), avec l'IA en simple conseil. Nous avons inversé les rôles : c'est l'IA qui estime les Objectifs à partir du Profil, des Objectifs personnels en texte libre (« réduire le sucre », « prendre 2 kg en 6 mois ») et des Règles du médecin, car une formule ne sait pas traduire ces objectifs. La formule reste calculée par le noyau métier et sert de garde-fou : elle est transmise à l'IA comme repère, et une proposition qui s'en écarte trop est signalée.

## Conséquences

- L'estimation est toujours une **proposition** : elle arrive pré-remplie et modifiable, et ne s'applique qu'avec « Appliquer » (exception de l'ADR 0003).
- Une nouvelle estimation est proposée, jamais appliquée seule, quand le Profil, les Objectifs personnels ou les Règles du médecin changent.
- Remplace les tickets 08 et 09 de la première version du découpage.
