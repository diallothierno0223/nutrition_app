// Export de toutes les données du compte : un CSV par table dans un ZIP, partagé via la feuille de partage Android
// (enregistrer sur le téléphone, Drive…). Les photos ne sont pas copiées : photos.csv les liste par lien temporaire.
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { strToU8, zipSync } from "fflate";

import { BUCKET_PHOTOS } from "@/donnees/photos";
import { fuseauDuTelephone } from "@/donnees/repas";
import { supabase } from "@/lib/supabase";
import { TABLES_EXPORTEES, journeeDe, nomDuFichierDExport, versCsv, type TableExportee } from "@noyau";

/** Durée de validité des liens vers les photos : 7 jours, le temps de les télécharger si besoin. */
const VALIDITE_DES_LIENS_S = 7 * 24 * 3600;
/** PostgREST renvoie au plus 1 000 lignes par requête : on lit par pages, triées sur la clé primaire. */
const TAILLE_DE_PAGE = 1000;
/** Tables à une ligne par compte, dont la clé primaire est user_id (les autres ont une colonne id). */
const SANS_ID: readonly TableExportee[] = ["profils", "objectifs_journaliers", "reglages"];

type Ligne = Record<string, unknown>;

async function lireTable(table: TableExportee): Promise<Ligne[]> {
  const lignes: Ligne[] = [];
  for (let debut = 0; ; debut += TAILLE_DE_PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(SANS_ID.includes(table) ? "user_id" : "id")
      .range(debut, debut + TAILLE_DE_PAGE - 1);
    if (error) throw error;
    lignes.push(...(data as Ligne[]));
    if (data.length < TAILLE_DE_PAGE) return lignes;
  }
}

/** Une ligne par photo de Repas : son Repas, sa Journée, son chemin et un lien de téléchargement valable 7 jours. */
async function listerPhotos(repas: Ligne[]): Promise<Ligne[]> {
  const avecPhoto = repas.filter((r): r is Ligne & { photo_chemin: string } => typeof r.photo_chemin === "string");
  if (avecPhoto.length === 0) return [];
  const { data, error } = await supabase.storage
    .from(BUCKET_PHOTOS)
    .createSignedUrls(avecPhoto.map((r) => r.photo_chemin), VALIDITE_DES_LIENS_S);
  if (error) throw error;
  const liens = new Map(data.map((d) => [d.path, d.signedUrl]));
  return avecPhoto.map((r) => ({
    repas_id: r.id,
    journee: r.journee,
    chemin: r.photo_chemin,
    lien_valable_7_jours: liens.get(r.photo_chemin) ?? "",
  }));
}

const LISEZMOI = `Export du suivi nutritionnel

Un fichier CSV par table (séparateur « ; », encodage UTF-8), lisible dans un tableur.
Les identifiants (colonnes id, repas_id, plat_id…) relient les tables entre elles.
Les listes (étapes d'une recette) sont jointes par « | ».

Les photos des repas ne sont pas incluses : photos.csv donne pour chacune un lien de
téléchargement valable 7 jours. Ces liens donnent accès à la photo : ne les partage pas.
`;

/** Le téléphone ne propose pas de feuille de partage : l'export ne peut pas sortir de l'app. */
export class PartageIndisponible extends Error {
  constructor() {
    super("Le partage n'est pas disponible sur ce téléphone.");
  }
}

/** Lit toutes les tables, construit le ZIP dans le cache du téléphone et ouvre la feuille de partage. */
export async function exporterMesDonnees(): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new PartageIndisponible();
  const contenus = await Promise.all(TABLES_EXPORTEES.map(async (table) => [table, await lireTable(table)] as const));
  const repas = contenus.find(([table]) => table === "repas")?.[1] ?? [];
  const photos = await listerPhotos(repas);

  const fichiers: Record<string, Uint8Array> = { "LISEZMOI.txt": strToU8(LISEZMOI) };
  for (const [table, lignes] of contenus) fichiers[`${table}.csv`] = strToU8(versCsv(lignes));
  fichiers["photos.csv"] = strToU8(versCsv(photos));

  const zip = new File(Paths.cache, nomDuFichierDExport(journeeDe(new Date(), fuseauDuTelephone())));
  // Un export du même jour remplace le précédent dans le cache.
  if (zip.exists) zip.delete();
  zip.create();
  await zip.write(zipSync(fichiers));
  await Sharing.shareAsync(zip.uri, {
    mimeType: "application/zip",
    dialogTitle: "Enregistrer l'export",
  });
}
