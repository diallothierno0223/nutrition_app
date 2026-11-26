# 10: Carnet des Règles du médecin

**What to build:** Je tiens un carnet de consignes médicales datées (à privilégier, à éviter, conseil). J'archive celles qui ne sont plus valables. Les consignes actives sont envoyées à l'IA à chaque analyse et priment sur les repères par défaut.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Ajouter, modifier, archiver une consigne (catégorie, texte, date de consultation) ; pas de suppression définitive.
- [ ] Consultation des consignes archivées.
- [ ] Les consignes actives sont injectées dans `analyser-repas` avec l'instruction qu'elles priment (testé avec l'IA factice : le contexte envoyé contient les règles actives et pas les archivées).
- [ ] Aucun seuil chiffré n'est stocké dans les Règles (les seuils restent dans les Objectifs).
