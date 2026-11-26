import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";

async function boire(utilisateur: UtilisateurDeTest, quantite_ml: number, journee = "2026-11-27") {
  const { data, error } = await utilisateur.client
    .from("hydratation")
    .insert({ quantite_ml, journee, bu_le: `${journee}T10:00:00Z` })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function totalDuJour(utilisateur: UtilisateurDeTest, journee = "2026-11-27") {
  const { data } = await utilisateur.client.from("hydratation_du_jour").select("total_ml").eq("journee", journee).maybeSingle();
  return data?.total_ml ?? 0;
}

describe("Hydratation", () => {
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

  it("additionne les ajouts d'eau de la Journée", async () => {
    await boire(moi, 250);
    await boire(moi, 500);
    await boire(moi, 250, "2026-11-26");
    expect(await totalDuJour(moi)).toBe(750);
  });

  it("permet d'annuler un ajout", async () => {
    const id = await boire(moi, 500);
    expect(await totalDuJour(moi)).toBe(1250);
    await moi.client.from("hydratation").delete().eq("id", id);
    expect(await totalDuJour(moi)).toBe(750);
  });

  it("reste invisible pour un autre utilisateur", async () => {
    expect((await autre.client.from("hydratation").select("id")).data).toEqual([]);
    expect(await totalDuJour(autre)).toBe(0);
  });

  it("refuse une quantité nulle ou absurde", async () => {
    await expect(boire(moi, 0)).rejects.toBeTruthy();
    await expect(boire(moi, 5000)).rejects.toBeTruthy();
  });

  it("a un objectif d'eau dans les Objectifs journaliers", async () => {
    expect((await moi.client.from("objectifs_journaliers").upsert({ eau_ml: 2000 })).error).toBeNull();
    const { data } = await moi.client.from("objectifs_journaliers").select("eau_ml").single();
    expect(data?.eau_ml).toBe(2000);
    expect((await moi.client.from("objectifs_journaliers").upsert({ eau_ml: -1 })).error).not.toBeNull();
  });
});
