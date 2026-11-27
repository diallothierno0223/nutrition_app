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

/** Début du nom de chaque fichier d'Export. */
export const PREFIXE_DES_EXPORTS = "suivi-nutritionnel-";

/** « suivi-nutritionnel-2026-11-27.zip » */
export function nomDuFichierDExport(journee: string): string {
  return `${PREFIXE_DES_EXPORTS}${journee}.zip`;
}

/** Chemin d'une photo de Repas dans l'Export : « photos/2026-11-27_<id du Repas>.jpg », triable par Journée. */
export function fichierDePhotoExportee(journee: string, repasId: string): string {
  return `photos/${journee}_${repasId}.jpg`;
}

/** Une photo de Repas à exporter : son Repas, la Journée du Repas et son chemin dans le Storage. */
export type PhotoDeRepas = { repasId: string; journee: string; chemin: string };

/** Les photos des Repas exportés (les Repas sans photo sont ignorés). */
export function photosDesRepas(repas: readonly Record<string, unknown>[]): PhotoDeRepas[] {
  return repas.flatMap((r) =>
    typeof r.photo_chemin === "string"
      ? [{ repasId: String(r.id), journee: String(r.journee), chemin: r.photo_chemin }]
      : [],
  );
}

/** La ligne de photos.csv d'une photo : où la trouver dans le ZIP (si elle y est) et son lien temporaire. */
export function ligneDePhotoExportee(photo: PhotoDeRepas, dansLeZip: boolean, lien: string): Record<string, string> {
  return {
    repas_id: photo.repasId,
    journee: photo.journee,
    chemin: photo.chemin,
    fichier: dansLeZip ? fichierDePhotoExportee(photo.journee, photo.repasId) : "",
    lien_valable_7_jours: lien,
  };
}
