// Lecture des Règles du médecin actives (non archivées), à transmettre à chaque demande à l'IA.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.2";
import type { RegleDuMedecin } from "../../../noyau/index.ts";

export async function reglesActives(supabase: SupabaseClient): Promise<RegleDuMedecin[]> {
  const { data, error } = await supabase
    .from("regles_medecin")
    .select("categorie, texte")
    .is("archivee_le", null)
    .order("date_consultation", { ascending: false });
  if (error) throw new Error(error.message);
  return data as RegleDuMedecin[];
}
