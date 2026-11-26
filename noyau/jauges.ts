import { NUTRIMENTS, sensDuNutriment, type Nutriment, type Sens } from "./nutriments.ts";
import type { ValeursNutritionnelles } from "./repas.ts";

/** Les Objectifs journaliers ; null quand l'utilisateur n'en a pas défini pour ce nutriment. */
export type ObjectifsJournaliers = Record<Nutriment, number | null>;

export type EtatDeJauge = "normal" | "approche" | "depasse" | "en_dessous" | "sans_objectif";

export type Jauge = { etat: EtatDeJauge; pourcentage: number | null };

export const SEUIL_APPROCHE_PLAFOND = 80;
export const TOLERANCE_PLAGE = 10;

/**
 * Plafond : approche de 80 % à 100 % inclus, dépassement au-delà.
 * Plage : normale entre 90 % et 110 % inclus, dépassement au-dessus, manque en dessous.
 * Cible : jamais d'alerte en journée.
 */
export function etatDeJauge(nutriment: Nutriment, valeur: number, objectif: number | null): Jauge {
  return etatSelonSens(sensDuNutriment(nutriment), valeur, objectif);
}

/** L'Hydratation (en ml) est une Cible : progression affichée, jamais d'alerte en journée. */
export function jaugeHydratation(totalMl: number, objectifMl: number | null): Jauge {
  return etatSelonSens("cible", totalMl, objectifMl);
}

function etatSelonSens(sens: Sens, valeur: number, objectif: number | null): Jauge {
  if (objectif === null || objectif <= 0) return { etat: "sans_objectif", pourcentage: null };

  const pourcentage = (valeur * 100) / objectif;
  const jauge = (etat: EtatDeJauge): Jauge => ({ etat, pourcentage: Math.round(pourcentage) });

  switch (sens) {
    case "plafond":
      if (pourcentage > 100) return jauge("depasse");
      if (pourcentage >= SEUIL_APPROCHE_PLAFOND) return jauge("approche");
      return jauge("normal");
    case "plage":
      if (pourcentage > 100 + TOLERANCE_PLAGE) return jauge("depasse");
      if (pourcentage < 100 - TOLERANCE_PLAGE) return jauge("en_dessous");
      return jauge("normal");
    case "cible":
      return jauge("normal");
  }
}

/** Ce qui reste dans chaque Objectif du jour ; négatif si l'Objectif est déjà dépassé. */
export function objectifsRestants(
  objectifs: ObjectifsJournaliers,
  consommes: ValeursNutritionnelles,
): ObjectifsJournaliers {
  return Object.fromEntries(
    NUTRIMENTS.map((n) => {
      const objectif = objectifs[n];
      return [n, objectif === null ? null : Math.round((objectif - consommes[n]) * 100) / 100];
    }),
  ) as ObjectifsJournaliers;
}
