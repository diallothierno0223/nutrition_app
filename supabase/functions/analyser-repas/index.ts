// Analyse un Repas par l'IA et enregistre directement ses Constituants et son Commentaire (ADR 0003).
// Entrée : POST { repas_id }. Toutes les lectures et écritures passent par la session de l'appelant (RLS).
import { createClient } from "npm:@supabase/supabase-js@2.119.2";
import { iaDepuisEnvironnement } from "../_shared/ia.ts";

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
    .select("id, description, type_repas")
    .eq("id", repasId)
    .maybeSingle();
  if (!repas) return Response.json({ erreur: "Repas introuvable" }, { status: 404 });

  try {
    const analyse = await iaDepuisEnvironnement().analyserRepas({
      description: repas.description,
      typeDeRepas: repas.type_repas,
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
