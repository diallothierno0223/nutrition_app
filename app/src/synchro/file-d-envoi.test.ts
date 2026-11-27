import { describe, expect, it } from "vitest";
import { baseEnMemoire } from "./base-locale-node.ts";
import { ouvrirCacheLocal } from "./cache-local.ts";
import type { Envoi } from "./envois.ts";
import { rejouer } from "./rejeu.ts";
import { estErreurReseau } from "./reseau.ts";

const eau = (id: string, quantiteMl = 250): Envoi => ({
  type: "ajouter_eau",
  id,
  quantiteMl,
  buLe: "2026-11-30T09:00:00Z",
  journee: "2026-11-30",
});
const coche = (ingredientId: string, valeur: boolean): Envoi => ({ type: "cocher_ingredient", ingredientId, coche: valeur });
const enAttente = (id: string): Envoi => ({
  type: "repas_en_attente",
  id,
  description: "riz sauce arachide",
  photoLocale: null,
  mangeLe: "2026-11-30T12:30:00Z",
  journee: "2026-11-30",
  typeRepas: "dejeuner",
});

const PAS_DE_RESEAU = Object.assign(new TypeError("Network request failed"), {});
const REFUS = { message: "new row violates row-level security policy", code: "42501" };

describe("lectures en cache", () => {
  it("garde la dernière valeur lue et son heure", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    expect(await cache.lireLecture("objectifs")).toBeNull();
    await cache.ecrireLecture("objectifs", { calories: 2000 }, new Date("2026-11-30T08:00:00Z"));
    await cache.ecrireLecture("objectifs", { calories: 2100 }, new Date("2026-11-30T09:00:00Z"));
    expect(await cache.lireLecture("objectifs")).toEqual({
      valeur: { calories: 2100 },
      majLe: new Date("2026-11-30T09:00:00Z"),
    });
  });
});

describe("file d'envoi", () => {
  it("garde les envois dans l'ordre où ils ont été faits", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(eau("a"));
    await cache.mettreEnFile(coche("i1", true));
    await cache.mettreEnFile(eau("b", 500));
    expect((await cache.envoisEnAttente()).map((e) => e.envoi)).toEqual([eau("a"), coche("i1", true), eau("b", 500)]);
  });

  it("ne garde que le dernier état d'une même case cochée", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(coche("i1", true));
    await cache.mettreEnFile(eau("a"));
    await cache.mettreEnFile(coche("i1", false));
    expect((await cache.envoisEnAttente()).map((e) => e.envoi)).toEqual([eau("a"), coche("i1", false)]);
  });

  it("survit à la réouverture de la base", async () => {
    const base = baseEnMemoire();
    await (await ouvrirCacheLocal(base)).mettreEnFile(eau("a"));
    expect(await (await ouvrirCacheLocal(base)).envoisEnAttente()).toHaveLength(1);
  });
});

describe("rejeu", () => {
  it("envoie tout dans l'ordre et vide la file", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(eau("a"));
    await cache.mettreEnFile(coche("i1", true));
    const envoyes: Envoi[] = [];

    const bilan = await rejouer(cache, async (e) => void envoyes.push(e), estErreurReseau);

    expect(envoyes).toEqual([eau("a"), coche("i1", true)]);
    expect(bilan).toEqual({ envoyes: 2, restants: 0, horsLigne: false });
    expect(await cache.envoisEnAttente()).toEqual([]);
  });

  it("s'arrête au premier échec réseau et garde la suite pour plus tard, dans l'ordre", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(eau("a"));
    await cache.mettreEnFile(eau("b"));
    await cache.mettreEnFile(eau("c"));
    const tentes: string[] = [];

    const bilan = await rejouer(
      cache,
      async (e) => {
        if (e.type !== "ajouter_eau") return;
        tentes.push(e.id);
        if (e.id === "b") throw PAS_DE_RESEAU;
      },
      estErreurReseau,
    );

    expect(tentes).toEqual(["a", "b"]);
    expect(bilan).toEqual({ envoyes: 1, restants: 2, horsLigne: true });
    expect((await cache.envoisEnAttente()).map((e) => e.envoi)).toEqual([eau("b"), eau("c")]);
  });

  it("passe un envoi refusé par le serveur sans bloquer les suivants, puis l'abandonne après plusieurs refus", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(coche("supprime", true));
    await cache.mettreEnFile(eau("a"));
    const executer = async (e: Envoi) => {
      if (e.type === "cocher_ingredient") throw REFUS;
    };

    expect(await rejouer(cache, executer, estErreurReseau, { tentativesMax: 2, maintenant: new Date(Date.UTC(2026, 10, 1)) })).toEqual({
      envoyes: 1,
      restants: 1,
      horsLigne: false,
    });
    const [restant] = await cache.envoisEnAttente();
    expect(restant?.tentatives).toBe(1);
    expect(restant?.derniereErreur).toContain("row-level security");

    await rejouer(cache, executer, estErreurReseau, { tentativesMax: 2, maintenant: new Date(Date.UTC(2026, 10, 2)) });
    expect(await cache.envoisEnAttente()).toEqual([]);
  });

  it("n'abandonne jamais un Repas en attente : il est réessayé jusqu'au succès", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(enAttente("r1"));
    let analyseDisponible = false;
    const executer = async () => {
      if (!analyseDisponible) throw { message: "Edge Function returned a non-2xx status code" };
    };
    // Un jour d'écart entre chaque rejeu : le délai d'attente après un échec est toujours écoulé.
    const jour = (n: number) => ({ tentativesMax: 2, maintenant: new Date(Date.UTC(2026, 10, n)) });

    for (let i = 1; i <= 5; i++) await rejouer(cache, executer, estErreurReseau, jour(i));
    expect((await cache.envoisEnAttente())[0]?.tentatives).toBe(5);

    analyseDisponible = true;
    expect(await rejouer(cache, executer, estErreurReseau, jour(6))).toEqual({ envoyes: 1, restants: 0, horsLigne: false });
  });

  it("abandonne l'analyse d'un Repas en attente déjà enregistré après de nombreux échecs (il reste sur le serveur)", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(enAttente("r1"));
    const executer = async () => {
      throw { message: "analyse : IA indisponible", repasEnregistre: true };
    };
    const jour = (n: number) => ({ tentativesMax: 2, maintenant: new Date(Date.UTC(2026, 10, n)) });

    for (let i = 1; i <= 3; i++) await rejouer(cache, executer, estErreurReseau, jour(i));
    expect(await cache.envoisEnAttente()).toHaveLength(1);
    await rejouer(cache, executer, estErreurReseau, jour(4));
    expect(await cache.envoisEnAttente()).toEqual([]);
  });

  it("n'abandonne jamais l'eau ni un Repas enregistré depuis un Plat : ce sont des saisies", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(eau("a"));
    const executer = async () => {
      throw REFUS;
    };
    for (let i = 1; i <= 6; i++) {
      await rejouer(cache, executer, estErreurReseau, { tentativesMax: 2, maintenant: new Date(Date.UTC(2026, 10, i)) });
    }
    expect((await cache.envoisEnAttente())[0]?.tentatives).toBe(6);
  });

  it("attend de plus en plus longtemps avant de retenter un envoi refusé, sans bloquer les suivants", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.mettreEnFile(enAttente("r1"));
    await cache.mettreEnFile(eau("a"));
    const tentes: string[] = [];
    const executer = async (e: Envoi) => {
      tentes.push(e.type);
      if (e.type === "repas_en_attente") throw { message: "Edge Function returned a non-2xx status code" };
    };
    const a = (secondes: number) => ({ maintenant: new Date(Date.UTC(2026, 10, 30, 12, 0, secondes)) });

    await rejouer(cache, executer, estErreurReseau, a(0));
    expect(tentes).toEqual(["repas_en_attente", "ajouter_eau"]);

    // 30 s après un premier échec, puis 60 s après un deuxième.
    await rejouer(cache, executer, estErreurReseau, a(10));
    await rejouer(cache, executer, estErreurReseau, a(31));
    await rejouer(cache, executer, estErreurReseau, a(61));
    await rejouer(cache, executer, estErreurReseau, a(92));
    expect(tentes).toEqual(["repas_en_attente", "ajouter_eau", "repas_en_attente", "repas_en_attente"]);
    expect(await rejouer(cache, executer, estErreurReseau, a(93))).toEqual({ envoyes: 0, restants: 1, horsLigne: false });
  });
});

describe("estErreurReseau", () => {
  it("reconnaît une requête qui n'a pas atteint le serveur", () => {
    expect(estErreurReseau(new TypeError("Network request failed"))).toBe(true);
    expect(estErreurReseau(new TypeError("Network request timed out"))).toBe(true);
    expect(estErreurReseau({ message: "TypeError: Failed to fetch", details: "", code: "" })).toBe(true);
    expect(estErreurReseau({ name: "FunctionsFetchError", message: "Failed to send a request to the Edge Function" })).toBe(true);
  });

  it("ne confond pas un refus du serveur avec une absence de réseau", () => {
    expect(estErreurReseau({ message: "canceling statement due to statement timeout", code: "57014" })).toBe(false);
    expect(estErreurReseau(REFUS)).toBe(false);
    expect(estErreurReseau({ name: "FunctionsHttpError", message: "Edge Function returned a non-2xx status code" })).toBe(false);
    expect(estErreurReseau(null)).toBe(false);
  });
});

describe("changement de compte", () => {
  it("vide la file et les lectures quand un autre compte ouvre le cache", async () => {
    const base = baseEnMemoire();
    const cache = await ouvrirCacheLocal(base);
    expect(await cache.reserverA("moi")).toBe(false);
    await cache.ecrireLecture("objectifs", { calories: 2000 });
    await cache.mettreEnFile(eau("a"));

    expect(await cache.reserverA("moi")).toBe(false);
    expect(await cache.envoisEnAttente()).toHaveLength(1);

    expect(await cache.reserverA("autre")).toBe(true);
    expect(await cache.envoisEnAttente()).toEqual([]);
    expect(await cache.lireLecture("objectifs")).toBeNull();
    expect(await cache.derniereSynchro()).toBeNull();
  });
});
