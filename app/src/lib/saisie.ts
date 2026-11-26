// Lecture des champs de saisie numériques (virgule française acceptée).

/** Le nombre saisi, null si le champ est vide, undefined s'il est invalide. */
export function lireNombre(texte: string): number | null | undefined {
  const propre = texte.trim().replace(",", ".");
  if (propre === "") return null;
  const valeur = Number(propre);
  return Number.isFinite(valeur) ? valeur : undefined;
}

export const versTexte = (valeur: number | null | undefined): string => (valeur == null ? "" : String(valeur));
