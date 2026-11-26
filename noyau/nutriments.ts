/** Les 7 nutriments suivis en V1 (voir GLOSSARY.md). */
export const NUTRIMENTS = [
  "calories",
  "proteines",
  "glucides",
  "lipides",
  "ags",
  "fibres",
  "sel",
] as const;

export type Nutriment = (typeof NUTRIMENTS)[number];

/** Plafond : à ne pas dépasser. Cible : à atteindre. Plage : à ±10 %. */
export type Sens = "plafond" | "cible" | "plage";

const SENS: Record<Nutriment, Sens> = {
  calories: "plage",
  proteines: "cible",
  glucides: "plage",
  lipides: "plage",
  ags: "plafond",
  fibres: "cible",
  sel: "plafond",
};

export function sensDuNutriment(nutriment: Nutriment): Sens {
  return SENS[nutriment];
}

const LIBELLES: Record<Nutriment, string> = {
  calories: "Calories",
  proteines: "Protéines",
  glucides: "Glucides",
  lipides: "Lipides",
  ags: "AGS",
  fibres: "Fibres",
  sel: "Sel",
};

/** Le libellé affiché du nutriment (jauges, notifications). */
export function libelleDuNutriment(nutriment: Nutriment): string {
  return LIBELLES[nutriment];
}
