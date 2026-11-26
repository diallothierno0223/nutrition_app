// Saisie d'un Repas par photo : la photo va dans un bucket privé, analyser-repas la lit côté serveur.
// L'IA factice signale dans le Commentaire la taille de la photo qu'elle a reçue.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clientAnonyme, creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";
import { analyser } from "./outils.ts";

const BUCKET = "photos-repas";
// Un JPEG minuscule suffit : le serveur ne fait que le transmettre à l'IA.
const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);

async function deposerPhoto(utilisateur: UtilisateurDeTest, nom = `${crypto.randomUUID()}.jpg`) {
  const chemin = `${utilisateur.id}/${nom}`;
  const { error } = await utilisateur.client.storage.from(BUCKET).upload(chemin, PHOTO, { contentType: "image/jpeg" });
  if (error) throw error;
  return chemin;
}

async function creerRepasPhoto(utilisateur: UtilisateurDeTest, photoChemin: string, description = "") {
  const { data, error } = await utilisateur.client
    .from("repas")
    .insert({
      description,
      photo_chemin: photoChemin,
      mange_le: "2026-11-26T12:30:00Z",
      journee: "2026-11-26",
      type_repas: "dejeuner",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

describe("saisie par photo", () => {
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

  it("analyse la photo et la note ensemble", async () => {
    const chemin = await deposerPhoto(moi);
    const repasId = await creerRepasPhoto(moi, chemin, "cuit à l'huile de palme");

    const reponse = await analyser(moi, repasId);
    expect(reponse.status).toBe(200);

    const { data: repas } = await moi.client.from("repas").select("statut, commentaire, photo_chemin").eq("id", repasId).single();
    expect(repas?.statut).toBe("analyse");
    expect(repas?.commentaire).toContain(`Photo reçue (${PHOTO.length} octets)`);
    expect(repas?.commentaire).toContain("cuit à l'huile de palme");
    expect(repas?.photo_chemin).toBe(chemin);
  });

  it("relit la photo conservée quand on relance l'analyse", async () => {
    const repasId = await creerRepasPhoto(moi, await deposerPhoto(moi));
    await analyser(moi, repasId);

    expect((await analyser(moi, repasId)).status).toBe(200);
    const { data: repas } = await moi.client.from("repas").select("commentaire").eq("id", repasId).single();
    expect(repas?.commentaire).toContain(`Photo reçue (${PHOTO.length} octets)`);
  });

  it("accepte une photo sans note", async () => {
    const repasId = await creerRepasPhoto(moi, await deposerPhoto(moi));

    expect((await analyser(moi, repasId)).status).toBe(200);
  });

  it("refuse un Repas sans description ni photo", async () => {
    const { error } = await moi.client
      .from("repas")
      .insert({ description: "  ", mange_le: "2026-11-26T12:30:00Z", journee: "2026-11-26", type_repas: "dejeuner" });

    expect(error).not.toBeNull();
  });

  it("garde la photo lisible par son propriétaire", async () => {
    const chemin = await deposerPhoto(moi);

    const { data, error } = await moi.client.storage.from(BUCKET).download(chemin);
    expect(error).toBeNull();
    expect(data?.size).toBe(PHOTO.length);
  });

  it("ne laisse pas lire les photos sans session", async () => {
    const chemin = await deposerPhoto(moi);

    const { data, error } = await clientAnonyme().storage.from(BUCKET).download(chemin);
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it("ne laisse pas lire les photos d'un autre utilisateur", async () => {
    const chemin = await deposerPhoto(moi);

    const { data } = await autre.client.storage.from(BUCKET).download(chemin);
    expect(data).toBeNull();
  });

  it("refuse de déposer une photo dans le dossier d'un autre utilisateur", async () => {
    const { error } = await autre.client.storage
      .from(BUCKET)
      .upload(`${moi.id}/${crypto.randomUUID()}.jpg`, PHOTO, { contentType: "image/jpeg" });

    expect(error).not.toBeNull();
  });
});
