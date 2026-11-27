// Accès aux Repas depuis l'app. L'analyse est faite et enregistrée côté serveur (ADR 0003).
import { randomUUID } from "expo-crypto";

import { NUTRIMENTS, journeeDe, typeDeRepas, type Constituant, type TypeDeRepas } from "@noyau";

import { conserverPhotoEnAttente, deposerPhoto, retirerPhoto, type PhotoChoisie } from "@/donnees/photos";
import { supabase } from "@/lib/supabase";
import { repasEnFile, repasEnFileDuJour, type RepasEnFile } from "@/synchro/projection";
import { estErreurReseau } from "@/synchro/reseau";
import { annulerEnvoi, envoisEnFile, envoyer, lectureEnCache } from "@/synchro/synchro";

export type StatutRepas = "en_attente" | "analyse";

export type Repas = {
  id: string;
  mange_le: string;
  journee: string;
  type_repas: TypeDeRepas;
  /** La description, ou la note qui accompagne la photo (peut être vide). */
  description: string;
  photo_chemin: string | null;
  statut: StatutRepas;
  commentaire: string | null;
  erreur_analyse: string | null;
  /** La précision ajoutée après coup, relue à chaque relance de l'analyse. */
  precision: string | null;
};

export type ConstituantEnregistre = Constituant & { id: string; position: number };

export type RepasDetaille = Repas & {
  constituants: ConstituantEnregistre[];
  // Champs locaux (pas des colonnes) :
  /** Encore dans la file d'envoi (hors ligne) : affiché, pas encore modifiable. */
  enFile?: boolean;
  /** La photo d'un Repas en attente, gardée sur le téléphone jusqu'à son envoi. */
  photoLocale?: string | null;
};

export function fuseauDuTelephone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Crée le Repas (description, ou photo avec une note) puis demande son analyse.
 * Renvoie son identifiant, même si l'analyse échoue. Sans réseau, le Repas devient un Repas en attente (ticket 18),
 * photo comprise : il est envoyé et analysé automatiquement au retour du réseau.
 */
export async function saisirRepas(
  description: string,
  photo: PhotoChoisie | null = null,
  maintenant = new Date(),
): Promise<string> {
  const fuseau = fuseauDuTelephone();
  const id = randomUUID();
  const moment = {
    mangeLe: maintenant.toISOString(),
    journee: journeeDe(maintenant, fuseau),
    typeRepas: typeDeRepas(maintenant, fuseau),
  };
  let photoChemin: string | null = null;
  try {
    photoChemin = photo ? await deposerPhoto(photo) : null;
    const { error } = await supabase.from("repas").insert({
      id,
      description: description.trim(),
      photo_chemin: photoChemin,
      mange_le: moment.mangeLe,
      journee: moment.journee,
      type_repas: moment.typeRepas,
    });
    if (error) throw error;
  } catch (erreur) {
    if (!estErreurReseau(erreur)) {
      // Pas de photo orpheline : refusé, le Repas n'existe pas ; la photo déposée est retirée.
      if (photoChemin) await retirerPhoto(photoChemin).catch(() => undefined);
      throw erreur;
    }
    // Sans réseau, la photo déposée est gardée : la réponse a pu se perdre alors que le Repas, lui, est enregistré.
    // Le Repas en attente reprend tout (même identifiant) et ne crée pas de doublon.
    const photoLocale = photo ? await conserverPhotoEnAttente(photo, id) : null;
    await envoyer({ type: "repas_en_attente", id, description: description.trim(), photoLocale, ...moment });
    return id;
  }

  const { reussie, horsLigne } = await analyserRepas(id);
  // Le réseau a lâché entre l'enregistrement et l'analyse : l'analyse est mise en file, elle partira toute seule.
  if (!reussie && horsLigne) {
    await envoyer({ type: "repas_en_attente", id, description: description.trim(), photoLocale: null, ...moment });
  }
  return id;
}

/** Lance (ou relance) l'analyse. En cas d'échec, le Repas reste en attente et la raison est notée dessus. */
export async function analyserRepas(repasId: string): Promise<{ reussie: boolean; horsLigne: boolean }> {
  const { error } = await supabase.functions.invoke("analyser-repas", { body: { repas_id: repasId } });
  if (error) console.warn("analyser-repas :", error.message);
  return { reussie: !error, horsLigne: estErreurReseau(error) };
}

const COLONNES_REPAS =
  "id, mange_le, journee, type_repas, description, photo_chemin, precision, statut, commentaire, erreur_analyse";
const CHAMPS_CONSTITUANT = ["nom", "quantite", "unite", "equivalent_cuisine", ...NUTRIMENTS] as const;
const COLONNES_CONSTITUANT = ["id", "position", ...CHAMPS_CONSTITUANT].join(", ");

/** Les seules colonnes modifiables d'un Constituant (jamais son id, son Repas ni sa position). */
function champsDuConstituant(c: Constituant) {
  return Object.fromEntries(CHAMPS_CONSTITUANT.map((champ) => [champ, c[champ]]));
}

// --- Correction après coup (ADR 0003) : sans appel à l'IA, sauf la relance avec précision. ---

/** Enregistre un Constituant corrigé (quantité et nutriments recalculés par le noyau). Le Commentaire ne change pas. */
export async function corrigerConstituant(id: string, corrige: Constituant): Promise<void> {
  const { error } = await supabase.from("constituants").update(champsDuConstituant(corrige)).eq("id", id);
  if (error) throw error;
}

export async function supprimerConstituant(id: string): Promise<void> {
  const { error } = await supabase.from("constituants").delete().eq("id", id);
  if (error) throw error;
}

/** Ajoute un Constituant saisi à la main, après ceux enregistrés (position relue juste avant l'ajout). */
export async function ajouterConstituant(repasId: string, nouveau: Constituant): Promise<void> {
  const dernier = await supabase
    .from("constituants")
    .select("position")
    .eq("repas_id", repasId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (dernier.error) throw dernier.error;
  const position = (dernier.data?.position ?? 0) + 1;
  const { error } = await supabase
    .from("constituants")
    .insert({ ...champsDuConstituant(nouveau), repas_id: repasId, position });
  if (error) throw error;
}

/** Enregistre la précision puis relance l'analyse : Constituants et Commentaire sont régénérés. */
export async function relancerAvecPrecision(repasId: string, precision: string): Promise<{ reussie: boolean }> {
  const { error } = await supabase
    .from("repas")
    .update({ precision: precision.trim() || null })
    .eq("id", repasId);
  if (error) throw error;
  return analyserRepas(repasId);
}

/**
 * Change le Type de repas et, si `mangeLe` est fourni, le moment du Repas : la Journée est alors recalculée dans
 * le fuseau du téléphone. Sans nouveau moment, la Journée ne bouge pas (même en voyage dans un autre fuseau).
 */
export async function deplacerRepas(repasId: string, mangeLe: Date | null, type: TypeDeRepas): Promise<void> {
  const moment = mangeLe && { mange_le: mangeLe.toISOString(), journee: journeeDe(mangeLe, fuseauDuTelephone()) };
  const { error } = await supabase
    .from("repas")
    .update({ ...moment, type_repas: type })
    .eq("id", repasId);
  if (error) throw error;
}

/** Supprime le Repas (ses Constituants suivent) puis sa photo, devenue inutile. */
/** Supprime le Repas. Un envoi encore en file pour ce Repas (analyse à refaire) est retiré d'abord : sinon le rejeu
 * le recréerait. */
export async function supprimerRepas(repas: Repas): Promise<void> {
  await annulerEnvoi((e) => (e.type === "repas_en_attente" || e.type === "repas_depuis_plat") && e.id === repas.id);
  const { error } = await supabase.from("repas").delete().eq("id", repas.id);
  if (error) throw error;
  if (repas.photo_chemin) await retirerPhoto(repas.photo_chemin).catch(() => undefined);
}

/** Un Repas encore dans la file d'envoi, affiché comme les autres (lecture seule tant qu'il n'est pas parti). */
function versRepasDetaille(r: RepasEnFile): RepasDetaille {
  return {
    id: r.id,
    mange_le: r.mange_le,
    journee: r.journee,
    type_repas: r.type_repas,
    description: r.description,
    photo_chemin: null,
    statut: r.statut,
    commentaire: null,
    erreur_analyse: null,
    precision: null,
    constituants: r.constituants.map((c, position) => ({ ...c, id: `${r.id}-${position}`, position })),
    enFile: true,
    photoLocale: r.photoLocale,
  };
}

/** Le Repas ; s'il n'est pas encore sur le serveur (file d'envoi, hors ligne), sa version locale. */
export async function chargerRepas(id: string): Promise<RepasDetaille | null> {
  let surLeServeur: RepasDetaille | null = null;
  try {
    const { data, error } = await supabase
      .from("repas")
      .select(`${COLONNES_REPAS}, constituants (${COLONNES_CONSTITUANT})`)
      .eq("id", id)
      .order("position", { referencedTable: "constituants" })
      .maybeSingle();
    if (error) throw error;
    surLeServeur = data as unknown as RepasDetaille | null;
  } catch (erreur) {
    if (!estErreurReseau(erreur)) throw erreur;
  }
  if (surLeServeur) return surLeServeur;
  const enFile = repasEnFile(await envoisEnFile()).find((r) => r.id === id);
  return enFile ? versRepasDetaille(enFile) : null;
}

/**
 * Les Repas d'une Journée, avec leurs Constituants, du plus ancien au plus récent : ceux du serveur (dernière valeur
 * connue hors ligne), plus ceux encore en file d'envoi.
 */
export async function repasDeLaJournee(journee: string): Promise<RepasDetaille[]> {
  const surLeServeur = await lectureEnCache(`repas:${journee}`, async () => {
    const { data, error } = await supabase
      .from("repas")
      .select(`${COLONNES_REPAS}, constituants (${COLONNES_CONSTITUANT})`)
      .eq("journee", journee)
      .order("mange_le");
    if (error) throw error;
    return data as unknown as RepasDetaille[];
  });
  const dejaLa = new Set(surLeServeur.map((r) => r.id));
  const enFile = repasEnFileDuJour(await envoisEnFile(), journee).filter((r) => !dejaLa.has(r.id));
  return [...surLeServeur, ...enFile.map(versRepasDetaille)].sort((a, b) => a.mange_le.localeCompare(b.mange_le));
}
