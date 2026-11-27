// Hydratation : ajouts d'eau (ou de boissons sans calories) et objectif d'eau.
// L'ajout d'eau passe par la file d'envoi : il fonctionne hors ligne et part au retour du réseau (ticket 17).
import { randomUUID } from "expo-crypto";

import { journeeDe } from "@noyau";

import { fuseauDuTelephone } from "@/donnees/repas";
import { supabase } from "@/lib/supabase";
import { eauAvecEnvois } from "@/synchro/projection";
import { annulerEnvoi, envoisEnFile, envoyer, lectureEnCache } from "@/synchro/synchro";

export async function ajouterEau(quantiteMl: number, maintenant = new Date()): Promise<void> {
  await envoyer({
    type: "ajouter_eau",
    id: randomUUID(),
    quantiteMl,
    buLe: maintenant.toISOString(),
    journee: journeeDe(maintenant, fuseauDuTelephone()),
  });
}

/**
 * Annule le dernier ajout d'eau de la Journée en cours (calculée au moment du geste) ; false s'il n'y en avait aucun.
 * Un ajout encore en file est simplement retiré de la file ; sinon, il faut le réseau.
 */
export async function annulerDernierAjout(): Promise<boolean> {
  const journee = journeeDe(new Date(), fuseauDuTelephone());
  if (await annulerEnvoi((e) => e.type === "ajouter_eau" && e.journee === journee)) return true;
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

/** L'eau bue dans la Journée : la dernière valeur connue du serveur, plus les ajouts encore en file. */
export async function eauDuJour(journee: string): Promise<number> {
  const surLeServeur = await lectureEnCache(`eau:${journee}`, async () => {
    const { data, error } = await supabase
      .from("hydratation_du_jour")
      .select("total_ml")
      .eq("journee", journee)
      .maybeSingle();
    if (error) throw error;
    return (data?.total_ml as number | undefined) ?? 0;
  });
  return eauAvecEnvois(surLeServeur, await envoisEnFile(), journee);
}

export async function chargerObjectifEau(): Promise<number | null> {
  return lectureEnCache("objectif-eau", async () => {
    const { data, error } = await supabase.from("objectifs_journaliers").select("eau_ml").maybeSingle();
    if (error) throw error;
    return (data?.eau_ml as number | null | undefined) ?? null;
  });
}
