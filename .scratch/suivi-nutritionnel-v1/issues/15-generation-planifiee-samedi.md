# 15: Génération planifiée du samedi

**What to build:** Sans rien faire, mon Rendez-vous du samedi est prêt le samedi matin. Le serveur le génère à partir de 6 h dans mon fuseau, réessaie en cas d'échec, et ne le génère jamais deux fois. Si rien n'est prêt quand j'ouvre l'app, elle lance la génération et affiche une progression.

**Blocked by:** 12

**Status:** done

- [x] Job `pg_cron` chaque heure du vendredi soir au samedi midi (UTC) qui appelle `generer-rendez-vous` en mode automatique.
- [x] Noyau métier : décision « samedi ≥ 6 h dans le fuseau du Profil et pas déjà généré » (tests : 5 h 59, 6 h 00, heure d'été, déjà généré).
- [x] Un appel automatique ne remplace jamais un Rendez-vous existant (les cases cochées sont préservées).
- [x] À l'ouverture, si le samedi est passé 6 h et que rien n'existe, génération à la demande avec progression.

## Avancement

Fait. Deux jobs `pg_cron` (vendredi 16 h–23 h et samedi 0 h–12 h UTC, chaque heure) appellent `generer-rendez-vous` en mode automatique avec la clé de service lue dans le Vault (`url_projet`, `cle_service`, à créer en production ; voir README). Pour chaque compte, le noyau décide (samedi ≥ 6 h dans le fuseau du Profil, pas déjà généré) ; un Rendez-vous existant n'est jamais remplacé. À l'ouverture de l'onglet Samedi, si le samedi de référence n'a pas de Rendez-vous, l'app le génère avec une progression. Non vérifié : le déclenchement réel par pg_cron (secrets du Vault absents en local) et l'écran sur le téléphone.
