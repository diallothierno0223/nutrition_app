// État de la Liste de courses : Recettes incluses, cases cochées et ajouts manuels.
// La liste elle-même (sections, totaux des ingrédients communs) est calculée par le noyau métier.
// Cocher une case et ajouter un article marchent hors ligne (file d'envoi, ticket 17) : au marché, sans réseau.
import { randomUUID } from "expo-crypto";

import type { AjoutManuel } from "@noyau";

import { supabase } from "@/lib/supabase";
import { ajoutsManuelsAvecEnvois } from "@/synchro/projection";
import { envoisEnFile, envoyer, lectureEnCache } from "@/synchro/synchro";

export async function inclureRecette(recetteId: string, incluse: boolean): Promise<void> {
  const { error } = await supabase.from("recettes").update({ dans_la_liste: incluse }).eq("id", recetteId);
  if (error) throw error;
}

export async function cocherIngredient(ingredientId: string, coche: boolean): Promise<void> {
  await envoyer({ type: "cocher_ingredient", ingredientId, coche });
}

/** Les ajouts manuels : dernière liste connue du serveur, plus ceux créés ou cochés hors ligne. */
export async function listerAjoutsManuels(rendezVousId: string): Promise<AjoutManuel[]> {
  const surLeServeur = await lectureEnCache(`ajouts-manuels:${rendezVousId}`, async () => {
    const { data, error } = await supabase
      .from("articles_manuels")
      .select("id, nom, coche")
      .eq("rendez_vous_id", rendezVousId)
      .order("cree_le");
    if (error) throw error;
    return data;
  });
  return ajoutsManuelsAvecEnvois(surLeServeur, await envoisEnFile(), rendezVousId);
}

export async function ajouterArticle(rendezVousId: string, nom: string): Promise<void> {
  await envoyer({ type: "ajouter_article", id: randomUUID(), rendezVousId, nom: nom.trim() });
}

export async function cocherArticle(articleId: string, coche: boolean): Promise<void> {
  await envoyer({ type: "cocher_article", articleId, coche });
}

export async function retirerArticle(articleId: string): Promise<void> {
  const { error } = await supabase.from("articles_manuels").delete().eq("id", articleId);
  if (error) throw error;
}
