// Accès aux Repas depuis l'app. L'analyse est faite et enregistrée côté serveur (ADR 0003).
import { journeeDe, typeDeRepas, type Constituant, type TypeDeRepas } from "@noyau";

import { supabase } from "@/lib/supabase";

export type StatutRepas = "en_attente" | "analyse";

export type Repas = {
  id: string;
  mange_le: string;
  journee: string;
  type_repas: TypeDeRepas;
  description: string;
  statut: StatutRepas;
  commentaire: string | null;
  erreur_analyse: string | null;
};

export type RepasDetaille = Repas & { constituants: Constituant[] };

export function fuseauDuTelephone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Crée le Repas puis demande son analyse. Renvoie son identifiant, même si l'analyse échoue. */
export async function saisirRepas(description: string, maintenant = new Date()): Promise<string> {
  const fuseau = fuseauDuTelephone();
  const { data, error } = await supabase
    .from("repas")
    .insert({
      description: description.trim(),
      mange_le: maintenant.toISOString(),
      journee: journeeDe(maintenant, fuseau),
      type_repas: typeDeRepas(maintenant, fuseau),
    })
    .select("id")
    .single();
  if (error) throw error;

  await analyserRepas(data.id);
  return data.id;
}

/** Lance (ou relance) l'analyse. En cas d'échec, le Repas reste en attente et la raison est notée dessus. */
export async function analyserRepas(repasId: string): Promise<{ reussie: boolean }> {
  const { error } = await supabase.functions.invoke("analyser-repas", { body: { repas_id: repasId } });
  if (error) console.warn("analyser-repas :", error.message);
  return { reussie: !error };
}

const COLONNES_REPAS = "id, mange_le, journee, type_repas, description, statut, commentaire, erreur_analyse";
const COLONNES_CONSTITUANT =
  "nom, quantite, unite, equivalent_cuisine, calories, proteines, glucides, lipides, ags, fibres, sel";

export async function chargerRepas(id: string): Promise<RepasDetaille | null> {
  const { data, error } = await supabase
    .from("repas")
    .select(`${COLONNES_REPAS}, constituants (${COLONNES_CONSTITUANT})`)
    .eq("id", id)
    .order("position", { referencedTable: "constituants" })
    .maybeSingle();
  if (error) throw error;
  return data as RepasDetaille | null;
}

/** Les Repas d'une Journée, avec leurs Constituants, du plus ancien au plus récent. */
export async function repasDeLaJournee(journee: string): Promise<RepasDetaille[]> {
  const { data, error } = await supabase
    .from("repas")
    .select(`${COLONNES_REPAS}, constituants (${COLONNES_CONSTITUANT})`)
    .eq("journee", journee)
    .order("mange_le");
  if (error) throw error;
  return data as RepasDetaille[];
}
