// Rendez-vous du samedi généré à la demande, avec l'IA factice : 3 Recettes prises dans l'ordre d'une réserve
// (Mafé de poisson, Fonio aux légumes, Soupe kandia, Yassa de poulet…) en sautant les interdites,
// un Petit-déjeuner nomade (Galettes de mil) et 2 idées rapides.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clientAdmin, creerUtilisateurConnecte, statutLocal, type UtilisateurDeTest } from "./supabase-local.ts";

async function generer(utilisateur: UtilisateurDeTest | null, corps: Record<string, unknown> = {}) {
  const jeton = utilisateur ? (await utilisateur.client.auth.getSession()).data.session?.access_token : statutLocal().ANON_KEY;
  return fetch(`${statutLocal().API_URL}/functions/v1/generer-rendez-vous`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fuseau: "Europe/Paris", ...corps }),
  });
}

async function recettesDe(utilisateur: UtilisateurDeTest, rendezVousId: string) {
  const { data, error } = await utilisateur.client
    .from("recettes")
    .select("id, nom, categorie, portions, etapes, ingredients_de_recette (nom)")
    .eq("rendez_vous_id", rendezVousId)
    .order("position");
  if (error) throw error;
  return data;
}

describe("Rendez-vous du samedi", () => {
  let moi: UtilisateurDeTest;
  let autre: UtilisateurDeTest;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
    autre = await creerUtilisateurConnecte();
  });
  afterAll(async () => {
    await moi?.supprimer();
    await autre?.supprimer();
  });

  it("enregistre directement le Bilan, les Recettes et les petits-déjeuners", async () => {
    const reponse = await generer(moi);
    expect(reponse.status).toBe(200);
    const { rendez_vous_id, samedi, genere } = await reponse.json();
    expect(genere).toBe(true);
    expect(new Date(`${samedi}T00:00:00Z`).getUTCDay()).toBe(6);

    const { data: rdv } = await moi.client.from("rendez_vous").select("bilan, automatique").eq("id", rendez_vous_id).single();
    expect(rdv?.bilan).toContain("Bilan factice");
    expect(rdv?.automatique).toBe(false);

    const recettes = await recettesDe(moi, rendez_vous_id);
    expect(recettes.map((r) => [r.nom, r.categorie, r.portions])).toEqual([
      ["Mafé de poisson", "repas", 4],
      ["Fonio aux légumes", "repas", 3],
      ["Soupe kandia", "repas", 3],
      ["Galettes de mil", "petit_dejeuner_nomade", 3],
      ["Bouillie de mil", "petit_dejeuner_rapide", 2],
      ["Pain complet et avocat", "petit_dejeuner_rapide", 2],
    ]);
    expect(recettes[0]?.etapes).toHaveLength(2);
    expect(recettes[0]?.ingredients_de_recette.map((i) => i.nom)).toEqual(["Oignon", "Base : Mafé de poisson"]);
  });

  it("ne regénère pas sans le demander : même Rendez-vous, mêmes Recettes", async () => {
    const premier = await (await generer(moi)).json();
    const avant = await recettesDe(moi, premier.rendez_vous_id);

    const second = await (await generer(moi)).json();
    expect(second).toEqual({ ...premier, genere: false });
    expect(await recettesDe(moi, second.rendez_vous_id)).toEqual(avant);
  });

  it("remplace les Recettes de la semaine lors d'une nouvelle génération forcée, sans les reproposer", async () => {
    const premier = await (await generer(moi)).json();
    const reponse = await generer(moi, { force: true });
    expect(reponse.status).toBe(200);
    const force = await reponse.json();

    expect(force.rendez_vous_id).toBe(premier.rendez_vous_id);
    const recettes = await recettesDe(moi, force.rendez_vous_id);
    expect(recettes.filter((r) => r.categorie === "repas").map((r) => r.nom)).toEqual([
      "Yassa de poulet",
      "Attiéké poisson braisé",
      "Thiéboudienne légère",
    ]);
  });

  it("repropose une Recette marquée « à refaire »", async () => {
    const { rendez_vous_id } = await (await generer(moi)).json();
    const [premiere] = await recettesDe(moi, rendez_vous_id);
    const { error } = await moi.client.from("recettes").update({ a_refaire: true }).eq("id", premiere!.id);
    expect(error).toBeNull();

    const force = await (await generer(moi, { force: true })).json();
    const noms = (await recettesDe(moi, force.rendez_vous_id)).map((r) => r.nom);
    expect(noms).toContain(premiere!.nom);
  });

  it("suit les Réglages du samedi", async () => {
    await moi.client.from("reglages").update({ samedi_recettes: 2, samedi_portions: 6 }).eq("user_id", moi.id);

    const force = await (await generer(moi, { force: true })).json();
    const repas = (await recettesDe(moi, force.rendez_vous_id)).filter((r) => r.categorie === "repas");
    expect(repas.map((r) => r.portions)).toEqual([3, 3]);
  });

  it("garde chaque Rendez-vous privé, et non modifiable directement", async () => {
    const { rendez_vous_id } = await (await generer(moi)).json();

    const { data: vu } = await autre.client.from("rendez_vous").select("id").eq("id", rendez_vous_id);
    expect(vu).toEqual([]);

    const { error: insertion } = await moi.client
      .from("rendez_vous")
      .insert({ user_id: moi.id, samedi: "2026-01-03", bilan: "x", automatique: false });
    expect(insertion).not.toBeNull();

    const { error: rpc } = await moi.client.rpc("ecrire_rendez_vous", {
      p_user_id: moi.id, p_samedi: "2026-01-03", p_bilan: "x", p_recettes: [], p_automatique: false,
    });
    expect(rpc).not.toBeNull();

    const { error: nom } = await moi.client.from("recettes").update({ nom: "Autre" }).eq("rendez_vous_id", rendez_vous_id);
    expect(nom).not.toBeNull();
  });

  it("refuse un appel sans session", async () => {
    expect((await generer(null)).status).toBe(401);
  });

  it("n'écrase jamais un Rendez-vous existant en mode automatique (ecrire_rendez_vous)", async () => {
    const { rendez_vous_id, samedi } = await (await generer(moi)).json();
    const avant = await recettesDe(moi, rendez_vous_id);

    const { data, error } = await clientAdmin().rpc("ecrire_rendez_vous", {
      p_user_id: moi.id, p_samedi: samedi, p_bilan: "Autre", p_recettes: [], p_automatique: true,
    });
    expect(error).toBeNull();
    expect(data).toBe(rendez_vous_id);
    expect(await recettesDe(moi, rendez_vous_id)).toEqual(avant);
  });
});
