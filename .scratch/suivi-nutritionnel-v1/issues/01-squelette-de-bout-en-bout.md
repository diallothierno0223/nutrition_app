# 01: Squelette de bout en bout

**What to build:** Le premier tracer bullet. J'installe l'app Android (build de développement Expo), je me connecte avec le compte unique et j'arrive sur un Dashboard vide, alimenté par Supabase. Le repo contient tout ce qu'il faut pour les tickets suivants : projet Expo + TypeScript, Supabase (migrations et fonctions dans le repo, déployables avec la CLI), module du noyau métier partagé entre l'app et les Edge Functions, et les 3 harnais de test de la spec (noyau métier, backend Supabase local avec IA factice, synchronisation avec SQLite en mémoire).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] L'app se lance sur Android via une build de développement (pas Expo Go).
- [ ] Connexion par e-mail et mot de passe ; la session reste ouverte après redémarrage de l'app.
- [ ] Les inscriptions sont désactivées ; RLS est activée et un accès non authentifié ne lit rien (testé).
- [ ] Le module du noyau métier est importable depuis l'app et depuis une Edge Function, avec un premier test unitaire.
- [ ] Les 3 suites de test se lancent chacune par une commande documentée dans le README.
- [ ] Les 5 onglets existent (vides) : Dashboard, Saisie « + », Objectifs & Profil, Règles du médecin, Rendez-vous du samedi.
