// Plats réutilisables : un Plat est un modèle ; le réutiliser copie ses Constituants dans un nouveau Repas.
// L'app multiplie les Constituants par le Coefficient de portion (noyau métier) avant de les envoyer.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";
import { analyser } from "./outils.ts";

const MAFE = [
  { nom: "Mafé de poulet", quantite: 300, unite: "g", equivalent_cuisine: "1 assiette",
    calories: 450, proteines: 30, glucides: 15, sucres: 4, lipides: 30, ags: 8, fibres: 4, sel: 2 },
  { nom: "Riz blanc cuit", quantite: 150, unite: "g", equivalent_cuisine: "1 bol",
    calories: 195, proteines: 4, glucides: 42, sucres: 0.1, lipides: 0.5, ags: 0.1, fibres: 0.6, sel: 0 },
];

async function creerPlat(client: SupabaseClient, nom = "Mafé du dimanche") {
  const { data, error } = await client.rpc("creer_plat", { p_nom: nom, p_constituants: MAFE });
  if (error) throw error;
  return data as string;
}

async function reutiliser(client: SupabaseClient, journee: string, constituants = MAFE, id: string = crypto.randomUUID()) {
  const { data, error } = await client.rpc("enregistrer_repas_depuis_plat", {
    p_id: id,
    p_description: "Mafé du dimanche",
    p_mange_le: `${journee}T12:30:00Z`,
    p_journee: journee,
    p_type_repas: "dejeuner",
    p_constituants: constituants,
  });
  if (error) throw error;
  return data as string;
}

async function caloriesDuJour(client: SupabaseClient, journee: string) {
  const { data } = await client.from("totaux_du_jour").select("calories").eq("journee", journee).maybeSingle();
  return data?.calories ?? 0;
}

describe("Plats réutilisables", () => {
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

  it("enregistre un Plat avec ses Constituants, dans l'ordre", async () => {
    const platId = await creerPlat(moi.client);

    const { data } = await moi.client
      .from("plats")
      .select("nom, constituants_de_plat (nom, calories)")
      .eq("id", platId)
      .order("position", { referencedTable: "constituants_de_plat" })
      .single();
    expect(data).toEqual({
      nom: "Mafé du dimanche",
      constituants_de_plat: [{ nom: "Mafé de poulet", calories: 450 }, { nom: "Riz blanc cuit", calories: 195 }],
    });
  });

  it("crée un Repas déjà analysé, sans Commentaire (pas d'appel à l'IA), compté dans les jauges", async () => {
    const repasId = await reutiliser(moi.client, "2026-10-01");

    const { data: repas } = await moi.client.from("repas").select("statut, commentaire").eq("id", repasId).single();
    expect(repas).toEqual({ statut: "analyse", commentaire: null });
    expect(await caloriesDuJour(moi.client, "2026-10-01")).toBe(645);
  });

  it("ne crée pas de doublon quand le même envoi est rejoué (file d'envoi hors ligne)", async () => {
    const id = crypto.randomUUID();
    expect(await reutiliser(moi.client, "2026-10-09", MAFE, id)).toBe(id);
    expect(await reutiliser(moi.client, "2026-10-09", MAFE, id)).toBe(id);

    const { data: constituants } = await moi.client.from("constituants").select("id").eq("repas_id", id);
    expect(constituants).toHaveLength(MAFE.length);
    expect(await caloriesDuJour(moi.client, "2026-10-09")).toBe(645);
  });

  it("ne change jamais un Repas passé quand on modifie ou supprime le Plat", async () => {
    const platId = await creerPlat(moi.client);
    const repasId = await reutiliser(moi.client, "2026-10-02");

    await moi.client.from("constituants_de_plat").update({ calories: 999 }).eq("plat_id", platId);
    await moi.client.from("plats").update({ nom: "Autre nom" }).eq("id", platId);
    expect(await caloriesDuJour(moi.client, "2026-10-02")).toBe(645);

    const { error } = await moi.client.from("plats").delete().eq("id", platId);
    expect(error).toBeNull();
    const { data: repas } = await moi.client.from("repas").select("description").eq("id", repasId).single();
    expect(repas?.description).toBe("Mafé du dimanche");
    expect(await caloriesDuJour(moi.client, "2026-10-02")).toBe(645);
  });

  it("relance l'analyse d'un Repas issu d'un Plat sur la base de ses Constituants", async () => {
    const repasId = await reutiliser(moi.client, "2026-10-03");
    await moi.client.from("repas").update({ precision: "j'ai ajouté une cuillère d'huile" }).eq("id", repasId);

    expect((await analyser(moi, repasId)).status).toBe(200);
    const { data: repas } = await moi.client.from("repas").select("commentaire").eq("id", repasId).single();
    expect(repas?.commentaire).toContain("Base : Mafé de poulet, Riz blanc cuit");
  });

  it("garde les Plats de chacun privés", async () => {
    const platId = await creerPlat(moi.client);

    const { data } = await autre.client.from("plats").select("id").eq("id", platId);
    expect(data).toEqual([]);
    const { data: constituants } = await autre.client.from("constituants_de_plat").select("id").eq("plat_id", platId);
    expect(constituants).toEqual([]);
  });

  it("ne laisse modifier que le nom d'un Plat (pas son rattachement à un Rendez-vous)", async () => {
    const platId = await creerPlat(moi.client);

    expect((await moi.client.from("plats").update({ nom: "Renommé" }).eq("id", platId)).error).toBeNull();
    const { error } = await moi.client
      .from("plats")
      .update({ rendez_vous_id: "00000000-0000-0000-0000-000000000000" })
      .eq("id", platId);
    expect(error).not.toBeNull();
  });

  it("refuse un Plat sans Constituant", async () => {
    const { error } = await moi.client.rpc("creer_plat", { p_nom: "Vide", p_constituants: [] });
    expect(error).not.toBeNull();
  });
});
