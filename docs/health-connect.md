# Pas et poids : Health Connect plutôt que Google Fit

Vérifié le 27 novembre 2026 (ticket 19).

- Google a annoncé la fin des API Google Fit (Android et REST) en 2026. Les nouvelles intégrations doivent passer par **Health Connect**, la plateforme de données de santé sur le téléphone (intégrée à Android 14 et plus, application à installer sur les versions antérieures). Sources : [guide de migration depuis Fit](https://developer.android.com/health-and-fitness/health-connect/migration/fit) et [FAQ de migration](https://developer.android.com/health-and-fitness/guides/health-connect/migrate/migration-faq).
- Google Fit, Samsung Health, les balances connectées, etc. écrivent dans Health Connect : l'app n'a qu'une seule source à lire.
- L'app lit, **en lecture seule**, deux types de données : `Steps` (pas, affichés sur le Dashboard) et `Weight` (poids, importé en Pesées). Elle n'écrit rien dans Health Connect.
- Bibliothèque : `react-native-health-connect` (v4, plugin Expo inclus), `minSdkVersion` 26. Elle demande une build de développement (pas Expo Go).

Règles de l'app :

- une mesure de poids devient une Pesée par Journée (la dernière mesure du jour, arrondie à 100 g) ;
- une Journée qui a déjà une Pesée (saisie à la main ou déjà importée) n'est jamais modifiée : pas de doublon ;
- l'activité (pas) n'ajuste jamais les Objectifs journaliers.
