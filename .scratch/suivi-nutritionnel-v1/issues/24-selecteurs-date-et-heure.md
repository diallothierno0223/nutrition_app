# 24: Sélecteurs de date et d'heure

**What to build:** Quand je dois saisir une date, un calendrier s'ouvre ; quand je dois saisir une heure, une horloge s'ouvre. Plus aucun champ libre « AAAA-MM-JJ » ou « HH:MM » à taper au clavier.

**Blocked by:** None (can start immediately)

**Status:** done

Champs libres à remplacer :

- Moment du Repas : date et heure (`components/moment-du-repas.tsx`).
- Heures des notifications (`components/reglages-des-notifications.tsx`).
- Pesée : date (`components/section-pesees.tsx`).
- Profil : date de naissance et échéance (`components/section-profil.tsx`).
- Règles : date de consultation (`app/(onglets)/regles.tsx`).
- Vérifier les réglages du samedi (`components/reglages-du-samedi.tsx`).

- [x] Choisir le sélecteur natif Android (ex. : `@react-native-community/datetimepicker`, compatible Expo ; nécessite une nouvelle build).
- [x] Un composant partagé « champ de date » et un « champ d'heure », affichant la valeur au format français (ex. : « samedi 28 novembre », « 21 h 00 »).
- [x] Remplacer tous les champs listés ; garder le format stocké actuel (AAAA-MM-JJ, HH:MM).
- [x] Supprimer les messages d'erreur de format devenus inutiles.

## Avancement

- `@react-native-community/datetimepicker` (sélecteur natif Android) ; composants `ChampDate` et `ChampHeure` (`components/champ-date-heure.tsx`), avec « Effacer » pour les dates facultatives (naissance, échéance).
- Formats français et conversions dans le noyau (`libelleDeJournee`, `libelleDHeure`, `versJournee`, `depuisJournee`, `versHeure`), testés.
- Pas de date future pour un Repas, une Pesée, une naissance ou une consultation.
- Réglages du samedi : uniquement des nombres, rien à remplacer.
