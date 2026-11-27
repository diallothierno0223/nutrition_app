// Lecture des Règles du médecin actives (non archivées), à transmettre à chaque demande à l'IA.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.119.2";
import type { RegleDuMedecin } from "../../../noyau/index.ts";

/**
 * Avec la session de l'utilisateur, la RLS suffit. Avec le rôle de service (traitement automatique), `userId`
 * est obligatoire pour ne lire que ses Règles.
 */
export async function reglesActives(supabase: SupabaseClient, userId?: string): Promise<RegleDuMedecin[]> {
  let requete = supabase.from("regles_medecin").select("categorie, texte").is("archivee_le", null);
  if (userId) requete = requete.eq("user_id", userId);
  const { data, error } = await requete.order("date_consultation", { ascending: false });
  if (error) throw new Error(error.message);
  return data as RegleDuMedecin[];
}
