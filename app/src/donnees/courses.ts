// État de la Liste de courses : Recettes incluses, cases cochées et ajouts manuels.
// La liste elle-même (sections, totaux des ingrédients communs) est calculée par le noyau métier.
import type { AjoutManuel } from "@noyau";

import { supabase } from "@/lib/supabase";

export async function inclureRecette(recetteId: string, incluse: boolean): Promise<void> {
  const { error } = await supabase.from("recettes").update({ dans_la_liste: incluse }).eq("id", recetteId);
  if (error) throw error;
}

export async function cocherIngredient(ingredientId: string, coche: boolean): Promise<void> {
  const { error } = await supabase.from("ingredients_de_recette").update({ coche }).eq("id", ingredientId);
  if (error) throw error;
}

export async function listerAjoutsManuels(rendezVousId: string): Promise<AjoutManuel[]> {
  const { data, error } = await supabase
    .from("articles_manuels")
    .select("id, nom, coche")
    .eq("rendez_vous_id", rendezVousId)
    .order("cree_le");
  if (error) throw error;
  return data;
}

export async function ajouterArticle(rendezVousId: string, nom: string): Promise<void> {
  const { error } = await supabase.from("articles_manuels").insert({ rendez_vous_id: rendezVousId, nom: nom.trim() });
  if (error) throw error;
}

export async function cocherArticle(articleId: string, coche: boolean): Promise<void> {
  const { error } = await supabase.from("articles_manuels").update({ coche }).eq("id", articleId);
  if (error) throw error;
}

export async function retirerArticle(articleId: string): Promise<void> {
  const { error } = await supabase.from("articles_manuels").delete().eq("id", articleId);
  if (error) throw error;
}
