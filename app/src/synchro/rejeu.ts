// Rejeu de la file d'envoi au retour du réseau, dans l'ordre des actions.
import type { CacheLocal, EnvoiEnAttente } from "./cache-local.ts";
import { limiteDeTentatives, type Envoi } from "./envois.ts";

export type BilanDeRejeu = { envoyes: number; restants: number; horsLigne: boolean };

const TENTATIVES_MAX = 5;
const PREMIER_DELAI_MS = 30_000;
const DELAI_MAX_MS = 60 * 60_000;

function messageDe(erreur: unknown): string {
  if (typeof erreur === "object" && erreur !== null && "message" in erreur) return String(erreur.message);
  return String(erreur);
}

/** Après un refus, on attend 30 s, puis 1 min, 2 min… jusqu'à 1 h, avant de retenter (une IA en panne, par exemple). */
function enAttenteDeNouvelEssai({ tentatives, dernierEchecLe }: EnvoiEnAttente, maintenant: Date): boolean {
  if (tentatives === 0 || !dernierEchecLe) return false;
  const delai = Math.min(PREMIER_DELAI_MS * 2 ** (tentatives - 1), DELAI_MAX_MS);
  return maintenant.getTime() < dernierEchecLe.getTime() + delai;
}

/**
 * Envoie chaque action en attente, de la plus ancienne à la plus récente.
 * - Sans réseau, le rejeu s'arrête : l'action et les suivantes restent en file, dans le même ordre.
 * - Refusée par le serveur, l'action est retentée plus tard (délai croissant) sans bloquer les autres ; voir
 *   `limiteDeTentatives` pour celles qui finissent par être abandonnées.
 */
export async function rejouer(
  cache: CacheLocal,
  executer: (envoi: Envoi) => Promise<void>,
  estErreurReseau: (erreur: unknown) => boolean,
  { tentativesMax = TENTATIVES_MAX, maintenant = new Date() } = {},
): Promise<BilanDeRejeu> {
  const enAttente = await cache.envoisEnAttente();
  let envoyes = 0;
  for (const enFile of enAttente) {
    const { id, envoi, tentatives } = enFile;
    if (enAttenteDeNouvelEssai(enFile, maintenant)) continue;
    try {
      await executer(envoi);
      await cache.retirerEnvoi(id);
      envoyes++;
    } catch (erreur) {
      if (estErreurReseau(erreur)) return { envoyes, restants: (await cache.envoisEnAttente()).length, horsLigne: true };
      if (tentatives + 1 >= limiteDeTentatives(envoi, erreur, tentativesMax)) {
        console.warn(`envoi abandonné après ${tentatives + 1} refus :`, messageDe(erreur));
        await cache.retirerEnvoi(id);
      } else {
        await cache.noterEchec(id, messageDe(erreur), maintenant);
      }
    }
  }
  return { envoyes, restants: (await cache.envoisEnAttente()).length, horsLigne: false };
}
