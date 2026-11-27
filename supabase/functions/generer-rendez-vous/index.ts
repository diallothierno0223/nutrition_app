// Génère le Rendez-vous du samedi (ticket 12) et l'enregistre directement (ADR 0003).
// Entrée : POST { force?: boolean, fuseau?: string } avec la session de l'utilisateur.
// - sans force : idempotente, renvoie le Rendez-vous de la semaine s'il existe déjà (pas d'appel à l'IA) ;
// - avec force : nouvelle génération, qui remplace les Recettes de la semaine.
// L'utilisateur est authentifié par son jeton, puis tout passe par le rôle de service avec un filtre explicite
// sur son identifiant : c'est le même chemin que le traitement automatique (ticket 15).
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.2";
import {
  NUTRIMENTS,
  ajouterJours,
  periodeDAnalyse,
  recettesInterdites,
  samediDeReference,
  SEMAINES_SANS_REPETITION,
  type ObjectifsJournaliers,
  type RecetteDejaProposee,
  type ReglagesDuSamedi,
  type ValeursNutritionnelles,
} from "../../../noyau/index.ts";
import { iaDepuisEnvironnement } from "../_shared/ia.ts";
import { reglesActives } from "../_shared/regles.ts";

const COLONNES_NUTRIMENTS = NUTRIMENTS.join(", ");

type Generation = { rendez_vous_id: string; samedi: string; genere: boolean };

function verifier<T>(resultat: { data: T; error: { message: string } | null }): T {
  if (resultat.error) throw new Error(resultat.error.message);
  return resultat.data;
}

/**
 * Les Recettes de déjeuners et dîners déjà proposées qui comptent pour la règle de variété (récentes, ou marquées
 * « à refaire ») ; les petits-déjeuners peuvent revenir.
 */
async function historiqueDesRecettes(admin: SupabaseClient, userId: string, samedi: string): Promise<RecetteDejaProposee[]> {
  const debut = ajouterJours(samedi, -7 * SEMAINES_SANS_REPETITION);
  const selection = "nom, a_refaire, rendez_vous!inner (samedi, user_id)";
  const [recentes, aRefaire] = await Promise.all([
    admin
      .from("recettes")
      .select(selection)
      .eq("categorie", "repas")
      .eq("rendez_vous.user_id", userId)
      .gte("rendez_vous.samedi", debut),
    admin.from("recettes").select(selection).eq("categorie", "repas").eq("rendez_vous.user_id", userId).eq("a_refaire", true),
  ]);
  type Ligne = { nom: string; a_refaire: boolean; rendez_vous: { samedi: string } };
  const lignes = [...(verifier(recentes) as unknown as Ligne[]), ...(verifier(aRefaire) as unknown as Ligne[])];
  return lignes.map((r) => ({ nom: r.nom, a_refaire: r.a_refaire, samedi: r.rendez_vous.samedi }));
}

/** Génère (si besoin) et enregistre le Rendez-vous de la semaine d'un utilisateur. */
export async function genererPourUtilisateur(
  admin: SupabaseClient,
  userId: string,
  fuseau: string,
  { force, automatique }: { force: boolean; automatique: boolean },
  maintenant = new Date(),
): Promise<Generation> {
  const samedi = samediDeReference(maintenant, fuseau);

  const existant = verifier(
    await admin.from("rendez_vous").select("id").eq("user_id", userId).eq("samedi", samedi).maybeSingle(),
  );
  if (existant && !force) return { rendez_vous_id: existant.id, samedi, genere: false };

  const periode = periodeDAnalyse(samedi);
  const [totaux, objectifs, reglages, regles, historique] = await Promise.all([
    admin
      .from("totaux_du_jour")
      .select(`journee, ${COLONNES_NUTRIMENTS}`)
      .eq("user_id", userId)
      .gte("journee", periode[0]!)
      .lte("journee", periode[6]!)
      .order("journee"),
    admin.from("objectifs_journaliers").select(COLONNES_NUTRIMENTS).eq("user_id", userId).maybeSingle(),
    admin
      .from("reglages")
      .select("samedi_recettes, samedi_portions, samedi_portions_nomade, samedi_matins_rapides")
      .eq("user_id", userId)
      .single(),
    reglesActives(admin, userId),
    historiqueDesRecettes(admin, userId, samedi),
  ]);
  const r = verifier(reglages);
  const reglagesDuSamedi: ReglagesDuSamedi = {
    recettes: r.samedi_recettes,
    portions: r.samedi_portions,
    portionsNomade: r.samedi_portions_nomade,
    matinsRapides: r.samedi_matins_rapides,
  };
  const interdites = recettesInterdites(historique, samedi);

  const rendezVous = await iaDepuisEnvironnement().genererRendezVous({
    samedi,
    periode: (verifier(totaux) as unknown as (ValeursNutritionnelles & { journee: string })[]).map(({ journee, ...t }) => ({
      journee,
      totaux: t as ValeursNutritionnelles,
    })),
    objectifs: verifier(objectifs) as ObjectifsJournaliers | null,
    reglesDuMedecin: regles,
    interdites,
    aRefaire: [...new Set(historique.filter((h) => h.a_refaire).map((h) => h.nom))],
    reglages: reglagesDuSamedi,
  });

  const id = verifier(
    await admin.rpc("ecrire_rendez_vous", {
      p_user_id: userId,
      p_samedi: samedi,
      p_bilan: rendezVous.bilan,
      p_recettes: rendezVous.recettes,
      p_automatique: automatique,
    }),
  ) as string;
  return { rendez_vous_id: id, samedi, genere: true };
}

const fuseauValide = (fuseau: unknown): fuseau is string => {
  if (typeof fuseau !== "string") return false;
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau });
    return true;
  } catch {
    return false;
  }
};

Deno.serve(async (requete) => {
  if (requete.method !== "POST") return Response.json({ erreur: "POST attendu" }, { status: 405 });
  const jeton = requete.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jeton) return Response.json({ erreur: "Session requise" }, { status: 401 });
  const corps = (await requete.json().catch(() => ({}))) ?? {};

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: utilisateur } = await admin.auth.getUser(jeton);
  if (!utilisateur.user) return Response.json({ erreur: "Session requise" }, { status: 401 });
  const userId = utilisateur.user.id;

  try {
    const profil = verifier(await admin.from("profils").select("fuseau").eq("user_id", userId).maybeSingle());
    const fuseau = fuseauValide(corps.fuseau) ? corps.fuseau : profil?.fuseau || "UTC";
    const resultat = await genererPourUtilisateur(admin, userId, fuseau, { force: corps.force === true, automatique: false });
    return Response.json(resultat);
  } catch (e) {
    console.error("generer-rendez-vous :", e instanceof Error ? e.message : String(e));
    return Response.json({ erreur: "La génération a échoué, réessaie plus tard." }, { status: 502 });
  }
});
