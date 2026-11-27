# 19: Health Connect

**What to build:** L'app lit mes pas et mon poids depuis Health Connect. Je vois mes pas du jour sur le Dashboard, et les mesures de poids créent des Pesées sans doublon. L'activité n'ajuste pas mes Objectifs.

**Blocked by:** 08

**Status:** done

- [x] Vérifier et documenter l'état de l'API Google Fit et confirmer Health Connect comme source.
- [x] Demande de permissions Health Connect (pas, poids) en lecture seule.
- [x] Pas du jour affichés sur le Dashboard.
- [x] Nouvelles mesures de poids envoyées comme Pesées, sans doublon (même date et même valeur).
- [x] Aucun effet sur les Objectifs.

## Avancement

Fait (non vérifié sur le téléphone ; demande la nouvelle build EAS). État de Google Fit documenté dans `docs/health-connect.md` : API retirées en 2026, Health Connect est la source. `react-native-health-connect` (v4, plugin Expo), lecture seule des pas et du poids, `minSdkVersion` 26. Autorisation et import à la demande dans Réglages → Health Connect. Le Dashboard affiche les pas du jour et importe, à chaque chargement, les mesures de poids des 30 derniers jours : une Pesée par Journée (dernière mesure du jour), jamais sur une Journée qui a déjà une Pesée (règle du noyau, testée). Aucun effet sur les Objectifs.
