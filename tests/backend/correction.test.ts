// Corriger un Repas après l'analyse (ADR 0003) : précision + relance par l'IA, ou corrections directes
// (quantité, Constituant, date, suppression) suivies par les totaux du jour.
// IA factice : 515 kcal par analyse (riz 195 + sauce arachide 320), Commentaire qui reprend description et précision.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";
import { analyser, creerRepasAnalyse } from "./outils.ts";

async function caloriesDuJour(utilisateur: UtilisateurDeTest, journee: string) {
  const { data, error } = await utilisateur.client.from("totaux_du_jour").select("calories").eq("journee", journee).maybeSingle();
  if (error) throw error;
  return data?.calories ?? 0;
}

async function constituants(utilisateur: UtilisateurDeTest, repasId: string) {
  const { data, error } = await utilisateur.client
    .from("constituants")
    .select("id, nom, quantite, calories")
    .eq("repas_id", repasId)
    .order("position");
  if (error) throw error;
  return data;
}

describe("correction d'un Repas", () => {
  let moi: UtilisateurDeTest;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
  });
  afterAll(async () => {
    await moi?.supprimer();
  });

  it("régénère Constituants et Commentaire quand on relance avec une précision", async () => {
    const repasId = await creerRepasAnalyse(moi, "Riz sauce arachide", "2026-11-02");
    const [riz] = await constituants(moi, repasId);
    if (!riz) throw new Error("Constituant attendu");
    await moi.client.from("constituants").delete().eq("id", riz.id);

    await moi.client.from("repas").update({ precision: "j'ai ajouté une cuillère d'huile" }).eq("id", repasId);
    expect((await analyser(moi, repasId)).status).toBe(200);

    const { data: repas } = await moi.client.from("repas").select("commentaire").eq("id", repasId).single();
    expect(repas?.commentaire).toContain("Précision : j'ai ajouté une cuillère d'huile");
    expect(await constituants(moi, repasId)).toHaveLength(2);
  });

  it("suit une quantité corrigée sans toucher au Commentaire", async () => {
    const repasId = await creerRepasAnalyse(moi, "Riz sauce arachide", "2026-11-03");
    const { data: avant } = await moi.client.from("repas").select("commentaire").eq("id", repasId).single();
    const [riz] = await constituants(moi, repasId);
    if (!riz) throw new Error("Constituant attendu");

    await moi.client.from("constituants").update({ quantite: 300, calories: 390 }).eq("id", riz.id);

    expect(await caloriesDuJour(moi, "2026-11-03")).toBe(710);
    const { data: apres } = await moi.client.from("repas").select("commentaire").eq("id", repasId).single();
    expect(apres?.commentaire).toBe(avant?.commentaire);
  });

  it("suit l'ajout et la suppression d'un Constituant", async () => {
    const repasId = await creerRepasAnalyse(moi, "Riz sauce arachide", "2026-11-04");
    const [riz] = await constituants(moi, repasId);
    if (!riz) throw new Error("Constituant attendu");

    await moi.client.from("constituants").delete().eq("id", riz.id);
    expect(await caloriesDuJour(moi, "2026-11-04")).toBe(320);

    const { error } = await moi.client.from("constituants").insert({
      repas_id: repasId, position: 3, nom: "Huile d'arachide", quantite: 10, unite: "ml", equivalent_cuisine: "1 c. à soupe",
      calories: 90, proteines: 0, glucides: 0, sucres: 0, lipides: 10, ags: 1.7, fibres: 0, sel: 0,
    });
    expect(error).toBeNull();
    expect(await caloriesDuJour(moi, "2026-11-04")).toBe(410);
  });

  it("rattache un Repas déplacé à sa nouvelle Journée", async () => {
    const repasId = await creerRepasAnalyse(moi, "Riz sauce arachide", "2026-11-05");

    await moi.client
      .from("repas")
      .update({ mange_le: "2026-11-06T19:30:00Z", journee: "2026-11-06", type_repas: "diner" })
      .eq("id", repasId);

    expect(await caloriesDuJour(moi, "2026-11-05")).toBe(0);
    expect(await caloriesDuJour(moi, "2026-11-06")).toBe(515);
  });

  it("retire des totaux un Repas supprimé, avec ses Constituants", async () => {
    const repasId = await creerRepasAnalyse(moi, "Riz sauce arachide", "2026-11-07");

    const { error } = await moi.client.from("repas").delete().eq("id", repasId);
    expect(error).toBeNull();

    expect(await caloriesDuJour(moi, "2026-11-07")).toBe(0);
    expect(await constituants(moi, repasId)).toEqual([]);
  });
});
