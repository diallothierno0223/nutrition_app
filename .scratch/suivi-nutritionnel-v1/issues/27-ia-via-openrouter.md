# 27: IA via OpenRouter, un modèle par tâche et bascule automatique

**What to build:** L'IA passe par OpenRouter au lieu d'appeler Gemini directement. Chaque tâche a sa liste de modèles, essayés dans l'ordre : si un modèle est surchargé, en panne ou limité, le suivant répond, sans que je m'en aperçoive. Budget visé : environ 3 € par mois.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

Contexte (documentation OpenRouter lue le 27 novembre 2026) :

- API compatible OpenAI : `https://openrouter.ai/api/v1/chat/completions`, en-tête `Authorization: Bearer <clé>`.
- Bascule : paramètre `models` (liste par ordre de préférence), déclenchée sur toute erreur ; seul le modèle qui a répondu est facturé.
- JSON imposé : `response_format: { type: "json_schema", json_schema: { name, strict, schema } }` avec `provider.require_parameters: true`, pour n'envoyer qu'à des modèles qui le respectent.
- Photos : partie `image_url` avec une URL `data:image/jpeg;base64,…`.

Modèles retenus au départ (prix OpenRouter du 27 novembre 2026, à confirmer par le ticket 28) :

| Tâche | Modèles, dans l'ordre | Coût estimé |
|---|---|---|
| Analyse d'un Repas (environ 150 par mois) | `openai/gpt-6.1-terra`, `google/gemini-4-hydrogen`, `anthropic/claude-haiku-5.5` | 1,50 à 2 $ par mois |
| Rendez-vous du samedi, estimation des Objectifs (environ 5 par mois) | `anthropic/claude-sonnet-5.5`, `openai/gpt-6.2-sol`, `google/gemini-4-carbon` | quelques centimes |

- [ ] Mode `openrouter` dans le port IA (`supabase/functions/_shared/ia.ts`), à côté de `factice` et `gemini` ; mêmes consignes, mêmes schémas, mêmes validations par le noyau.
- [ ] Listes de modèles par tâche dans des secrets (`OPENROUTER_MODELES_ANALYSE`, `OPENROUTER_MODELES_REDACTION`), avec les listes ci-dessus par défaut : changer de modèle ne demande pas de redéploiement de code.
- [ ] Le modèle qui a réellement répondu est enregistré avec le résultat (ou au moins journalisé), pour suivre la bascule et le coût.
- [ ] Erreurs : une réponse non conforme au schéma reste un échec d'analyse (le Repas reste en attente, comme aujourd'hui) ; délai maximal par appel.
- [ ] Tests : le mode factice reste celui des tests ; un test du mode `openrouter` contre un faux serveur OpenRouter (requête envoyée : modèles, schéma, image ; réponse lue).
- [ ] Documenter dans le README : création de la clé OpenRouter, limite de dépense sur la clé, protection des données (refuser l'entraînement sur les données dans les réglages OpenRouter), secrets à poser. Nouvel ADR « IA via OpenRouter ».
- [ ] Essai réel en local (backend local, clé dans `supabase/functions/.env`, jamais commitée) : une analyse texte, une analyse photo, une estimation d'Objectifs, un Rendez-vous.
