// État de la Liste de courses : Recettes incluses, cases cochées, ajouts manuels (la liste est calculée par le noyau).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUtilisateurConnecte, statutLocal, type UtilisateurDeTest } from "./supabase-local.ts";

async function generer(utilisateur: UtilisateurDeTest, force = false) {
  const jeton = (await utilisateur.client.auth.getSession()).data.session?.access_token;
  const reponse = await fetch(`${statutLocal().API_URL}/functions/v1/generer-rendez-vous`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fuseau: "Europe/Paris", force }),
  });
  if (reponse.status !== 200) throw new Error(`génération impossible : ${reponse.status}`);
  return (await reponse.json()).rendez_vous_id as string;
}

describe("Liste de courses", () => {
  let moi: UtilisateurDeTest;
  let autre: UtilisateurDeTest;
  let rendezVousId: string;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
    autre = await creerUtilisateurConnecte();
    rendezVousId = await generer(moi);
  });
  afterAll(async () => {
    await moi?.supprimer();
    await autre?.supprimer();
  });

  it("inclut toutes les Recettes par défaut, et permet d'en retirer une", async () => {
    const { data: recettes } = await moi.client.from("recettes").select("id, dans_la_liste").eq("rendez_vous_id", rendezVousId);
    expect(recettes?.every((r) => r.dans_la_liste)).toBe(true);

    const { error } = await moi.client.from("recettes").update({ dans_la_liste: false }).eq("id", recettes![0]!.id);
    expect(error).toBeNull();
  });

  it("coche un ingrédient, sans pouvoir modifier le reste", async () => {
    const { data: ingredient } = await moi.client.from("ingredients_de_recette").select("id").limit(1).single();

    expect((await moi.client.from("ingredients_de_recette").update({ coche: true }).eq("id", ingredient!.id)).error).toBeNull();
    const { data } = await moi.client.from("ingredients_de_recette").select("coche").eq("id", ingredient!.id).single();
    expect(data?.coche).toBe(true);

    const { error } = await moi.client.from("ingredients_de_recette").update({ quantite: 1 }).eq("id", ingredient!.id);
    expect(error).not.toBeNull();
  });

  it("garde les ajouts manuels lors d'une nouvelle génération forcée", async () => {
    const { error } = await moi.client.from("articles_manuels").insert({ rendez_vous_id: rendezVousId, nom: "Piment" });
    expect(error).toBeNull();

    expect(await generer(moi, true)).toBe(rendezVousId);
    const { data } = await moi.client.from("articles_manuels").select("nom, coche").eq("rendez_vous_id", rendezVousId);
    expect(data).toEqual([{ nom: "Piment", coche: false }]);
  });

  it("garde la Liste de courses privée", async () => {
    const { error } = await autre.client.from("articles_manuels").insert({ rendez_vous_id: rendezVousId, nom: "Intrus" });
    expect(error).not.toBeNull();
    const { data } = await autre.client.from("ingredients_de_recette").update({ coche: false }).neq("id", "").select("id");
    expect(data ?? []).toEqual([]);
  });
});
