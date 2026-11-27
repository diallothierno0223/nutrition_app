# 23: Page Réglages unique

**What to build:** Une seule page Réglages, rangée par sections, où je retrouve tout ce qui se configure dans l'app. Les autres écrans n'affichent plus de réglages : ils renvoient vers la bonne section de cette page.

**Blocked by:** None (can start immediately)

**Status:** done

Réglages aujourd'hui dispersés :

- Page Réglages (`app/src/app/reglages.tsx`) : notifications, Health Connect, réglages du samedi.
- Onglet Samedi : réglages du samedi, en double avec la page Réglages.
- Onglet Objectifs : Profil (taille, naissance, échéance, souhaits) et Pesées.
- Onglet Règles : Règles du médecin et date de consultation.
- Aucun endroit pour le compte (déconnexion) ni pour l'export (ticket 20).

- [x] Définir les sections et leur ordre (ex. : Compte, Profil, Notifications, Santé connectée, Rendez-vous du samedi, Données).
- [x] Déplacer les réglages dispersés dans ces sections ; supprimer les doublons.
- [x] Accès à la page depuis un endroit fixe et visible (onglet ou icône d'en-tête), pas seulement depuis le Dashboard.
- [x] Prévoir la place de l'export des données (ticket 20).

## Avancement

- Onglet « Réglages » à la place de l'onglet « Médecin » : menu de sections (Profil et Pesées, Règles du médecin, Notifications, Santé connectée, Rendez-vous du samedi, Données, Compte), chacune ouvrant son écran (`app/src/app/reglages/`).
- Objectifs ne garde que les Objectifs, avec un lien vers Profil et Pesées ; Samedi renvoie vers ses réglages ; la déconnexion quitte le Dashboard pour la section Compte.
- Données : place réservée à l'export (ticket 20), non cliquable pour l'instant.
