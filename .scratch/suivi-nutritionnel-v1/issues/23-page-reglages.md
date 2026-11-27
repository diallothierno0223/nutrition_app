# 23: Page Réglages unique

**What to build:** Une seule page Réglages, rangée par sections, où je retrouve tout ce qui se configure dans l'app. Les autres écrans n'affichent plus de réglages : ils renvoient vers la bonne section de cette page.

**Blocked by:** None (can start immediately)

**Status:** needs-triage

Réglages aujourd'hui dispersés :

- Page Réglages (`app/src/app/reglages.tsx`) : notifications, Health Connect, réglages du samedi.
- Onglet Samedi : réglages du samedi, en double avec la page Réglages.
- Onglet Objectifs : Profil (taille, naissance, échéance, souhaits) et Pesées.
- Onglet Règles : Règles du médecin et date de consultation.
- Aucun endroit pour le compte (déconnexion) ni pour l'export (ticket 20).

- [ ] Définir les sections et leur ordre (ex. : Compte, Profil, Notifications, Santé connectée, Rendez-vous du samedi, Données).
- [ ] Déplacer les réglages dispersés dans ces sections ; supprimer les doublons.
- [ ] Accès à la page depuis un endroit fixe et visible (onglet ou icône d'en-tête), pas seulement depuis le Dashboard.
- [ ] Prévoir la place de l'export des données (ticket 20).
