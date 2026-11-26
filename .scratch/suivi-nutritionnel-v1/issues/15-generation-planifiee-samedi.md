# 15: Génération planifiée du samedi

**What to build:** Sans rien faire, mon Rendez-vous du samedi est prêt le samedi matin. Le serveur le génère à partir de 6 h dans mon fuseau, réessaie en cas d'échec, et ne le génère jamais deux fois. Si rien n'est prêt quand j'ouvre l'app, elle lance la génération et affiche une progression.

**Blocked by:** 12

**Status:** ready-for-agent

- [ ] Job `pg_cron` chaque heure du vendredi soir au samedi midi (UTC) qui appelle `generer-rendez-vous` en mode automatique.
- [ ] Noyau métier : décision « samedi ≥ 6 h dans le fuseau du Profil et pas déjà généré » (tests : 5 h 59, 6 h 00, heure d'été, déjà généré).
- [ ] Un appel automatique ne remplace jamais un Rendez-vous existant (les cases cochées sont préservées).
- [ ] À l'ouverture, si le samedi est passé 6 h et que rien n'existe, génération à la demande avec progression.
