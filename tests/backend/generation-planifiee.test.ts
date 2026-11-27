// Génération planifiée : generer-rendez-vous en mode automatique (clé de service), comme l'appelle pg_cron.
// On simule l'heure avec `maintenant` et on se limite aux comptes de test avec `utilisateurs`.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUtilisateurConnecte, statutLocal, type UtilisateurDeTest } from "./supabase-local.ts";

async function appelAutomatique(corps: Record<string, unknown>, cle = statutLocal().SERVICE_ROLE_KEY) {
  return fetch(`${statutLocal().API_URL}/functions/v1/generer-rendez-vous`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({ automatique: true, ...corps }),
  });
}

describe("génération planifiée du samedi", () => {
  let moi: UtilisateurDeTest;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
    const { error } = await moi.client.from("profils").insert({ fuseau: "Europe/Paris" });
    if (error) throw error;
  });
  afterAll(async () => {
    await moi?.supprimer();
  });

  const samedi = async () =>
    (await moi.client.from("rendez_vous").select("id, automatique").eq("samedi", "2026-11-28")).data ?? [];

  it("n'agit pas avant 6 h, heure du Profil", async () => {
    const reponse = await appelAutomatique({ maintenant: "2026-11-28T04:59:00Z", utilisateurs: [moi.id] });
    expect(await reponse.json()).toEqual({ generes: 0, ignores: 1, echecs: 0 });
    expect(await samedi()).toEqual([]);
  });

  it("génère à partir de 6 h, une seule fois, sans écraser les cases cochées", async () => {
    const premier = await appelAutomatique({ maintenant: "2026-11-28T05:00:00Z", utilisateurs: [moi.id] });
    expect(await premier.json()).toEqual({ generes: 1, ignores: 0, echecs: 0 });
    const [rendezVous] = await samedi();
    expect(rendezVous?.automatique).toBe(true);

    const { data: ingredient } = await moi.client.from("ingredients_de_recette").select("id").limit(1).single();
    await moi.client.from("ingredients_de_recette").update({ coche: true }).eq("id", ingredient!.id);

    const second = await appelAutomatique({ maintenant: "2026-11-28T06:00:00Z", utilisateurs: [moi.id] });
    expect(await second.json()).toEqual({ generes: 0, ignores: 1, echecs: 0 });
    expect(await samedi()).toEqual([rendezVous]);
    const { data: toujours } = await moi.client.from("ingredients_de_recette").select("coche").eq("id", ingredient!.id).single();
    expect(toujours?.coche).toBe(true);
  });

  it("est réservé à la clé de service", async () => {
    const jeton = (await moi.client.auth.getSession()).data.session?.access_token;
    const reponse = await appelAutomatique({ utilisateurs: [moi.id] }, jeton);
    expect(reponse.status).toBe(403);
  });
});
