// File d'envoi (ticket 17) : chaque action mise en file porte un identifiant choisi par le téléphone. Rejouer la même
// action (réponse perdue, nouvelle tentative) ne doit rien créer de plus : insertion « ignorer si déjà là ».
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";

describe("envois rejoués", () => {
  let moi: UtilisateurDeTest;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
  });

  afterAll(async () => {
    await moi?.supprimer();
  });

  it("n'ajoute l'eau qu'une fois", async () => {
    const ajout = { id: crypto.randomUUID(), quantite_ml: 250, bu_le: "2026-11-30T09:00:00Z", journee: "2026-11-30" };
    for (let i = 0; i < 2; i++) {
      const { error } = await moi.client.from("hydratation").upsert(ajout, { onConflict: "id", ignoreDuplicates: true });
      expect(error).toBeNull();
    }
    const { data } = await moi.client.from("hydratation").select("id").eq("journee", "2026-11-30");
    expect(data).toHaveLength(1);
  });

  it("ne crée le Repas en attente qu'une fois", async () => {
    const repas = {
      id: crypto.randomUUID(),
      description: "riz sauce arachide",
      mange_le: "2026-11-30T12:30:00Z",
      journee: "2026-11-30",
      type_repas: "dejeuner",
    };
    for (let i = 0; i < 2; i++) {
      const { error } = await moi.client.from("repas").upsert(repas, { onConflict: "id", ignoreDuplicates: true });
      expect(error).toBeNull();
    }
    const { data } = await moi.client.from("repas").select("id, statut").eq("journee", "2026-11-30");
    expect(data).toEqual([{ id: repas.id, statut: "en_attente" }]);
  });

  it("ne laisse pas un autre compte réutiliser l'identifiant d'un Repas", async () => {
    const autre = await creerUtilisateurConnecte();
    try {
      const id = crypto.randomUUID();
      const premier = await moi.client
        .from("repas")
        .insert({ id, description: "à moi", mange_le: "2026-11-30T19:00:00Z", journee: "2026-11-30", type_repas: "diner" });
      expect(premier.error).toBeNull();
      const second = await autre.client
        .from("repas")
        .upsert(
          { id, description: "à l'autre", mange_le: "2026-11-30T19:00:00Z", journee: "2026-11-30", type_repas: "diner" },
          { onConflict: "id", ignoreDuplicates: true },
        );
      // Ignoré ou refusé : dans tous les cas, le Repas reste le mien et inchangé.
      expect(second.error === null || second.error.code !== undefined).toBe(true);
      const { data } = await moi.client.from("repas").select("description").eq("id", id).single();
      expect(data?.description).toBe("à moi");
    } finally {
      await autre.supprimer();
    }
  });
});
