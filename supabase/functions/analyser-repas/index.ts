// Analyse un Repas par l'IA et enregistre directement ses Constituants et son Commentaire (ADR 0003).
// Entrée : POST { repas_id }. Toutes les lectures et écritures passent par la session de l'appelant (RLS).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.2";
import {
  NUTRIMENTS,
  objectifsRestants,
  retirerValeurs,
  totauxDuRepas,
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

/**
 * Ce qui reste des Objectifs de la Journée sans compter ce Repas : les totaux du jour (vue SQL, Repas analysés
 * seulement) moins ce Repas s'il est déjà analysé, pour qu'une relance ne se compte pas elle-même.
 */
async function objectifsRestantsSansCeRepas(
  supabase: SupabaseClient,
  repas: RepasAAnalyser,
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
  let consommes = (totaux.data as ValeursNutritionnelles | null) ?? RIEN;

  if (repas.statut === "analyse") {
    const ceRepas = await supabase.from("constituants").select(COLONNES_NUTRIMENTS).eq("repas_id", repas.id);
    if (ceRepas.error) throw new Error(ceRepas.error.message);
    consommes = retirerValeurs(consommes, totauxDuRepas(ceRepas.data as ValeursNutritionnelles[]));
  }

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
    .select("id, description, photo_chemin, type_repas, journee, statut")
    .eq("id", repasId)
    .maybeSingle();
  if (!repas) return Response.json({ erreur: "Repas introuvable" }, { status: 404 });

  try {
    const analyse = await iaDepuisEnvironnement().analyserRepas({
      description: repas.description,
      photo: await lirePhoto(supabase, repas.photo_chemin),
      typeDeRepas: repas.type_repas,
      objectifsRestants: await objectifsRestantsSansCeRepas(supabase, repas),
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
