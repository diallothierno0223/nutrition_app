// Export des données : chaque table devient un CSV lisible par un tableur français (séparateur « ; », UTF-8 avec BOM).

const SEPARATEUR = ";";
const FIN_DE_LIGNE = "\r\n";
/** Le BOM indique l'UTF-8 aux tableurs (sans lui, Excel affiche mal les accents). */
const BOM = "﻿";

function versCellule(valeur: unknown): string {
  if (valeur === null || valeur === undefined) return "";
  if (Array.isArray(valeur)) return valeur.map(versCellule).join(" | ");
  if (typeof valeur === "object") return JSON.stringify(valeur);
  return String(valeur);
}

function echapper(cellule: string): string {
  return /[;"\r\n]/.test(cellule) ? `"${cellule.replaceAll('"', '""')}"` : cellule;
}

/**
 * Un CSV : une colonne par clé rencontrée (dans l'ordre d'apparition), une ligne par enregistrement. Les listes sont
 * jointes par « | », les objets écrits en JSON, les valeurs absentes laissées vides.
 */
export function versCsv(lignes: readonly Record<string, unknown>[]): string {
  if (lignes.length === 0) return BOM;
  const colonnes = [...new Set(lignes.flatMap((ligne) => Object.keys(ligne)))];
  const texte = [colonnes, ...lignes.map((ligne) => colonnes.map((c) => versCellule(ligne[c])))]
    .map((cellules) => cellules.map(echapper).join(SEPARATEUR) + FIN_DE_LIGNE)
    .join("");
  return BOM + texte;
}

/** Toutes les tables du compte, chacune exportée dans son CSV (la RLS ne renvoie que les lignes de l'utilisateur). */
export const TABLES_EXPORTEES = [
  "profils",
  "pesees",
  "objectifs_journaliers",
  "regles_medecin",
  "repas",
  "constituants",
  "hydratation",
  "plats",
  "constituants_de_plat",
  "rendez_vous",
  "recettes",
  "ingredients_de_recette",
  "articles_manuels",
  "reglages",
] as const;
export type TableExportee = (typeof TABLES_EXPORTEES)[number];

/** « suivi-nutritionnel-2026-11-27.zip » */
export function nomDuFichierDExport(journee: string): string {
  return `suivi-nutritionnel-${journee}.zip`;
}
