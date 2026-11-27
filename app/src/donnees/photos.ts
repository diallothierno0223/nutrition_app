// Photos de Repas : compressées sur le téléphone, déposées dans le bucket privé « photos-repas » sous <user_id>/.
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

import { supabase } from "@/lib/supabase";

export const BUCKET_PHOTOS = "photos-repas";
const COTE_MAX = 1600;

export type PhotoChoisie = { uri: string; largeur: number; hauteur: number };

/** Réduit le plus grand côté à 1600 px (sans agrandir) et réencode en JPEG. */
async function compresser({ uri, largeur, hauteur }: PhotoChoisie): Promise<string> {
  const contexte = ImageManipulator.manipulate(uri);
  try {
    if (Math.max(largeur, hauteur) > COTE_MAX) {
      contexte.resize(largeur >= hauteur ? { width: COTE_MAX, height: null } : { width: null, height: COTE_MAX });
    }
    const rendu = await contexte.renderAsync();
    try {
      return (await rendu.saveAsync({ compress: 0.7, format: SaveFormat.JPEG })).uri;
    } finally {
      rendu.release();
    }
  } finally {
    contexte.release();
  }
}

/** Compresse et dépose la photo ; renvoie son chemin dans le bucket. */
export async function deposerPhoto(photo: PhotoChoisie): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Session requise");

  const octets = await (await fetch(await compresser(photo))).arrayBuffer();
  const chemin = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET_PHOTOS).upload(chemin, octets, { contentType: "image/jpeg" });
  if (error) throw error;
  return chemin;
}

/** Retire une photo qu'aucun Repas n'utilise (dépôt suivi d'un échec d'enregistrement). */
export async function retirerPhoto(chemin: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_PHOTOS).remove([chemin]);
  if (error) throw error;
}

/** Une adresse temporaire (1 h) pour afficher une photo du bucket privé. */
export async function adresseDePhoto(chemin: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET_PHOTOS).createSignedUrl(chemin, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Repas en attente (ticket 18) : la photo, compressée, est gardée dans les documents de l'app jusqu'à son envoi.
 * Renvoie l'adresse locale du fichier.
 */
export async function conserverPhotoEnAttente(photo: PhotoChoisie, repasId: string): Promise<string> {
  const dossier = new Directory(Paths.document, "repas-en-attente");
  dossier.create({ intermediates: true, idempotent: true });
  const destination = new File(dossier, `${repasId}.jpg`);
  await new File(await compresser(photo)).copy(destination, { overwrite: true });
  return destination.uri;
}
