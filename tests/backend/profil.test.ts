// Profil, Pesées et Estimation des Objectifs (IA factice).
// L'IA factice propose, pour les calories, la référence de la formule + 100 kcal, et reprend dans sa justification
// les Objectifs personnels et le nombre de Règles du médecin actives reçues.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { besoinEnergetique, journeeDe } from "../../noyau/index.ts";
import { creerUtilisateurConnecte, statutLocal, type UtilisateurDeTest } from "./supabase-local.ts";

const PROFIL = {
  taille_cm: 175,
  date_naissance: "1996-01-01",
  sexe: "homme" as const,
  niveau_activite: "modere" as const,
  fuseau: "Europe/Paris",
  objectifs_personnels: "Prendre 2 kg en 6 mois et réduire le sucre",
};

async function estimer(utilisateur: UtilisateurDeTest) {
  const { data } = await utilisateur.client.auth.getSession();
  return fetch(`${statutLocal().API_URL}/functions/v1/estimer-objectifs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${data.session?.access_token}`, "Content-Type": "application/json" },
    body: "{}",
  });
}

describe("Profil et Pesées", () => {
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

  it("garde mon Profil pour moi seul", async () => {
    expect((await moi.client.from("profils").upsert(PROFIL)).error).toBeNull();
    const { data } = await moi.client.from("profils").select("taille_cm, objectifs_personnels").single();
    expect(data).toEqual({ taille_cm: 175, objectifs_personnels: PROFIL.objectifs_personnels });
    expect((await autre.client.from("profils").select("*")).data).toEqual([]);
  });

  it("note la date de modification du Profil", async () => {
    const avant = (await moi.client.from("profils").select("modifie_le").single()).data?.modifie_le;
    await moi.client.from("profils").update({ objectifs_personnels: "Plus de fibres" }).eq("user_id", moi.id);
    const apres = (await moi.client.from("profils").select("modifie_le").single()).data?.modifie_le;
    expect(Date.parse(apres)).toBeGreaterThan(Date.parse(avant));
  });

  it("ne change pas la date de modification quand on réenregistre le Profil à l'identique", async () => {
    const avant = (await moi.client.from("profils").select("*").single()).data;
    const { user_id: _id, modifie_le: _date, ...memeProfil } = avant;
    await moi.client.from("profils").upsert(memeProfil);
    const apres = (await moi.client.from("profils").select("modifie_le").single()).data?.modifie_le;
    expect(apres).toBe(avant.modifie_le);
  });

  it("enregistre une Pesée par date, remplacée si on pèse à nouveau le même jour", async () => {
    await moi.client.from("pesees").upsert({ pese_le: "2026-11-26", poids_kg: 70.4 }, { onConflict: "user_id,pese_le" });
    await moi.client.from("pesees").upsert({ pese_le: "2026-11-26", poids_kg: 70.1 }, { onConflict: "user_id,pese_le" });
    const { data } = await moi.client.from("pesees").select("pese_le, poids_kg");
    expect(data).toEqual([{ pese_le: "2026-11-26", poids_kg: 70.1 }]);
    expect((await autre.client.from("pesees").select("*")).data).toEqual([]);
  });

  it("refuse un poids absurde", async () => {
    const { error } = await moi.client.from("pesees").insert({ pese_le: "2026-11-27", poids_kg: 5 });
    expect(error).not.toBeNull();
  });

  it("note la date de modification d'une Règle du médecin archivée", async () => {
    const { data: regle } = await moi.client
      .from("regles_medecin")
      .insert({ categorie: "a_eviter", texte: "Fritures", date_consultation: "2026-11-20" })
      .select("id, modifie_le")
      .single();
    await moi.client.from("regles_medecin").update({ archivee_le: new Date().toISOString() }).eq("id", regle?.id);
    const { data } = await moi.client.from("regles_medecin").select("modifie_le").eq("id", regle?.id).single();
    expect(Date.parse(data?.modifie_le)).toBeGreaterThan(Date.parse(regle?.modifie_le));
  });
});

describe("estimer-objectifs", () => {
  let moi: UtilisateurDeTest;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
  });
  afterAll(async () => moi?.supprimer());

  it("demande un Profil complet et une Pesée avant d'estimer", async () => {
    expect((await estimer(moi)).status).toBe(422);
    await moi.client.from("profils").upsert(PROFIL);
    expect((await estimer(moi)).status).toBe(422); // toujours pas de Pesée
  });

  it("propose les 8 Objectifs justifiés, avec la formule en garde-fou, sans rien enregistrer", async () => {
    await moi.client.from("pesees").upsert({ pese_le: "2026-11-26", poids_kg: 70 }, { onConflict: "user_id,pese_le" });
    await moi.client
      .from("regles_medecin")
      .insert({ categorie: "a_eviter", texte: "Huile de palme", date_consultation: "2026-11-20" });

    const reponse = await estimer(moi);
    expect(reponse.status).toBe(200);
    const { estimation, garde_fou } = await reponse.json();

    // Homme, 175 cm, 70 kg, né en 1996, modérément actif : environ 2556 kcal par la formule (selon l'âge du jour).
    const reference = besoinEnergetique(PROFIL, 70, journeeDe(new Date(), PROFIL.fuseau));
    expect(garde_fou.calories).toBe(reference);
    expect(garde_fou.alerte).toBe(false);
    expect(estimation.calories.valeur).toBe(reference + 100);
    expect(Object.keys(estimation)).toHaveLength(8);
    expect(estimation.calories.justification).toContain("Prendre 2 kg en 6 mois et réduire le sucre");
    expect(estimation.calories.justification).toContain("Règles du médecin : 1");

    const { data: objectifs } = await moi.client.from("objectifs_journaliers").select("*");
    expect(objectifs).toEqual([]);
  });
});
