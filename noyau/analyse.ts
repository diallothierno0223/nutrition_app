// Lecture défensive de la réponse de l'IA : rien n'entre dans le Journal des repas sans passer par ici.
import { NUTRIMENTS } from "./nutriments.ts";
import type { Constituant } from "./repas.ts";

export const LIGNES_MAX_DU_COMMENTAIRE = 10;

/** Ce que l'IA renvoie pour un Repas : ses Constituants et le Commentaire du repas. */
export type AnalyseRepas = {
  constituants: Constituant[];
  commentaire: string;
};

class AnalyseInvalide extends Error {
  constructor(detail: string) {
    super(`Analyse de l'IA invalide : ${detail}`);
    this.name = "AnalyseInvalide";
  }
}

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function texte(objet: Record<string, unknown>, champ: string): string {
  const v = objet[champ];
  if (typeof v !== "string") throw new AnalyseInvalide(`« ${champ} » doit être un texte`);
  return v;
}

function nombrePositif(objet: Record<string, unknown>, champ: string): number {
  const v = objet[champ];
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
    throw new AnalyseInvalide(`« ${champ} » doit être un nombre positif ou nul`);
  }
  return v;
}

function lireConstituant(brut: unknown): Constituant {
  if (!estObjet(brut)) throw new AnalyseInvalide("un Constituant doit être un objet");
  const unite = texte(brut, "unite");
  if (unite !== "g" && unite !== "ml") throw new AnalyseInvalide("« unite » doit valoir g ou ml");

  const constituant = {
    nom: texte(brut, "nom"),
    quantite: nombrePositif(brut, "quantite"),
    unite,
    equivalent_cuisine: texte(brut, "equivalent_cuisine"),
  } as Constituant;
  for (const n of NUTRIMENTS) constituant[n] = nombrePositif(brut, n);
  return constituant;
}

/** Valide la réponse brute de l'IA et la ramène à une AnalyseRepas ; lève une erreur si elle est inutilisable. */
export function lireAnalyseRepas(brut: unknown): AnalyseRepas {
  if (!estObjet(brut)) throw new AnalyseInvalide("la réponse doit être un objet");
  const constituants = brut.constituants;
  if (!Array.isArray(constituants) || constituants.length === 0) {
    throw new AnalyseInvalide("il faut au moins un Constituant");
  }
  const commentaire = texte(brut, "commentaire")
    .trim()
    .split("\n")
    .slice(0, LIGNES_MAX_DU_COMMENTAIRE)
    .join("\n");

  return { constituants: constituants.map(lireConstituant), commentaire };
}
