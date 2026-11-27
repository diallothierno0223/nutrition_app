// Export des données (ticket 20) : l'app lit chaque table en entier (select *) avec la session de l'utilisateur.
// La RLS doit tout laisser lire de son compte, rien de celui d'un autre, et les liens de photos ne se signent que
// pour ses propres photos.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TABLES_EXPORTEES } from "../../noyau/index.ts";
import { creerUtilisateurConnecte, type UtilisateurDeTest } from "./supabase-local.ts";

const BUCKET = "photos-repas";
const PHOTO = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

async function remplir(utilisateur: UtilisateurDeTest) {
  const chemin = `${utilisateur.id}/${crypto.randomUUID()}.jpg`;
  const depot = await utilisateur.client.storage.from(BUCKET).upload(chemin, PHOTO, { contentType: "image/jpeg" });
  if (depot.error) throw depot.error;
  const pesee = await utilisateur.client.from("pesees").insert({ pese_le: "2026-11-27", poids_kg: 72.5 });
  if (pesee.error) throw pesee.error;
  const repas = await utilisateur.client.from("repas").insert({
    description: "",
    photo_chemin: chemin,
    mange_le: "2026-11-27T12:30:00Z",
    journee: "2026-11-27",
    type_repas: "dejeuner",
  });
  if (repas.error) throw repas.error;
  return chemin;
}

describe("export des données", () => {
  let moi: UtilisateurDeTest;
  let autre: UtilisateurDeTest;
  let maPhoto: string;
  let photoDeLAutre: string;

  beforeAll(async () => {
    moi = await creerUtilisateurConnecte();
    autre = await creerUtilisateurConnecte();
    maPhoto = await remplir(moi);
    photoDeLAutre = await remplir(autre);
  });

  afterAll(async () => {
    // Supprimer un compte ne retire pas ses fichiers du Storage.
    if (moi && maPhoto) await moi.client.storage.from(BUCKET).remove([maPhoto]);
    if (autre && photoDeLAutre) await autre.client.storage.from(BUCKET).remove([photoDeLAutre]);
    await moi?.supprimer();
    await autre?.supprimer();
  });

  it("exporte toutes les tables créées par les migrations", () => {
    const dossier = join(import.meta.dirname, "..", "..", "supabase", "migrations");
    const creees = readdirSync(dossier)
      .flatMap((f) => [...readFileSync(join(dossier, f), "utf8").matchAll(/create table public\.(\w+)/gi)])
      .map((m) => m[1]);
    expect([...TABLES_EXPORTEES].sort()).toEqual([...new Set(creees)].sort());
  });

  it.each(TABLES_EXPORTEES)("lit la table %s en entier", async (table) => {
    const { error } = await moi.client.from(table).select("*").range(0, 999);
    expect(error).toBeNull();
  });

  it("ne renvoie que les lignes du compte", async () => {
    const { data: pesees } = await moi.client.from("pesees").select("*");
    expect(pesees?.map((p) => p.user_id)).toEqual([moi.id]);
    const { data: repas } = await moi.client.from("repas").select("*");
    expect(repas?.map((r) => r.photo_chemin)).toEqual([maPhoto]);
  });

  it("signe les liens de ses photos, pas ceux d'un autre compte", async () => {
    const { data, error } = await moi.client.storage
      .from(BUCKET)
      .createSignedUrls([maPhoto, photoDeLAutre], 7 * 24 * 3600);
    expect(error).toBeNull();
    const parChemin = new Map(data?.map((d) => [d.path, d]));
    expect(parChemin.get(maPhoto)?.signedUrl).toMatch(/^http/);
    expect(parChemin.get(photoDeLAutre)?.signedUrl ?? null).toBeNull();
  });
});
