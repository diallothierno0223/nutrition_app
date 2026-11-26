// Carnet des Règles du médecin. Une Règle s'archive, elle ne se supprime jamais.
import type { RegleDuMedecin } from "@noyau";

import { supabase } from "@/lib/supabase";

/** Une Règle du médecin telle que la saisit l'utilisateur. */
export type NouvelleRegle = RegleDuMedecin & { date_consultation: string };

/** Une Règle enregistrée ; archivee_le est null tant qu'elle est active. */
export type Regle = NouvelleRegle & { id: string; archivee_le: string | null };

const nettoyee = (regle: NouvelleRegle): NouvelleRegle => ({ ...regle, texte: regle.texte.trim() });

const COLONNES = "id, categorie, texte, date_consultation, archivee_le";

/** Toutes les Règles, actives et archivées, de la plus récente consultation à la plus ancienne. */
export async function listerRegles(): Promise<Regle[]> {
  const { data, error } = await supabase
    .from("regles_medecin")
    .select(COLONNES)
    .order("date_consultation", { ascending: false })
    .order("cree_le", { ascending: false });
  if (error) throw error;
  return data as Regle[];
}

export async function ajouterRegle(regle: NouvelleRegle): Promise<void> {
  const { error } = await supabase.from("regles_medecin").insert(nettoyee(regle));
  if (error) throw error;
}

export async function modifierRegle(id: string, regle: NouvelleRegle): Promise<void> {
  const { error } = await supabase
    .from("regles_medecin")
    .update(nettoyee(regle))
    .eq("id", id);
  if (error) throw error;
}

/** Archive (ou réactive) une Règle : seules les Règles actives sont transmises à l'IA. */
export async function archiverRegle(id: string, archiver: boolean): Promise<void> {
  const { error } = await supabase
    .from("regles_medecin")
    .update({ archivee_le: archiver ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}
