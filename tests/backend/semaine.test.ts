// Totaux de la Semaine (lundi–dimanche). IA factice : 515 kcal par Repas analysé.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";
import { creerRepas, creerRepasAnalyse } from "./outils.ts";

describe("totaux de la Semaine", () => {
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

  it("regroupe une Semaine à cheval sur deux mois, du lundi au dimanche", async () => {
    await creerRepasAnalyse(moi, "Mafé", "2026-09-28"); // lundi
    await creerRepasAnalyse(moi, "Fonio", "2026-10-04"); // dimanche, même Semaine
    await creerRepasAnalyse(moi, "Attiéké", "2026-10-05"); // lundi suivant
    await creerRepas(moi.client, "En attente", "2026-10-01"); // non analysé : ne compte pas

    const { data } = await moi.client
      .from("totaux_de_la_semaine")
      .select("lundi, journees_renseignees, calories")
      .order("lundi");
    expect(data).toEqual([
      { lundi: "2026-09-28", journees_renseignees: 2, calories: 1030 },
      { lundi: "2026-10-05", journees_renseignees: 1, calories: 515 },
    ]);
  });

  it("ne montre pas les Semaines d'un autre utilisateur", async () => {
    const { data } = await autre.client.from("totaux_de_la_semaine").select("lundi");
    expect(data).toEqual([]);
  });
});
