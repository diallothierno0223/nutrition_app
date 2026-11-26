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

/** Un équivalent en cuisine lu : « 1,5 louche » donne 1,5 et « louche » (ustensile toujours au singulier). */
export type EquivalentCuisine = { nombre: number; ustensile: string };

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };

/** « louches » → « louche », « cuillères à soupe » → « cuillère à soupe » ; les abréviations restent telles quelles. */
function auSingulier(ustensile: string): string {
  return ustensile.replace(/^([^\s.]{3,}?)s(?=\s|$)/, "$1");
}

/** « louche » → « louches » à partir de 2 ; les abréviations (« c. à soupe ») sont invariables. */
function accorder(ustensile: string, nombre: number): string {
  return nombre >= 2 ? ustensile.replace(/^([^\s.]+?)(?<![sx])(?=\s|$)/, "$1s") : ustensile;
}

/** Lit le nombre en tête d'un équivalent en cuisine (« 2 louches », « 1 1/2 bol », « ½ bol ») ; null sinon. */
export function lireEquivalentCuisine(equivalent: string): EquivalentCuisine | null {
  const lu = /^\s*(?:(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)|(\d+(?:[.,]\d+)?)|([½¼¾]))\s+(.+?)\s*$/.exec(equivalent);
  if (!lu) return null;
  const [, entier, numMixte, denMixte, num, den, decimal, symbole, ustensile = ""] = lu;
  let nombre: number;
  if (entier && numMixte && denMixte) nombre = Number(entier) + Number(numMixte) / Number(denMixte);
  else if (num && den) nombre = Number(num) / Number(den);
  else if (decimal) nombre = Number(decimal.replace(",", "."));
  else nombre = FRACTIONS[symbole ?? ""] ?? NaN;
  return Number.isFinite(nombre) && nombre > 0 ? { nombre, ustensile: auSingulier(ustensile) } : null;
}

/** L'équivalent réécrit pour un nouveau nombre, au centième près ; vide s'il devient trop petit pour s'écrire. */
function ecrireEquivalent({ ustensile }: EquivalentCuisine, nombre: number): string {
  const arrondiNombre = arrondi(nombre);
  return arrondiNombre > 0 ? `${String(arrondiNombre).replace(".", ",")} ${accorder(ustensile, arrondiNombre)}` : "";
}

/**
 * Corrige la quantité d'un Constituant sans appel à l'IA : nutriments et équivalent en cuisine sont recalculés
 * proportionnellement (l'équivalent reste tel quel s'il n'a pas de nombre lisible).
 */
export function changerQuantite(constituant: Constituant, quantite: number): Constituant {
  if (!(arrondi(quantite) > 0)) throw new Error("La quantité doit être positive.");
  if (!(constituant.quantite > 0)) throw new Error("Ce Constituant n'a pas de quantité de référence.");
  const facteur = quantite / constituant.quantite;
  const equivalent = lireEquivalentCuisine(constituant.equivalent_cuisine);
  const corrige: Constituant = {
    ...constituant,
    quantite: arrondi(quantite),
    equivalent_cuisine: equivalent ? ecrireEquivalent(equivalent, equivalent.nombre * facteur) : constituant.equivalent_cuisine,
  };
  for (const n of NUTRIMENTS) corrige[n] = arrondi(constituant[n] * facteur);
  return corrige;
}

/** Corrige un Constituant en nombre d'ustensiles (« 2 louches » au lieu d'une). */
export function changerEquivalentCuisine(constituant: Constituant, nombre: number): Constituant {
  const equivalent = lireEquivalentCuisine(constituant.equivalent_cuisine);
  if (!equivalent) throw new Error("Cet équivalent en cuisine n'a pas de nombre lisible.");
  return changerQuantite(constituant, (constituant.quantite * nombre) / equivalent.nombre);
}
