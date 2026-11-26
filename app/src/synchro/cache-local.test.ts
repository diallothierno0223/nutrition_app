import { describe, expect, it } from "vitest";
import { ouvrirCacheLocal } from "./cache-local.ts";
import { baseEnMemoire } from "./base-locale-node.ts";

describe("cache local", () => {
  it("n'a jamais été synchronisé à la première ouverture", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    expect(await cache.derniereSynchro()).toBeNull();
  });

  it("retient l'heure de la dernière synchro", async () => {
    const cache = await ouvrirCacheLocal(baseEnMemoire());
    await cache.noterSynchro(new Date("2026-11-26T13:42:00Z"));
    expect(await cache.derniereSynchro()).toEqual(new Date("2026-11-26T13:42:00Z"));
  });

  it("conserve la dernière synchro quand on rouvre la même base", async () => {
    const base = baseEnMemoire();
    const premiere = await ouvrirCacheLocal(base);
    await premiere.noterSynchro(new Date("2026-11-26T13:42:00Z"));

    const seconde = await ouvrirCacheLocal(base);
    expect(await seconde.derniereSynchro()).toEqual(new Date("2026-11-26T13:42:00Z"));
  });
});
