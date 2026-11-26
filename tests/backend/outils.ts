// Gestes communs aux tests backend : créer un Repas, l'analyser (IA factice), lire ses Constituants.
// Avec l'IA factice, chaque analyse donne un riz blanc (195 kcal, AGS 0,1 g) et une sauce arachide (320 kcal, AGS 6,5 g),
// soit 515 kcal, 6,6 g d'AGS et 4,1 g de sucres (0,1 + 4) par Repas.
import type { SupabaseClient } from "@supabase/supabase-js";
import { statutLocal, type UtilisateurDeTest } from "./supabase-local.ts";

export async function creerRepas(client: SupabaseClient, description: string, journee = "2026-11-26") {
  const { data, error } = await client
    .from("repas")
    .insert({ description, mange_le: `${journee}T12:30:00Z`, journee, type_repas: "dejeuner" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function analyser(utilisateur: UtilisateurDeTest, repasId: string) {
  const { data } = await utilisateur.client.auth.getSession();
  return fetch(`${statutLocal().API_URL}/functions/v1/analyser-repas`, {
    method: "POST",
    headers: { Authorization: `Bearer ${data.session?.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ repas_id: repasId }),
  });
}

export async function creerRepasAnalyse(utilisateur: UtilisateurDeTest, description: string, journee?: string) {
  const repasId = await creerRepas(utilisateur.client, description, journee);
  const reponse = await analyser(utilisateur, repasId);
  if (reponse.status !== 200) throw new Error(`analyse impossible : ${reponse.status}`);
  return repasId;
}
