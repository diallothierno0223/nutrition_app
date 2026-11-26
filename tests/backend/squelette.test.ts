import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clientAnonyme, creerUtilisateurConnecte, statutLocal, type UtilisateurDeTest } from "./supabase-local.ts";

describe("squelette du backend", () => {
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

  it("refuse les inscriptions publiques", async () => {
    const { error } = await clientAnonyme().auth.signUp({
      email: `intrus-${crypto.randomUUID()}@exemple.test`,
      password: "un-mot-de-passe-solide",
    });
    expect(error).not.toBeNull();
  });

  it("ne montre aucune donnée sans session", async () => {
    const { data } = await clientAnonyme().from("reglages").select("*");
    expect(data ?? []).toEqual([]);
  });

  it("donne à l'utilisateur connecté ses propres Réglages, et seulement les siens", async () => {
    const { data, error } = await moi.client.from("reglages").select("user_id");
    expect(error).toBeNull();
    expect(data).toEqual([{ user_id: moi.id }]);
  });

  it("expose le noyau métier depuis une Edge Function", async () => {
    const { data: session } = await moi.client.auth.getSession();
    const reponse = await fetch(`${statutLocal().API_URL}/functions/v1/sante`, {
      headers: { Authorization: `Bearer ${session.session?.access_token}` },
    });
    expect(reponse.status).toBe(200);
    expect(await reponse.json()).toMatchObject({ statut: "ok", sens: { ags: "plafond", fibres: "cible" } });
  });

  it("refuse l'Edge Function sans session", async () => {
    const reponse = await fetch(`${statutLocal().API_URL}/functions/v1/sante`);
    expect(reponse.status).toBe(401);
  });
});
