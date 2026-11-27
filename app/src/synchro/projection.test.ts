// Hors ligne, l'écran montre la dernière valeur synchronisée à laquelle s'ajoutent les envois encore en file.
import { describe, expect, it } from "vitest";
import type { Constituant, ValeursNutritionnelles } from "../../../noyau/index.ts";
import type { Envoi } from "./envois.ts";
import {
  ajoutsManuelsAvecEnvois,
  eauAvecEnvois,
  ingredientsAvecEnvois,
  repasEnFileDuJour,
  totauxAvecEnvois,
} from "./projection.ts";

const RIEN: ValeursNutritionnelles = {
  calories: 0, proteines: 0, glucides: 0, sucres: 0, lipides: 0, ags: 0, fibres: 0, sel: 0,
};
const MAFE: Constituant = {
  nom: "Mafé", quantite: 300, unite: "g", equivalent_cuisine: "1 louche",
  calories: 450, proteines: 30, glucides: 15, sucres: 4, lipides: 30, ags: 8, fibres: 4, sel: 2,
};

const depuisPlat = (id: string, journee: string): Envoi => ({
  type: "repas_depuis_plat",
  id,
  description: "Mafé",
  mangeLe: `${journee}T12:30:00Z`,
  journee,
  typeRepas: "dejeuner",
  constituants: [MAFE],
});
const enAttente = (id: string, journee: string): Envoi => ({
  type: "repas_en_attente",
  id,
  description: "riz sauce arachide",
  photoLocale: null,
  mangeLe: `${journee}T19:30:00Z`,
  journee,
  typeRepas: "diner",
});
const eau = (journee: string, quantiteMl: number): Envoi => ({
  type: "ajouter_eau", id: `${journee}-${quantiteMl}`, quantiteMl, buLe: `${journee}T09:00:00Z`, journee,
});

describe("jauges du jour calculées en local", () => {
  it("ajoutent les Repas enregistrés depuis un Plat hors ligne, pas les Repas en attente", () => {
    const totaux = totauxAvecEnvois({ ...RIEN, calories: 600 }, [depuisPlat("p", "2026-11-30"), enAttente("r", "2026-11-30")], "2026-11-30");
    expect(totaux.calories).toBe(1050);
    expect(totaux.ags).toBe(8);
  });

  it("ne mélangent pas les Journées", () => {
    expect(totauxAvecEnvois(RIEN, [depuisPlat("p", "2026-11-29")], "2026-11-30")).toEqual(RIEN);
  });

  it("ajoutent l'eau mise en file pour la Journée", () => {
    expect(eauAvecEnvois(500, [eau("2026-11-30", 250), eau("2026-11-29", 500)], "2026-11-30")).toBe(750);
  });
});

describe("Journal hors ligne", () => {
  it("montre les Repas en file de la Journée, en attente ou déjà analysés (depuis un Plat), dans l'ordre", () => {
    const repas = repasEnFileDuJour([enAttente("r", "2026-11-30"), depuisPlat("p", "2026-11-30"), depuisPlat("x", "2026-11-29")], "2026-11-30");
    expect(repas.map((r) => [r.id, r.statut])).toEqual([
      ["p", "analyse"],
      ["r", "en_attente"],
    ]);
    expect(repas[0]?.constituants).toEqual([MAFE]);
  });
});

describe("Liste de courses hors ligne", () => {
  it("applique les cases cochées en file aux ingrédients", () => {
    const envois: Envoi[] = [{ type: "cocher_ingredient", ingredientId: "i2", coche: true }];
    expect(ingredientsAvecEnvois([{ id: "i1", coche: false }, { id: "i2", coche: false }], envois)).toEqual([
      { id: "i1", coche: false },
      { id: "i2", coche: true },
    ]);
  });

  it("ajoute les articles créés hors ligne et applique leurs coches", () => {
    const envois: Envoi[] = [
      { type: "ajouter_article", id: "a2", rendezVousId: "rdv", nom: "piment" },
      { type: "ajouter_article", id: "a3", rendezVousId: "autre", nom: "sel" },
      { type: "cocher_article", articleId: "a1", coche: true },
      { type: "cocher_article", articleId: "a2", coche: true },
    ];
    expect(ajoutsManuelsAvecEnvois([{ id: "a1", nom: "sacs", coche: false }], envois, "rdv")).toEqual([
      { id: "a1", nom: "sacs", coche: true },
      { id: "a2", nom: "piment", coche: true },
    ]);
  });
});
