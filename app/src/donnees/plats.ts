// Plats réutilisables : des modèles de Repas pour une portion. Réutiliser un Plat copie ses Constituants,
// multipliés par le Coefficient de portion (noyau métier), dans un nouveau Repas déjà analysé : pas d'appel à l'IA.
import { NUTRIMENTS, appliquerCoefficient, journeeDe, typeDeRepas, type Constituant } from "@noyau";

import { analyserRepas, fuseauDuTelephone, type ConstituantEnregistre } from "@/donnees/repas";
import { supabase } from "@/lib/supabase";

export type Plat = { id: string; nom: string };
export type PlatDetaille = Plat & { constituants: ConstituantEnregistre[] };

const CHAMPS_CONSTITUANT = ["nom", "quantite", "unite", "equivalent_cuisine", ...NUTRIMENTS] as const;
const COLONNES_CONSTITUANT = ["id", "position", ...CHAMPS_CONSTITUANT].join(", ");

/** Seuls les champs d'un Constituant partent en base (jamais un id ou une position d'origine). */
function sansIdentifiant(c: Constituant): Constituant {
  return Object.fromEntries(CHAMPS_CONSTITUANT.map((champ) => [champ, c[champ]])) as Constituant;
}

export async function listerPlats(): Promise<Plat[]> {
  const { data, error } = await supabase.from("plats").select("id, nom").order("nom");
  if (error) throw error;
  return data;
}

export async function chargerPlat(id: string): Promise<PlatDetaille | null> {
  const { data, error } = await supabase
    .from("plats")
    .select(`id, nom, constituants:constituants_de_plat (${COLONNES_CONSTITUANT})`)
    .eq("id", id)
    .order("position", { referencedTable: "constituants_de_plat" })
    .maybeSingle();
  if (error) throw error;
  return data as unknown as PlatDetaille | null;
}

/** Enregistre des Constituants (ceux d'un Repas, pour une portion) comme nouveau Plat ; renvoie son identifiant. */
export async function creerPlat(nom: string, constituants: readonly Constituant[]): Promise<string> {
  const { data, error } = await supabase.rpc("creer_plat", {
    p_nom: nom.trim(),
    p_constituants: constituants.map(sansIdentifiant),
  });
  if (error) throw error;
  return data as string;
}

export async function renommerPlat(id: string, nom: string): Promise<void> {
  const { error } = await supabase.from("plats").update({ nom: nom.trim() }).eq("id", id);
  if (error) throw error;
}

/** Supprime le Plat ; les Repas déjà enregistrés depuis ce Plat restent intacts (ce sont des copies). */
export async function supprimerPlat(id: string): Promise<void> {
  const { error } = await supabase.from("plats").delete().eq("id", id);
  if (error) throw error;
}

export async function corrigerConstituantDePlat(id: string, corrige: Constituant): Promise<void> {
  const { error } = await supabase.from("constituants_de_plat").update(sansIdentifiant(corrige)).eq("id", id);
  if (error) throw error;
}

export async function supprimerConstituantDePlat(id: string): Promise<void> {
  const { error } = await supabase.from("constituants_de_plat").delete().eq("id", id);
  if (error) throw error;
}

/** « ×1,5 » : le Coefficient de portion tel qu'affiché. */
export const libelleDuCoefficient = (coefficient: number) => `×${String(coefficient).replace(".", ",")}`;

/**
 * Enregistre un Repas à partir du Plat, maintenant, avec le Coefficient de portion. Avec une précision, l'analyse
 * est relancée sur la base des Constituants copiés ; sinon l'IA n'est pas appelée. Renvoie l'identifiant du Repas.
 */
export async function reutiliserPlat(
  plat: PlatDetaille,
  coefficient: number,
  precision = "",
  maintenant = new Date(),
): Promise<string> {
  const fuseau = fuseauDuTelephone();
  const description = coefficient === 1 ? plat.nom : `${plat.nom} (${libelleDuCoefficient(coefficient)})`;
  const { data, error } = await supabase.rpc("enregistrer_repas_depuis_plat", {
    p_description: description,
    p_mange_le: maintenant.toISOString(),
    p_journee: journeeDe(maintenant, fuseau),
    p_type_repas: typeDeRepas(maintenant, fuseau),
    p_constituants: appliquerCoefficient(plat.constituants.map(sansIdentifiant), coefficient),
  });
  if (error) throw error;
  const repasId = data as string;

  if (precision.trim()) {
    const miseAJour = await supabase.from("repas").update({ precision: precision.trim() }).eq("id", repasId);
    if (miseAJour.error) throw miseAJour.error;
    await analyserRepas(repasId);
  }
  return repasId;
}
