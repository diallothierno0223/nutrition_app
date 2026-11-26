// Accès aux Repas depuis l'app. L'analyse est faite et enregistrée côté serveur (ADR 0003).
import { NUTRIMENTS, journeeDe, typeDeRepas, type Constituant, type TypeDeRepas } from "@noyau";

import { deposerPhoto, retirerPhoto, type PhotoChoisie } from "@/donnees/photos";
import { supabase } from "@/lib/supabase";

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

export type RepasDetaille = Repas & { constituants: ConstituantEnregistre[] };

export function fuseauDuTelephone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Crée le Repas (description, ou photo avec une note) puis demande son analyse.
 * Renvoie son identifiant, même si l'analyse échoue.
 */
export async function saisirRepas(
  description: string,
  photo: PhotoChoisie | null = null,
  maintenant = new Date(),
): Promise<string> {
  const fuseau = fuseauDuTelephone();
  const photoChemin = photo ? await deposerPhoto(photo) : null;
  const { data, error } = await supabase
    .from("repas")
    .insert({
      description: description.trim(),
      photo_chemin: photoChemin,
      mange_le: maintenant.toISOString(),
      journee: journeeDe(maintenant, fuseau),
      type_repas: typeDeRepas(maintenant, fuseau),
    })
    .select("id")
    .single();
  if (error) {
    // Pas de photo orpheline : sans Repas, la photo déposée est retirée (et une nouvelle tentative en redéposera une).
    if (photoChemin) await retirerPhoto(photoChemin).catch(() => undefined);
    throw error;
  }

  await analyserRepas(data.id);
  return data.id;
}

/** Lance (ou relance) l'analyse. En cas d'échec, le Repas reste en attente et la raison est notée dessus. */
export async function analyserRepas(repasId: string): Promise<{ reussie: boolean }> {
  const { error } = await supabase.functions.invoke("analyser-repas", { body: { repas_id: repasId } });
  if (error) console.warn("analyser-repas :", error.message);
  return { reussie: !error };
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
export async function supprimerRepas(repas: Repas): Promise<void> {
  const { error } = await supabase.from("repas").delete().eq("id", repas.id);
  if (error) throw error;
  if (repas.photo_chemin) await retirerPhoto(repas.photo_chemin).catch(() => undefined);
}

export async function chargerRepas(id: string): Promise<RepasDetaille | null> {
  const { data, error } = await supabase
    .from("repas")
    .select(`${COLONNES_REPAS}, constituants (${COLONNES_CONSTITUANT})`)
    .eq("id", id)
    .order("position", { referencedTable: "constituants" })
    .maybeSingle();
  if (error) throw error;
  return data as unknown as RepasDetaille | null;
}

/** Les Repas d'une Journée, avec leurs Constituants, du plus ancien au plus récent. */
export async function repasDeLaJournee(journee: string): Promise<RepasDetaille[]> {
  const { data, error } = await supabase
    .from("repas")
    .select(`${COLONNES_REPAS}, constituants (${COLONNES_CONSTITUANT})`)
    .eq("journee", journee)
    .order("mange_le");
  if (error) throw error;
  return data as unknown as RepasDetaille[];
}
