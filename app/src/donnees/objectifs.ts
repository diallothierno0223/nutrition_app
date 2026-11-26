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

export async function enregistrerObjectifs(objectifs: ObjectifsJournaliers): Promise<void> {
  const { error } = await supabase
    .from("objectifs_journaliers")
    .upsert({ ...objectifs, modifie_le: new Date().toISOString() });
  if (error) throw error;
}

export async function totauxDuJour(journee: string): Promise<ValeursNutritionnelles> {
  const { data, error } = await supabase.from("totaux_du_jour").select(COLONNES).eq("journee", journee).maybeSingle();
  if (error) throw error;
  return (data as ValeursNutritionnelles | null) ?? RIEN_CONSOMME;
}
