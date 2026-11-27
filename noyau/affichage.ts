// Affichage des nombres et des Objectifs, partagé par tous les écrans et les notifications.
import { TOLERANCE_PLAGE, type EtatDeJauge } from "./jauges.ts";
import { uniteDuNutriment, type Nutriment, type Sens } from "./nutriments.ts";

const ESPACE_INSECABLE = " ";

/**
 * Un nombre à la française : « 1 522,5 ». Arrondi à `decimales` chiffres après la virgule (1 par défaut), sans zéro
 * inutile ; les milliers sont séparés par une espace insécable (le nombre ne se coupe jamais en fin de ligne).
 */
export function formaterNombre(valeur: number, decimales = 1): string {
  const facteur = 10 ** decimales;
  const arrondi = (Math.sign(valeur) * Math.round(Math.abs(valeur) * facteur)) / facteur;
  const [entiere = "0", decimale] = String(Math.abs(arrondi)).split(".");
  const groupee = entiere.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACE_INSECABLE);
  return `${arrondi < 0 ? "-" : ""}${groupee}${decimale ? `,${decimale}` : ""}`;
}

/** Une quantité de nutriment avec son unité : les calories à l'unité, les grammes au dixième. */
export function formaterQuantite(nutriment: Nutriment, valeur: number): string {
  const unite = uniteDuNutriment(nutriment);
  return `${formaterNombre(valeur, unite === "kcal" ? 0 : 1)} ${unite}`;
}

const LIBELLES_DU_SENS: Record<Sens, string> = {
  plafond: "à ne pas dépasser",
  cible: "à atteindre",
  plage: `à ±${TOLERANCE_PLAGE} %`,
};

/** Ce que demande un Objectif, selon son sens : « à ne pas dépasser », « à atteindre », « à ±10 % ». */
export function libelleDuSens(sens: Sens): string {
  return LIBELLES_DU_SENS[sens];
}

/** Un volume d'eau stocké en ml, en litres au centième : « 1,25 L ». */
export function formaterLitres(ml: number): string {
  return `${formaterNombre(ml / 1000, 2)} L`;
}

const LIBELLES_D_ETAT: Partial<Record<EtatDeJauge, string>> = {
  approche: "proche du plafond",
  depasse: "dépassé",
  en_dessous: "en dessous",
};

/** La mention d'une jauge qui mérite qu'on la signale (« dépassé », « proche du plafond », « en dessous ») ; sinon null. */
export function libelleDEtat(etat: EtatDeJauge): string | null {
  return LIBELLES_D_ETAT[etat] ?? null;
}
