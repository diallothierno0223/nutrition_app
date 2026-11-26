// Règles du médecin : consignes en texte libre, sans seuils chiffrés (ceux-ci vivent dans les Objectifs journaliers).

export const CATEGORIES_DE_REGLE = ["a_privilegier", "a_eviter", "conseil"] as const;

export type CategorieDeRegle = (typeof CATEGORIES_DE_REGLE)[number];

const LIBELLES: Record<CategorieDeRegle, string> = {
  a_privilegier: "À privilégier",
  a_eviter: "À éviter",
  conseil: "Conseil",
};

export function libelleDeCategorie(categorie: CategorieDeRegle): string {
  return LIBELLES[categorie];
}

/** Une Règle du médecin telle qu'elle est transmise à l'IA. */
export type RegleDuMedecin = { categorie: CategorieDeRegle; texte: string };

// Un nombre suivi d'une unité de quantité : « 15 g », « 300mg », « 2000 kcal », « 7 % », « 5,5 g ».
// La lettre qui suit éventuellement l'unité est exclue avec une classe explicite (pas de \p{L}, pour rester sûr sur Hermes).
const SEUIL_CHIFFRE =
  /\d+(?:[.,]\d+)?\s*(?:mg|g|grammes?|kg|kcal|calories|ml|cl|l|litres?|%)(?![a-zà-ÿ])/i;

/** Vrai si la consigne contient un seuil chiffré, qui devrait plutôt aller dans les Objectifs journaliers. */
export function contientUnSeuilChiffre(texte: string): boolean {
  return SEUIL_CHIFFRE.test(texte);
}
