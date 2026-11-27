// Rendez-vous du samedi : génération (Edge Function), lecture, « à refaire » et Réglages du samedi.
import { NUTRIMENTS, type CategorieDeRecette, type Constituant, type ReglagesDuSamedi } from "@noyau";

import { fuseauDuTelephone } from "@/donnees/repas";
import { supabase } from "@/lib/supabase";
import { ingredientsAvecEnvois } from "@/synchro/projection";
import { envoisEnFile, lectureEnCache } from "@/synchro/synchro";

export type IngredientEnregistre = Constituant & { id: string; position: number; coche: boolean };

export type RecetteEnregistree = {
  id: string;
  nom: string;
  categorie: CategorieDeRecette;
  portions: number;
  etapes: string[];
  conservation: string;
  ordre_conseille: string;
  a_refaire: boolean;
  dans_la_liste: boolean;
  ingredients: IngredientEnregistre[];
};

export type RendezVous = {
  id: string;
  samedi: string;
  bilan: string;
  genere_le: string;
  recettes: RecetteEnregistree[];
};

export type ResumeRendezVous = Pick<RendezVous, "id" | "samedi">;

const COLONNES_INGREDIENT = ["id", "position", "coche", "nom", "quantite", "unite", "equivalent_cuisine", ...NUTRIMENTS].join(", ");
const SELECTION =
  "id, samedi, bilan, genere_le, recettes (id, position, nom, categorie, portions, etapes, conservation, ordre_conseille, a_refaire, dans_la_liste, " +
  `ingredients:ingredients_de_recette (${COLONNES_INGREDIENT}))`;

function trier(rendezVous: RendezVous & { recettes: (RecetteEnregistree & { position: number })[] }): RendezVous {
  const recettes = [...rendezVous.recettes]
    .sort((a, b) => a.position - b.position)
    .map((r) => ({ ...r, ingredients: [...r.ingredients].sort((a, b) => a.position - b.position) }));
  return { ...rendezVous, recettes };
}

/** Les cases de la Liste de courses cochées hors ligne, encore en file, s'appliquent par-dessus le cache. */
async function avecCochesEnFile(rendezVous: RendezVous | null): Promise<RendezVous | null> {
  if (!rendezVous) return null;
  const envois = await envoisEnFile();
  return {
    ...rendezVous,
    recettes: rendezVous.recettes.map((r) => ({ ...r, ingredients: ingredientsAvecEnvois(r.ingredients, envois) })),
  };
}

/**
 * Demande le Rendez-vous de la semaine. Sans `force`, le serveur renvoie celui qui existe déjà (aucun appel à l'IA) ;
 * avec `force`, il en génère un nouveau qui remplace les Recettes de la semaine.
 */
export async function genererRendezVous(force = false): Promise<{ rendez_vous_id: string; samedi: string; genere: boolean }> {
  const { data, error } = await supabase.functions.invoke("generer-rendez-vous", {
    body: { force, fuseau: fuseauDuTelephone() },
  });
  if (error) throw error;
  return data;
}

/** Le Rendez-vous le plus récent, ou null s'il n'y en a encore aucun. */
export async function dernierRendezVous(): Promise<RendezVous | null> {
  return avecCochesEnFile(
    await lectureEnCache("dernier-rendez-vous", async () => {
      const { data, error } = await supabase
        .from("rendez_vous")
        .select(SELECTION)
        .order("samedi", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ? trier(data as never) : null;
    }),
  );
}

export async function chargerRendezVous(id: string): Promise<RendezVous | null> {
  return avecCochesEnFile(
    await lectureEnCache(`rendez-vous:${id}`, async () => {
      const { data, error } = await supabase.from("rendez_vous").select(SELECTION).eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? trier(data as never) : null;
    }),
  );
}

/** Les Rendez-vous passés, du plus récent au plus ancien. */
export async function listerRendezVous(): Promise<ResumeRendezVous[]> {
  return lectureEnCache("rendez-vous", async () => {
    const { data, error } = await supabase.from("rendez_vous").select("id, samedi").order("samedi", { ascending: false });
    if (error) throw error;
    return data;
  });
}

/** « À refaire » : la Recette pourra revenir malgré la règle de variété. */
export async function marquerARefaire(recetteId: string, aRefaire: boolean): Promise<void> {
  const { error } = await supabase.from("recettes").update({ a_refaire: aRefaire }).eq("id", recetteId);
  if (error) throw error;
}

export async function chargerReglagesDuSamedi(): Promise<ReglagesDuSamedi> {
  return lectureEnCache("reglages-samedi", async () => {
    const { data, error } = await supabase
      .from("reglages")
      .select("samedi_recettes, samedi_portions, samedi_portions_nomade, samedi_matins_rapides")
      .single();
    if (error) throw error;
    return {
      recettes: data.samedi_recettes,
      portions: data.samedi_portions,
      portionsNomade: data.samedi_portions_nomade,
      matinsRapides: data.samedi_matins_rapides,
    };
  });
}

export async function enregistrerReglagesDuSamedi(reglages: ReglagesDuSamedi): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const { error } = await supabase
    .from("reglages")
    .update({
      samedi_recettes: reglages.recettes,
      samedi_portions: reglages.portions,
      samedi_portions_nomade: reglages.portionsNomade,
      samedi_matins_rapides: reglages.matinsRapides,
    })
    .eq("user_id", session.session?.user.id ?? "");
  if (error) throw error;
}

/** « samedi 28 novembre » */
export function formaterSamedi(samedi: string): string {
  return new Date(`${samedi}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
