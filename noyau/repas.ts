import { NUTRIMENTS, type Nutriment } from "./nutriments.ts";

/** Les valeurs des nutriments suivis (calories en kcal, le reste en grammes). */
export type ValeursNutritionnelles = Record<Nutriment, number>;

export type Unite = "g" | "ml";

/** Un aliment d'un Repas, avec sa quantité estimée et ses valeurs nutritionnelles. */
export type Constituant = ValeursNutritionnelles & {
  nom: string;
  quantite: number;
  unite: Unite;
  /** Équivalent en mesure de cuisine (« 1 louche »), fourni par l'IA. */
  equivalent_cuisine: string;
};

const arrondi = (n: number) => Math.round(n * 100) / 100;

/** Retire une partie (un Repas) d'un total (une Journée), nutriment par nutriment. */
export function retirerValeurs(total: ValeursNutritionnelles, part: ValeursNutritionnelles): ValeursNutritionnelles {
  return Object.fromEntries(NUTRIMENTS.map((n) => [n, arrondi(total[n] - part[n])])) as ValeursNutritionnelles;
}

/** Les totaux d'un Repas : la somme des valeurs de ses Constituants. */
export function totauxDuRepas(constituants: readonly ValeursNutritionnelles[]): ValeursNutritionnelles {
  const totaux = Object.fromEntries(NUTRIMENTS.map((n) => [n, 0])) as ValeursNutritionnelles;
  for (const c of constituants) {
    for (const n of NUTRIMENTS) totaux[n] = arrondi(totaux[n] + c[n]);
  }
  return totaux;
}
