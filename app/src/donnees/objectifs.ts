// Objectifs journaliers et totaux du jour (vue SQL : seuls les Repas analysés comptent).
import { NUTRIMENTS, type ObjectifsJournaliers, type ValeursNutritionnelles } from "@noyau";

import { supabase } from "@/lib/supabase";

const COLONNES = NUTRIMENTS.join(", ");

const AUCUN_OBJECTIF = Object.fromEntries(NUTRIMENTS.map((n) => [n, null])) as ObjectifsJournaliers;
const RIEN_CONSOMME = Object.fromEntries(NUTRIMENTS.map((n) => [n, 0])) as ValeursNutritionnelles;

export async function chargerObjectifs(): Promise<ObjectifsJournaliers> {
  const { data, error } = await supabase.from("objectifs_journaliers").select(COLONNES).maybeSingle();
  if (error) throw error;
  return (data as ObjectifsJournaliers | null) ?? AUCUN_OBJECTIF;
}

/**
 * Applique les Objectifs journaliers et l'objectif d'eau (ml). La date est posée explicitement : appliquer, même
 * à l'identique, vaut validation et fait disparaître la proposition de réestimation.
 */
export async function enregistrerObjectifs(objectifs: ObjectifsJournaliers, eauMl: number | null): Promise<void> {
  const { error } = await supabase
    .from("objectifs_journaliers")
    .upsert({ ...objectifs, eau_ml: eauMl, modifie_le: new Date().toISOString() });
  if (error) throw error;
}

export async function totauxDuJour(journee: string): Promise<ValeursNutritionnelles> {
  const { data, error } = await supabase.from("totaux_du_jour").select(COLONNES).eq("journee", journee).maybeSingle();
  if (error) throw error;
  return (data as ValeursNutritionnelles | null) ?? RIEN_CONSOMME;
}

export type TotauxDUneJournee = ValeursNutritionnelles & { journee: string };

/** Les totaux de chaque Journée renseignée (au moins un Repas analysé) entre deux dates incluses ; sans début, depuis toujours. */
export async function totauxDesJournees(debut: string | null, fin: string): Promise<TotauxDUneJournee[]> {
  let requete = supabase.from("totaux_du_jour").select(`journee, ${COLONNES}`).lte("journee", fin);
  if (debut) requete = requete.gte("journee", debut);
  const { data, error } = await requete.order("journee");
  if (error) throw error;
  return data as unknown as TotauxDUneJournee[];
}

/** Les totaux de la Semaine qui commence ce lundi (vue SQL). */
export async function totauxDeLaSemaine(lundi: string): Promise<ValeursNutritionnelles> {
  const { data, error } = await supabase.from("totaux_de_la_semaine").select(COLONNES).eq("lundi", lundi).maybeSingle();
  if (error) throw error;
  return (data as ValeursNutritionnelles | null) ?? RIEN_CONSOMME;
}
