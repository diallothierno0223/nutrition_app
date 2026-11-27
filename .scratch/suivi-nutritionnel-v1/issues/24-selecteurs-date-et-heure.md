# 24: Sélecteurs de date et d'heure

**What to build:** Quand je dois saisir une date, un calendrier s'ouvre ; quand je dois saisir une heure, une horloge s'ouvre. Plus aucun champ libre « AAAA-MM-JJ » ou « HH:MM » à taper au clavier.

**Blocked by:** None (can start immediately)

**Status:** needs-triage

Champs libres à remplacer :

- Moment du Repas : date et heure (`components/moment-du-repas.tsx`).
- Heures des notifications (`components/reglages-des-notifications.tsx`).
- Pesée : date (`components/section-pesees.tsx`).
- Profil : date de naissance et échéance (`components/section-profil.tsx`).
- Règles : date de consultation (`app/(onglets)/regles.tsx`).
- Vérifier les réglages du samedi (`components/reglages-du-samedi.tsx`).

- [ ] Choisir le sélecteur natif Android (ex. : `@react-native-community/datetimepicker`, compatible Expo ; nécessite une nouvelle build).
- [ ] Un composant partagé « champ de date » et un « champ d'heure », affichant la valeur au format français (ex. : « samedi 28 novembre », « 21 h 00 »).
- [ ] Remplacer tous les champs listés ; garder le format stocké actuel (AAAA-MM-JJ, HH:MM).
- [ ] Supprimer les messages d'erreur de format devenus inutiles.
