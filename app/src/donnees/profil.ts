// Profil, Objectifs personnels, Objectif de poids, Pesées et Estimation des Objectifs (ADR 0004).
import type { EstimationObjectifs, NiveauDActivite, Sexe } from "@noyau";

import { supabase } from "@/lib/supabase";

export type Profil = {
  taille_cm: number | null;
  date_naissance: string | null;
  sexe: Sexe | null;
  niveau_activite: NiveauDActivite | null;
  objectifs_personnels: string;
  objectif_poids_variation_kg: number | null;
  objectif_poids_echeance: string | null;
};

export type Pesee = { id: string; pese_le: string; poids_kg: number };

export type ResultatEstimation = {
  estimation: EstimationObjectifs;
  garde_fou: { calories: number; ecart_pourcentage: number; alerte: boolean };
};

export const PROFIL_VIDE: Profil = {
  taille_cm: null,
  date_naissance: null,
  sexe: null,
  niveau_activite: null,
  objectifs_personnels: "",
  objectif_poids_variation_kg: null,
  objectif_poids_echeance: null,
};

const COLONNES_PROFIL = Object.keys(PROFIL_VIDE).join(", ");

export async function chargerProfil(): Promise<Profil> {
  const { data, error } = await supabase.from("profils").select(COLONNES_PROFIL).maybeSingle();
  if (error) throw error;
  return (data as unknown as Profil | null) ?? PROFIL_VIDE;
}

/** Enregistre le Profil ; le fuseau horaire est celui du téléphone. */
export async function enregistrerProfil(profil: Profil, fuseau: string): Promise<void> {
  const { error } = await supabase.from("profils").upsert({ ...profil, fuseau });
  if (error) throw error;
}

/** Les Pesées, de la plus récente à la plus ancienne. */
export async function listerPesees(nombre = 30): Promise<Pesee[]> {
  const { data, error } = await supabase
    .from("pesees")
    .select("id, pese_le, poids_kg")
    .order("pese_le", { ascending: false })
    .limit(nombre);
  if (error) throw error;
  return data as Pesee[];
}

/** Une Pesée par date : peser à nouveau le même jour remplace la valeur. */
export async function enregistrerPesee(peseLe: string, poidsKg: number): Promise<void> {
  const { error } = await supabase
    .from("pesees")
    .upsert({ pese_le: peseLe, poids_kg: poidsKg }, { onConflict: "user_id,pese_le" });
  if (error) throw error;
}

export async function supprimerPesee(id: string): Promise<void> {
  const { error } = await supabase.from("pesees").delete().eq("id", id);
  if (error) throw error;
}

/** Demande une Estimation des Objectifs à l'IA ; rien n'est enregistré. Renvoie le message d'erreur à afficher. */
export async function estimerObjectifs(): Promise<ResultatEstimation | { erreur: string }> {
  const { data, error } = await supabase.functions.invoke("estimer-objectifs", { body: {} });
  if (!error) return data as ResultatEstimation;
  // Les erreurs 422 portent un message destiné à l'utilisateur (Profil incomplet, pas de Pesée).
  const corps = await (error as { context?: Response }).context?.json?.().catch(() => null);
  return { erreur: corps?.erreur ?? "L'estimation a échoué. Vérifie ta connexion et réessaie." };
}

/** Les dates de modification utiles pour proposer une réestimation des Objectifs. */
export async function datesDeModification(): Promise<{ objectifs: string | null; sources: (string | null)[] }> {
  const [objectifs, profil, regles] = await Promise.all([
    supabase.from("objectifs_journaliers").select("modifie_le").maybeSingle(),
    supabase.from("profils").select("modifie_le").maybeSingle(),
    supabase.from("regles_medecin").select("modifie_le").order("modifie_le", { ascending: false }).limit(1).maybeSingle(),
  ]);
  for (const r of [objectifs, profil, regles]) if (r.error) throw r.error;
  return {
    objectifs: objectifs.data?.modifie_le ?? null,
    sources: [profil.data?.modifie_le ?? null, regles.data?.modifie_le ?? null],
  };
}

/**
 * Ajoute des Pesées (import Health Connect) sans jamais remplacer celle d'une Journée déjà pesée, même saisie
 * entre-temps. Renvoie le nombre de Pesées réellement ajoutées.
 */
export async function ajouterPeseesManquantes(pesees: { pese_le: string; poids_kg: number }[]): Promise<number> {
  if (pesees.length === 0) return 0;
  const { data, error } = await supabase
    .from("pesees")
    .upsert(pesees, { onConflict: "user_id,pese_le", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;
  return data.length;
}
