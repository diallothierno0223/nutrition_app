// Lecture des champs de saisie numériques (virgule française acceptée).

/** Le nombre saisi, null si le champ est vide, undefined s'il est invalide. */
export function lireNombre(texte: string): number | null | undefined {
  const propre = texte.trim().replace(",", ".");
  if (propre === "") return null;
  const valeur = Number(propre);
  return Number.isFinite(valeur) ? valeur : undefined;
}

/** La valeur à afficher dans un champ, avec la virgule française (« 71,8 ») ; vide si absente. */
export const versTexte = (valeur: number | null | undefined): string =>
  valeur == null ? "" : String(valeur).replace(".", ",");
