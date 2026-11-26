import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";
import { creerRepasAnalyse } from "./outils.ts";

async function ajouterRegle(utilisateur: UtilisateurDeTest, categorie: string, texte: string) {
  const { data, error } = await utilisateur.client
    .from("regles_medecin")
    .insert({ categorie, texte, date_consultation: "2026-11-20" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

describe("Règles du médecin", () => {
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

  it("s'ajoutent et se modifient, et restent invisibles pour les autres", async () => {
    const id = await ajouterRegle(moi, "a_privilegier", "Poisson braisé");
    await moi.client.from("regles_medecin").update({ texte: "Poisson braisé ou grillé" }).eq("id", id);

    const { data } = await moi.client.from("regles_medecin").select("texte").eq("id", id).single();
    expect(data?.texte).toBe("Poisson braisé ou grillé");

    const { data: vues } = await autre.client.from("regles_medecin").select("id");
    expect(vues).toEqual([]);
  });

  it("ne se suppriment jamais définitivement", async () => {
    const id = await ajouterRegle(moi, "conseil", "Marcher 30 minutes par jour");
    await moi.client.from("regles_medecin").delete().eq("id", id);

    const { data } = await moi.client.from("regles_medecin").select("id").eq("id", id);
    expect(data).toHaveLength(1);
  });

  it("refusent une catégorie inconnue ou un texte vide", async () => {
    await expect(ajouterRegle(moi, "interdit", "Fritures")).rejects.toBeTruthy();
    await expect(ajouterRegle(moi, "a_eviter", "  ")).rejects.toBeTruthy();
  });
});

describe("Règles du médecin dans l'analyse d'un Repas", () => {
  let moi: UtilisateurDeTest;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
    await ajouterRegle(moi, "a_eviter", "Huile de palme");
    const archivee = await ajouterRegle(moi, "a_eviter", "Ancienne consigne sur les œufs");
    await moi.client.from("regles_medecin").update({ archivee_le: new Date().toISOString() }).eq("id", archivee);
  });
  afterAll(async () => moi?.supprimer());

  it("transmet à l'IA les Règles actives, et pas les Règles archivées", async () => {
    const repasId = await creerRepasAnalyse(moi, "Mafé");

    const { data } = await moi.client.from("repas").select("commentaire").eq("id", repasId).single();
    expect(data?.commentaire).toContain("À éviter : Huile de palme");
    expect(data?.commentaire).not.toContain("Ancienne consigne sur les œufs");
  });
});
