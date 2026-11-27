# 16: Notifications locales

**What to build:** Je reçois des notifications locales à 10 h (petit-déjeuner, eau, objectif du jour), 14 h (saisie du déjeuner, eau), 21 h (quotas restants pour le dîner, Cibles non atteintes, eau) et le samedi à 9 h (Rendez-vous du samedi). Je règle leurs heures et je désactive celles que je veux.

**Blocked by:** 04

**Status:** done

- [x] Programmation locale des 4 notifications aux heures par défaut.
- [x] Réglages : heure modifiable et désactivation par notification.
- [x] La notification du soir est reprogrammée après chaque Repas ou ajout d'eau, avec des chiffres à jour (contenu calculé par le noyau métier, testé).
- [x] Texte neutre pour le samedi (« Ton Rendez-vous du samedi t'attend »).

## Avancement

Fait (non vérifié sur le téléphone ; demande la nouvelle build EAS). `expo-notifications`, canal Android « Rappels ». Matin : quotidienne (Objectifs journaliers) ; samedi : hebdomadaire ; midi et soir : programmées jour par jour sur 14 jours, celle du jour avec les chiffres du moment (eau ; quotas restants des Plafonds et Plages, Cibles à compléter, Plafonds dépassés, eau qui manque ; contenu calculé et testé dans le noyau), les suivantes sans chiffres, toutes remplacées dès que l'app est rouverte. Les reprogrammations passent par une file d'attente, avec des identifiants fixes. La permission est demandée d'office une seule fois, puis à l'enregistrement des réglages. Tout est reprogrammé au chargement du Dashboard (donc après chaque ajout d'eau), après une saisie de Repas, la réutilisation d'un Plat et chaque correction d'un Repas. Réglages (heure, activation) dans le nouvel écran Réglages (bouton en bas du Dashboard), enregistrés dans `reglages.notifications`.
