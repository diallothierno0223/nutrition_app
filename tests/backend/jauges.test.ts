import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";
import { analyser, creerRepas, creerRepasAnalyse } from "./outils.ts";

const OBJECTIFS = { calories: 2500, proteines: 90, glucides: 330, lipides: 85, ags: 20, fibres: 30, sel: 5 };

describe("Objectifs journaliers", () => {
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

  it("se modifient à la main, et seuls les miens me sont visibles", async () => {
    const { error } = await moi.client.from("objectifs_journaliers").upsert({ ...OBJECTIFS, sel: null });
    expect(error).toBeNull();
    await moi.client.from("objectifs_journaliers").upsert({ ...OBJECTIFS, sel: 6 });

    const { data } = await moi.client.from("objectifs_journaliers").select("calories, sel");
    expect(data).toEqual([{ calories: 2500, sel: 6 }]);

    const { data: vusParAutre } = await autre.client.from("objectifs_journaliers").select("*");
    expect(vusParAutre).toEqual([]);
  });

  it("refusent une valeur négative", async () => {
    const { error } = await moi.client.from("objectifs_journaliers").upsert({ ...OBJECTIFS, ags: -1 });
    expect(error).not.toBeNull();
  });
});

describe("totaux du jour", () => {
  let moi: UtilisateurDeTest;
  let autre: UtilisateurDeTest;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
    autre = await creerUtilisateurConnecte();
    await creerRepasAnalyse(moi, "Déjeuner", "2026-11-26");
    await creerRepasAnalyse(moi, "Dîner", "2026-11-26");
    await creerRepas(moi.client, "Collation pas encore analysée", "2026-11-26");
    await creerRepasAnalyse(moi, "Repas de la veille", "2026-11-25");
  });
  afterAll(async () => {
    await moi?.supprimer();
    await autre?.supprimer();
  });

  it("additionnent les Repas analysés de la Journée, sans les Repas en attente", async () => {
    const { data } = await moi.client
      .from("totaux_du_jour")
      .select("calories, ags")
      .eq("journee", "2026-11-26")
      .single();
    expect(data).toEqual({ calories: 1030, ags: 13.2 });
  });

  it("restent invisibles pour un autre utilisateur", async () => {
    const { data } = await autre.client.from("totaux_du_jour").select("*");
    expect(data).toEqual([]);
  });
});

describe("Commentaire du repas et Objectifs restants", () => {
  let moi: UtilisateurDeTest;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
    await moi.client.from("objectifs_journaliers").upsert(OBJECTIFS);
    await creerRepasAnalyse(moi, "Petit-déjeuner", "2026-11-26");
  });
  afterAll(async () => moi?.supprimer());

  it("transmet à l'IA ce qui reste du jour, sans compter le Repas analysé lui-même", async () => {
    const repasId = await creerRepasAnalyse(moi, "Déjeuner", "2026-11-26");
    await analyser(moi, repasId); // une relance ne doit pas se compter elle-même

    const { data } = await moi.client.from("repas").select("commentaire").eq("id", repasId).single();
    expect(data?.commentaire).toContain("Calories restantes : 1985 kcal");
  });
});
