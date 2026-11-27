// Health Connect (ticket 19) : les mesures de poids deviennent des Pesées, sans doublon. Les pas ne sont qu'affichés :
// l'activité n'ajuste jamais les Objectifs.
import { journeeDe } from "./journee.ts";

export type MesureDePoids = { instant: string; kg: number };
export type PeseeAImporter = { pese_le: string; poids_kg: number };

export const POIDS_MIN_KG = 20;
export const POIDS_MAX_KG = 400;

/**
 * Les Pesées à créer : une par Journée (la dernière mesure du jour, arrondie à 100 g), seulement pour les Journées
 * qui n'ont pas encore de Pesée. Une Pesée existante (saisie à la main ou déjà importée) n'est jamais remplacée.
 */
export function peseesAImporter(
  mesures: readonly MesureDePoids[],
  existantes: readonly PeseeAImporter[],
  fuseau: string,
): PeseeAImporter[] {
  const dejaPesees = new Set(existantes.map((p) => p.pese_le));
  const derniereDuJour = new Map<string, MesureDePoids>();
  for (const mesure of mesures) {
    if (mesure.kg < POIDS_MIN_KG || mesure.kg > POIDS_MAX_KG) continue;
    const journee = journeeDe(new Date(mesure.instant), fuseau);
    const actuelle = derniereDuJour.get(journee);
    if (!actuelle || Date.parse(mesure.instant) > Date.parse(actuelle.instant)) derniereDuJour.set(journee, mesure);
  }
  return [...derniereDuJour.entries()]
    .filter(([journee]) => !dejaPesees.has(journee))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([journee, mesure]) => ({ pese_le: journee, poids_kg: Math.round(mesure.kg * 10) / 10 }));
}
