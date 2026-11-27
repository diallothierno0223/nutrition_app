// Génère le Rendez-vous du samedi et l'enregistre directement (ADR 0003). Deux modes :
// - à la demande (tickets 12 et 15) : POST { force?: boolean, fuseau?: string } avec la session de l'utilisateur.
//   Sans force, idempotente : renvoie le Rendez-vous de la semaine s'il existe déjà (pas d'appel à l'IA) ;
//   avec force, nouvelle génération qui remplace les Recettes de la semaine.
// - automatique (ticket 15) : POST { automatique: true } avec la clé de service, appelé chaque heure par pg_cron.
//   Pour chaque compte, le noyau décide s'il faut générer (samedi ≥ 6 h dans son fuseau, pas déjà fait) ; un
//   Rendez-vous existant n'est jamais remplacé. Options de maintenance et de test : `maintenant` (ISO) et
//   `utilisateurs` (identifiants auxquels se limiter).
// Dans les deux cas, tout passe par le rôle de service avec un filtre explicite sur l'identifiant du compte.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.119.2";
import {
  NUTRIMENTS,
  ajouterJours,
  periodeDAnalyse,
  platDUnePortion,
  recettesInterdites,
  samediAGenererAutomatiquement,
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
      // Chaque Recette emporte son Plat de la semaine : une portion de chaque ingrédient (noyau métier).
      p_recettes: rendezVous.recettes.map((r) => ({ ...r, plat: platDUnePortion(r) })),
      p_automatique: automatique,
    }),
  ) as string;
  return { rendez_vous_id: id, samedi, genere: true };
}

const fuseauValide = (fuseau: unknown): fuseau is string => {
  if (typeof fuseau !== "string" || fuseau === "") return false;
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau });
    return true;
  } catch {
    return false;
  }
};

/**
 * Traitement automatique : génère le Rendez-vous de chaque compte pour qui le noyau dit qu'il est dû.
 * Un échec pour un compte n'arrête pas les autres ; l'appel de l'heure suivante sert de nouvel essai.
 */
async function genererAutomatiquement(admin: SupabaseClient, maintenant: Date, utilisateurs: string[] | null) {
  let comptes = admin.from("reglages").select("user_id");
  if (utilisateurs) comptes = comptes.in("user_id", utilisateurs);
  const ids = (verifier(await comptes) as { user_id: string }[]).map((c) => c.user_id);
  const [profils, existants] = await Promise.all([
    admin.from("profils").select("user_id, fuseau").in("user_id", ids),
    admin.from("rendez_vous").select("user_id, samedi").in("user_id", ids).gte("samedi", ajouterJours(maintenant.toISOString().slice(0, 10), -8)),
  ]);
  const fuseaux = new Map((verifier(profils) as { user_id: string; fuseau: string | null }[]).map((p) => [p.user_id, p.fuseau]));
  const deja = verifier(existants) as { user_id: string; samedi: string }[];

  const bilan = { generes: 0, ignores: 0, echecs: 0 };
  for (const userId of ids) {
    const fuseau = fuseauValide(fuseaux.get(userId)) ? fuseaux.get(userId)! : "UTC";
    const samedis = deja.filter((d) => d.user_id === userId).map((d) => d.samedi);
    if (!samediAGenererAutomatiquement(maintenant, fuseau, samedis)) {
      bilan.ignores++;
      continue;
    }
    try {
      await genererPourUtilisateur(admin, userId, fuseau, { force: false, automatique: true }, maintenant);
      bilan.generes++;
    } catch (e) {
      console.error(`generer-rendez-vous (automatique, ${userId}) :`, e instanceof Error ? e.message : String(e));
      bilan.echecs++;
    }
  }
  return bilan;
}

Deno.serve(async (requete) => {
  if (requete.method !== "POST") return Response.json({ erreur: "POST attendu" }, { status: 405 });
  const jeton = requete.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jeton) return Response.json({ erreur: "Session requise" }, { status: 401 });
  const corps = (await requete.json().catch(() => ({}))) ?? {};

  const cleDeService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, cleDeService, { auth: { persistSession: false } });

  if (corps.automatique === true) {
    if (jeton !== cleDeService) return Response.json({ erreur: "Réservé au traitement automatique" }, { status: 403 });
    const maintenant = typeof corps.maintenant === "string" ? new Date(corps.maintenant) : new Date();
    if (Number.isNaN(maintenant.getTime())) return Response.json({ erreur: "maintenant invalide" }, { status: 400 });
    const utilisateurs = Array.isArray(corps.utilisateurs) ? corps.utilisateurs.filter((u: unknown) => typeof u === "string") : null;
    try {
      return Response.json(await genererAutomatiquement(admin, maintenant, utilisateurs));
    } catch (e) {
      console.error("generer-rendez-vous (automatique) :", e instanceof Error ? e.message : String(e));
      return Response.json({ erreur: "Traitement automatique impossible." }, { status: 500 });
    }
  }

  const { data: utilisateur } = await admin.auth.getUser(jeton);
  if (!utilisateur.user) return Response.json({ erreur: "Session requise" }, { status: 401 });
  const userId = utilisateur.user.id;

  try {
    const profil = verifier(await admin.from("profils").select("fuseau").eq("user_id", userId).maybeSingle());
    const fuseau = fuseauValide(corps.fuseau) ? corps.fuseau : fuseauValide(profil?.fuseau) ? profil.fuseau : "UTC";
    const resultat = await genererPourUtilisateur(admin, userId, fuseau, { force: corps.force === true, automatique: false });
    return Response.json(resultat);
  } catch (e) {
    console.error("generer-rendez-vous :", e instanceof Error ? e.message : String(e));
    return Response.json({ erreur: "La génération a échoué, réessaie plus tard." }, { status: 502 });
  }
});
