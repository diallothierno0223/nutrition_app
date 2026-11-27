// Distinguer « pas de réseau » (on garde l'action en file et on réessaiera) d'un refus du serveur.

const MESSAGES_RESEAU = /network request failed|network request timed out|failed to fetch|fetch failed|networkerror|network error|load failed/i;
const NOMS_RESEAU = new Set(["FunctionsFetchError", "AuthRetryableFetchError", "AbortError"]);

/** Vrai si l'erreur vient d'une requête qui n'a pas atteint le serveur (réseau absent, délai dépassé). */
export function estErreurReseau(erreur: unknown): boolean {
  if (typeof erreur !== "object" || erreur === null) return false;
  const { name, message, details } = erreur as { name?: unknown; message?: unknown; details?: unknown };
  if (typeof name === "string" && NOMS_RESEAU.has(name)) return true;
  return [message, details].some((texte) => typeof texte === "string" && MESSAGES_RESEAU.test(texte));
}

/** Refus explicite d'une action réservée au mode en ligne (Objectifs, Profil, Règles du médecin). */
export class HorsLigne extends Error {
  /** `quoi` : « de tes Objectifs », « de ton Profil »… */
  constructor(quoi: string) {
    super(`Pas de réseau : la modification ${quoi} n'est possible qu'en ligne. Réessaie une fois connecté.`);
  }
}

/** Exécute une modification réservée au mode en ligne ; sans réseau, lève `HorsLigne` avec un message clair. */
export async function refuserHorsLigne<T>(quoi: string, modifier: () => Promise<T>): Promise<T> {
  try {
    return await modifier();
  } catch (erreur) {
    if (estErreurReseau(erreur)) throw new HorsLigne(quoi);
    throw erreur;
  }
}

/** Le message à afficher après un échec : celui d'un refus hors ligne, sinon le message prévu par l'écran. */
export function messageDEchec(erreur: unknown, parDefaut: string): string {
  return erreur instanceof HorsLigne ? erreur.message : parDefaut;
}
