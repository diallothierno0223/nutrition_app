// Analyse un Repas par l'IA et enregistre directement ses Constituants et son Commentaire (ADR 0003).
// Entrée : POST { repas_id }. Toutes les lectures et écritures passent par la session de l'appelant (RLS).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.2";
import {
  NUTRIMENTS,
  objectifsRestants,
  retirerValeurs,
  totauxDuRepas,
  type Constituant,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "../../../noyau/index.ts";
import { iaDepuisEnvironnement, type PhotoDuRepas } from "../_shared/ia.ts";
import { reglesActives } from "../_shared/regles.ts";

const COLONNES_NUTRIMENTS = NUTRIMENTS.join(", ");
const RIEN = Object.fromEntries(NUTRIMENTS.map((n) => [n, 0])) as ValeursNutritionnelles;

type RepasAAnalyser = { id: string; journee: string; statut: string };

/** Relit la photo du Repas dans le bucket privé, avec la session de l'appelant. */
async function lirePhoto(supabase: SupabaseClient, chemin: string | null): Promise<PhotoDuRepas | null> {
  if (!chemin) return null;
  const { data, error } = await supabase.storage.from("photos-repas").download(chemin);
  if (error || !data) throw new Error(`photo illisible : ${error?.message ?? "absente"}`);
  return { typeMime: data.type || "image/jpeg", octets: new Uint8Array(await data.arrayBuffer()) };
}

const COLONNES_CONSTITUANT = ["nom", "quantite", "unite", "equivalent_cuisine", ...NUTRIMENTS].join(", ");

/** Les Constituants actuels d'un Repas déjà analysé (base d'une relance) ; aucun pour un Repas en attente. */
async function constituantsActuels(supabase: SupabaseClient, repas: RepasAAnalyser): Promise<Constituant[]> {
  if (repas.statut !== "analyse") return [];
  const { data, error } = await supabase
    .from("constituants")
    .select(COLONNES_CONSTITUANT)
    .eq("repas_id", repas.id)
    .order("position");
  if (error) throw new Error(error.message);
  return data as unknown as Constituant[];
}

/**
 * Ce qui reste des Objectifs de la Journée sans compter ce Repas : les totaux du jour (vue SQL, Repas analysés
 * seulement) moins les Constituants actuels de ce Repas, pour qu'une relance ne se compte pas elle-même.
 */
async function objectifsRestantsSansCeRepas(
  supabase: SupabaseClient,
  repas: RepasAAnalyser,
  actuels: Constituant[],
): Promise<ObjectifsJournaliers | null> {
  const objectifs = await supabase.from("objectifs_journaliers").select(COLONNES_NUTRIMENTS).maybeSingle();
  if (objectifs.error) throw new Error(objectifs.error.message);
  if (!objectifs.data) return null;

  const totaux = await supabase
    .from("totaux_du_jour")
    .select(COLONNES_NUTRIMENTS)
    .eq("journee", repas.journee)
    .maybeSingle();
  if (totaux.error) throw new Error(totaux.error.message);
  const consommes = retirerValeurs((totaux.data as ValeursNutritionnelles | null) ?? RIEN, totauxDuRepas(actuels));
  return objectifsRestants(objectifs.data as ObjectifsJournaliers, consommes);
}

Deno.serve(async (requete) => {
  if (requete.method !== "POST") return Response.json({ erreur: "POST attendu" }, { status: 405 });

  const corps = await requete.json().catch(() => null);
  const repasId = corps?.repas_id;
  if (typeof repasId !== "string") return Response.json({ erreur: "repas_id manquant" }, { status: 400 });

  // La passerelle vérifie déjà le jeton (verify_jwt) ; on refuse quand même explicitement un appel sans session.
  const autorisation = requete.headers.get("Authorization");
  if (!autorisation) return Response.json({ erreur: "Session requise" }, { status: 401 });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: autorisation } },
    auth: { persistSession: false },
  });

  const { data: repas } = await supabase
    .from("repas")
    .select("id, description, photo_chemin, precision, type_repas, journee, statut")
    .eq("id", repasId)
    .maybeSingle();
  if (!repas) return Response.json({ erreur: "Repas introuvable" }, { status: 404 });

  try {
    const actuels = await constituantsActuels(supabase, repas);
    const analyse = await iaDepuisEnvironnement().analyserRepas({
      description: repas.description,
      photo: await lirePhoto(supabase, repas.photo_chemin),
      precision: repas.precision,
      constituantsActuels: actuels,
      typeDeRepas: repas.type_repas,
      objectifsRestants: await objectifsRestantsSansCeRepas(supabase, repas, actuels),
      reglesDuMedecin: await reglesActives(supabase),
    });
    const { error } = await supabase.rpc("enregistrer_analyse", {
      p_repas_id: repas.id,
      p_constituants: analyse.constituants,
      p_commentaire: analyse.commentaire,
    });
    if (error) throw new Error(error.message);
    return Response.json({ repas_id: repas.id, statut: "analyse" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("analyser-repas :", message);
    await supabase.from("repas").update({ erreur_analyse: message }).eq("id", repas.id);
    return Response.json({ erreur: "L'analyse a échoué, réessaie plus tard." }, { status: 502 });
  }
});
