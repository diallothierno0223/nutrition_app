# Les résultats de l'IA sont enregistrés directement, la correction se fait après coup

Les estimations de l'IA (Constituants et Commentaire du repas) et les suggestions du Rendez-vous du samedi sont enregistrées directement, sans étape de validation : elles sont considérées comme valides tant que l'utilisateur ne les modifie pas. Nous avons écarté un écran de validation obligatoire avant enregistrement, parce que la saisie doit rester la plus rapide possible pour un utilisateur unique qui corrige surtout par exception.

**Exception :** les Objectifs journaliers proposés (par la formule ou par l'avis de l'IA) ne s'appliquent qu'après validation explicite, parce qu'ils pilotent toutes les jauges et alertes.

## Conséquences

- C'est le serveur (`analyser-repas`) qui écrit les Constituants et le Commentaire dans le Repas. L'app crée le Repas, puis affiche le résultat dès qu'il est disponible, en restant modifiable.
- Un Repas en attente saisi hors ligne est analysé et enregistré automatiquement au retour du réseau, sans action de l'utilisateur.
- Une estimation fausse compte dans les jauges jusqu'à ce qu'elle soit corrigée. Toute modification (quantité, précision et nouvelle analyse) recalcule les totaux.
