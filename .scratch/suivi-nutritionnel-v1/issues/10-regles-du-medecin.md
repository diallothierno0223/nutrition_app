# 10: Carnet des Règles du médecin

**What to build:** Je tiens un carnet de consignes médicales datées (à privilégier, à éviter, conseil). J'archive celles qui ne sont plus valables. Les consignes actives sont envoyées à l'IA à chaque analyse et priment sur les repères par défaut.

**Blocked by:** 02

**Status:** done

- [x] Ajouter, modifier, archiver une consigne (catégorie, texte, date de consultation) ; pas de suppression définitive.
- [x] Consultation des consignes archivées.
- [x] Les consignes actives sont injectées dans `analyser-repas` avec l'instruction qu'elles priment (testé avec l'IA factice : le contexte envoyé contient les règles actives et pas les archivées).
- [x] Aucun seuil chiffré n'est stocké dans les Règles (les seuils restent dans les Objectifs).

## Avancement

- **Seuils chiffrés :** l'app **avertit** (sans bloquer) quand une consigne contient une quantité (« 15 g », « 5 grammes », « 1,5 litre », « 7 % »…) et invite à la reporter dans les Objectifs. On ne bloque pas : une consigne médicale peut légitimement contenir un chiffre qui n'est pas un Objectif (« LDL < 1 g/L », une dose de médicament).
- **En plus du ticket :** une consigne archivée peut être réactivée ; le Commentaire de l'IA signale explicitement un aliment que les Règles demandent d'éviter.
- **Non testé automatiquement :** la consigne « elles priment » n'existe que dans l'appel réel à Gemini (pas encore essayé avec une vraie clé).
- `estimer-objectifs` (ticket 08) devra aussi recevoir les Règles actives (`reglesActives` est prêt dans `_shared`).
