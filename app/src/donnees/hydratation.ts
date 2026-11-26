// Hydratation : ajouts d'eau (ou de boissons sans calories) et objectif d'eau.
import { journeeDe } from "@noyau";

import { fuseauDuTelephone } from "@/donnees/repas";
import { supabase } from "@/lib/supabase";

export async function ajouterEau(quantiteMl: number, maintenant = new Date()): Promise<void> {
  const { error } = await supabase.from("hydratation").insert({
    quantite_ml: quantiteMl,
    bu_le: maintenant.toISOString(),
    journee: journeeDe(maintenant, fuseauDuTelephone()),
  });
  if (error) throw error;
}

/** Annule le dernier ajout d'eau de la Journée en cours (calculée au moment du geste) ; false s'il n'y en avait aucun. */
export async function annulerDernierAjout(): Promise<boolean> {
  const journee = journeeDe(new Date(), fuseauDuTelephone());
  const { data, error } = await supabase
    .from("hydratation")
    .select("id")
    .eq("journee", journee)
    .order("bu_le", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  const suppression = await supabase.from("hydratation").delete().eq("id", data.id);
  if (suppression.error) throw suppression.error;
  return true;
}

export async function eauDuJour(journee: string): Promise<number> {
  const { data, error } = await supabase
    .from("hydratation_du_jour")
    .select("total_ml")
    .eq("journee", journee)
    .maybeSingle();
  if (error) throw error;
  return data?.total_ml ?? 0;
}

export async function chargerObjectifEau(): Promise<number | null> {
  const { data, error } = await supabase.from("objectifs_journaliers").select("eau_ml").maybeSingle();
  if (error) throw error;
  return data?.eau_ml ?? null;
}
