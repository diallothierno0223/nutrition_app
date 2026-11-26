// Avec l'IA factice (IA_MODE=factice dans supabase/functions/.env) :
// chaque analyse renvoie un riz blanc et une sauce arachide, et un Commentaire qui reprend la description.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";
import { analyser, creerRepas } from "./outils.ts";

async function constituantsDe(client: SupabaseClient, repasId: string) {
  const { data, error } = await client
    .from("constituants")
    .select("nom, quantite, unite, equivalent_cuisine, calories, ags")
    .eq("repas_id", repasId)
    .order("position");
  if (error) throw error;
  return data;
}

describe("analyser-repas", () => {
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

  it("enregistre directement les Constituants et le Commentaire du repas", async () => {
    const repasId = await creerRepas(moi.client, "Mafé au poulet avec du riz");

    const reponse = await analyser(moi, repasId);
    expect(reponse.status).toBe(200);

    const { data: repas } = await moi.client.from("repas").select("statut, commentaire").eq("id", repasId).single();
    expect(repas?.statut).toBe("analyse");
    expect(repas?.commentaire).toContain("Mafé au poulet avec du riz");

    expect(await constituantsDe(moi.client, repasId)).toEqual([
      { nom: "Riz blanc cuit", quantite: 150, unite: "g", equivalent_cuisine: "1 bol", calories: 195, ags: 0.1 },
      { nom: "Sauce arachide", quantite: 200, unite: "ml", equivalent_cuisine: "1 louche", calories: 320, ags: 6.5 },
    ]);
  });

  it("remplace les Constituants quand on relance l'analyse", async () => {
    const repasId = await creerRepas(moi.client, "Attiéké poisson braisé");
    await analyser(moi, repasId);
    await analyser(moi, repasId);

    expect(await constituantsDe(moi.client, repasId)).toHaveLength(2);
  });

  it("n'analyse pas le Repas d'un autre utilisateur", async () => {
    const repasId = await creerRepas(moi.client, "Fonio aux légumes");

    const reponse = await analyser(autre, repasId);
    expect(reponse.status).toBe(404);

    const { data: repas } = await moi.client.from("repas").select("statut").eq("id", repasId).single();
    expect(repas?.statut).toBe("en_attente");
  });

  it("cache mes Repas et leurs Constituants aux autres utilisateurs", async () => {
    const repasId = await creerRepas(moi.client, "Thiéboudienne");
    await analyser(moi, repasId);

    const { data: repasVus } = await autre.client.from("repas").select("id").eq("id", repasId);
    expect(repasVus).toEqual([]);
    expect(await constituantsDe(autre.client, repasId)).toEqual([]);
  });

  it("refuse un Repas sans description", async () => {
    await expect(creerRepas(moi.client, "   ")).rejects.toBeTruthy();
  });
});
