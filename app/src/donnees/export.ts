// Export de toutes les données du compte : un CSV par table dans un ZIP, partagé via la feuille de partage Android
// (enregistrer sur le téléphone, Drive…). Les photos y sont copiées sur demande ; photos.csv les liste toujours.
import { Directory, File, FileMode, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Zip, ZipDeflate, ZipPassThrough, strToU8 } from "fflate";

import { BUCKET_PHOTOS } from "@/donnees/photos";
import { fuseauDuTelephone } from "@/donnees/repas";
import { supabase } from "@/lib/supabase";
import {
  TABLES_EXPORTEES,
  fichierDePhotoExportee,
  ligneDePhotoExportee,
  journeeDe,
  PREFIXE_DES_EXPORTS,
  nomDuFichierDExport,
  photosDesRepas,
  versCsv,
  type PhotoDeRepas,
  type TableExportee,
} from "@noyau";

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

/** Au-delà de ce nombre d'échecs de suite, la connexion est sans doute perdue : l'export s'arrête. */
const ECHECS_DE_SUITE_MAX = 3;

async function signerLiens(photos: PhotoDeRepas[]): Promise<Map<string, string>> {
  if (photos.length === 0) return new Map();
  const { data, error } = await supabase.storage
    .from(BUCKET_PHOTOS)
    .createSignedUrls(photos.map((p) => p.chemin), VALIDITE_DES_LIENS_S);
  if (error) throw error;
  return new Map(data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [])));
}

/** Télécharge une photo dans le cache et renvoie ses octets ; null si elle n'a pas pu être récupérée. */
async function telechargerPhoto(lien: string): Promise<Uint8Array | null> {
  const temporaire = new File(Paths.cache, "photo-en-cours-d-export.jpg");
  try {
    const telechargee = await File.downloadFileAsync(lien, temporaire, { idempotent: true });
    return await telechargee.bytes();
  } catch {
    return null;
  } finally {
    if (temporaire.exists) temporaire.delete();
  }
}

/** Les exports précédents restent dans le cache après le partage : on les retire avant d'en écrire un nouveau. */
function retirerLesAnciensExports(): void {
  for (const element of new Directory(Paths.cache).list()) {
    if (!(element instanceof File) || !element.name.startsWith(PREFIXE_DES_EXPORTS)) continue;
    try {
      element.delete();
    } catch {
      // Un ancien export encore ouvert ailleurs : il sera retiré la prochaine fois.
    }
  }
}

/**
 * Le ZIP est écrit dans le fichier au fil de l'eau : seule la photo en cours est en mémoire, même avec des centaines
 * de photos. Les textes sont compressés ; les JPEG, déjà compressés, sont stockés tels quels.
 */
function ouvrirZip(destination: File) {
  const poignee = destination.open(FileMode.ReadWrite);
  let ouverte = true;
  let erreur: Error | null = null;
  const zip = new Zip((err, morceau) => {
    if (err) erreur = err;
    else poignee.writeBytesSync(morceau);
  });
  function ajouter(entree: ZipDeflate | ZipPassThrough, octets: Uint8Array) {
    zip.add(entree);
    entree.push(octets, true);
    if (erreur) throw erreur;
  }
  function fermerLaPoignee() {
    if (ouverte) poignee.close();
    ouverte = false;
  }
  return {
    ajouterTexte: (nom: string, texte: string) => ajouter(new ZipDeflate(nom, { level: 6 }), strToU8(texte)),
    ajouterJpeg: (nom: string, octets: Uint8Array) => ajouter(new ZipPassThrough(nom), octets),
    terminer() {
      try {
        zip.end();
        if (erreur) throw erreur;
      } finally {
        fermerLaPoignee();
      }
    },
    abandonner: fermerLaPoignee,
  };
}

function lisezMoi(avecPhotos: boolean): string {
  const photos = avecPhotos
    ? `Les photos des repas sont dans le dossier photos/ (colonne « fichier » de photos.csv).
Une photo dont la colonne « fichier » est vide n'a pas pu être téléchargée.`
    : `Les photos des repas ne sont pas incluses : photos.csv donne pour chacune un lien de
téléchargement valable 7 jours.`;
  return `Export du suivi nutritionnel

Un fichier CSV par table (séparateur « ; », encodage UTF-8), lisible dans un tableur.
Les identifiants (colonnes id, repas_id, plat_id…) relient les tables entre elles.
Les listes (étapes d'une recette) sont jointes par « | ».

${photos}
Les liens de photos.csv donnent accès aux photos : ne partage pas ce fichier.
`;
}

/** Le téléphone ne propose pas de feuille de partage : l'export ne peut pas sortir de l'app. */
export class PartageIndisponible extends Error {
  constructor() {
    super("Le partage n'est pas disponible sur ce téléphone.");
  }
}

/** Plusieurs photos de suite n'ont pas pu être téléchargées : la connexion est probablement perdue. */
export class ConnexionPerdue extends Error {
  constructor() {
    super("La connexion a été perdue pendant le téléchargement des photos. Réessaie avec une meilleure connexion.");
  }
}

export type OptionsDExport = {
  /** Copier les photos des Repas dans le ZIP (plus long et plus lourd), en plus de leurs liens. */
  avecPhotos: boolean;
  /** Avancement du téléchargement des photos. */
  onProgression?: (photosFaites: number, photosTotal: number) => void;
};

/** Ce qu'il faut signaler après un export réussi. */
export type BilanDExport = { photosManquantes: number };

/**
 * Lit toutes les tables, écrit le ZIP dans le cache du téléphone et ouvre la feuille de partage. Une photo isolée
 * qui ne se télécharge pas est comptée dans `photosManquantes` ; plusieurs échecs de suite arrêtent l'export.
 */
export async function exporterMesDonnees({ avecPhotos, onProgression }: OptionsDExport): Promise<BilanDExport> {
  if (!(await Sharing.isAvailableAsync())) throw new PartageIndisponible();
  const contenus = await Promise.all(TABLES_EXPORTEES.map(async (table) => [table, await lireTable(table)] as const));
  const photos = photosDesRepas(contenus.find(([table]) => table === "repas")?.[1] ?? []);
  const liens = await signerLiens(photos);

  retirerLesAnciensExports();
  const archive = new File(Paths.cache, nomDuFichierDExport(journeeDe(new Date(), fuseauDuTelephone())));
  archive.create({ overwrite: true });
  const zip = ouvrirZip(archive);
  let photosManquantes = 0;
  try {
    zip.ajouterTexte("LISEZMOI.txt", lisezMoi(avecPhotos));
    for (const [table, lignes] of contenus) zip.ajouterTexte(`${table}.csv`, versCsv(lignes));

    const lignesPhotos: Record<string, string>[] = [];
    let echecsDeSuite = 0;
    for (const [i, photo] of photos.entries()) {
      const lien = liens.get(photo.chemin) ?? "";
      let dansLeZip = false;
      if (avecPhotos) {
        const octets = lien ? await telechargerPhoto(lien) : null;
        if (octets) {
          zip.ajouterJpeg(fichierDePhotoExportee(photo.journee, photo.repasId), octets);
          dansLeZip = true;
          echecsDeSuite = 0;
        } else {
          photosManquantes++;
          if (++echecsDeSuite >= ECHECS_DE_SUITE_MAX) throw new ConnexionPerdue();
        }
        onProgression?.(i + 1, photos.length);
      }
      lignesPhotos.push(ligneDePhotoExportee(photo, dansLeZip, lien));
    }
    zip.ajouterTexte("photos.csv", versCsv(lignesPhotos));
    zip.terminer();
  } catch (e) {
    zip.abandonner();
    if (archive.exists) archive.delete();
    throw e;
  }

  await Sharing.shareAsync(archive.uri, { mimeType: "application/zip", dialogTitle: "Enregistrer l'export" });
  return { photosManquantes };
}
