// Estimation des Objectifs journaliers par l'IA (ADR 0004). N'écrit rien : l'app pré-remplit la proposition
// et ne l'applique qu'avec « Appliquer ». Entrée : POST {}. Lectures avec la session de l'appelant (RLS).
import { createClient } from "npm:@supabase/supabase-js@2.119.2";
import { ageA, besoinEnergetique, ecartAvecGardeFou, journeeDe, type ProfilCorporel } from "../../../noyau/index.ts";
import { iaDepuisEnvironnement } from "../_shared/ia.ts";
import { reglesActives } from "../_shared/regles.ts";

Deno.serve(async (requete) => {
  if (requete.method !== "POST") return Response.json({ erreur: "POST attendu" }, { status: 405 });

  // La passerelle vérifie déjà le jeton (verify_jwt) ; on refuse quand même explicitement un appel sans session.
  const autorisation = requete.headers.get("Authorization");
  if (!autorisation) return Response.json({ erreur: "Session requise" }, { status: 401 });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: autorisation } },
    auth: { persistSession: false },
  });

  // Lectures : une erreur ici est une panne de la base (500), pas de l'IA.
  let lectures;
  try {
    lectures = await Promise.all([
      supabase
        .from("profils")
        .select("taille_cm, date_naissance, sexe, niveau_activite, fuseau, objectifs_personnels, objectif_poids_variation_kg, objectif_poids_echeance")
        .maybeSingle(),
      supabase.from("pesees").select("poids_kg").order("pese_le", { ascending: false }).limit(1).maybeSingle(),
      reglesActives(supabase),
    ]);
    for (const r of lectures.slice(0, 2) as { error: { message: string } | null }[]) {
      if (r.error) throw new Error(r.error.message);
    }
  } catch (e) {
    console.error("estimer-objectifs (lecture) :", e instanceof Error ? e.message : String(e));
    return Response.json({ erreur: "Lecture de tes données impossible, réessaie plus tard." }, { status: 500 });
  }
  const [profil, pesee, regles] = lectures;

  const p = profil.data;
  if (!p?.taille_cm || !p.date_naissance || !p.sexe || !p.niveau_activite) {
    return Response.json({ erreur: "Complète ton Profil (taille, date de naissance, sexe, activité)." }, { status: 422 });
  }
  if (!pesee.data) return Response.json({ erreur: "Ajoute au moins une Pesée." }, { status: 422 });

  // Appel à l'IA : une erreur ici (réseau, réponse invalide) donne 502.
  try {
    const profilCorporel = p as ProfilCorporel;
    const poidsKg = Number(pesee.data.poids_kg);
    const aujourdhui = journeeDe(new Date(), p.fuseau || "UTC");
    const caloriesGardeFou = besoinEnergetique(profilCorporel, poidsKg, aujourdhui);

    const estimation = await iaDepuisEnvironnement().estimerObjectifs({
      profil: profilCorporel,
      poidsKg,
      age: ageA(p.date_naissance, aujourdhui),
      objectifsPersonnels: p.objectifs_personnels,
      objectifDePoids:
        p.objectif_poids_variation_kg !== null && p.objectif_poids_echeance
          ? { variationKg: Number(p.objectif_poids_variation_kg), echeance: p.objectif_poids_echeance }
          : null,
      caloriesGardeFou,
      reglesDuMedecin: regles,
    });

    const ecart = ecartAvecGardeFou(estimation.calories.valeur, caloriesGardeFou);
    return Response.json({
      estimation,
      garde_fou: { calories: caloriesGardeFou, ecart_pourcentage: ecart.pourcentage, alerte: ecart.alerte },
    });
  } catch (e) {
    console.error("estimer-objectifs (IA) :", e instanceof Error ? e.message : String(e));
    return Response.json({ erreur: "L'estimation a échoué, réessaie plus tard." }, { status: 502 });
  }
});
