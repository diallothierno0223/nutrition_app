import { describe, expect, it } from "vitest";
import {
  ajouterJours,
  debutDePeriode,
  journeesDeLaSemaine,
  lundiDe,
  moyenneGlobale,
  objectifsHebdomadaires,
  type ObjectifsJournaliers,
} from "./index.ts";

describe("Semaine", () => {
  it("commence le lundi, même pour un dimanche", () => {
    expect(lundiDe("2026-11-26")).toBe("2026-11-23");
    expect(lundiDe("2026-11-29")).toBe("2026-11-23");
    expect(lundiDe("2026-11-23")).toBe("2026-11-23");
  });

  it("enjambe deux mois", () => {
    expect(journeesDeLaSemaine("2026-10-01")).toEqual([
      "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
    ]);
  });

  it("garde 7 Journées la semaine du changement d'heure", () => {
    expect(journeesDeLaSemaine("2026-03-29")).toEqual([
      "2026-03-23", "2026-03-24", "2026-03-25", "2026-03-26", "2026-03-27", "2026-03-28", "2026-03-29",
    ]);
    expect(ajouterJours("2026-10-24", 1)).toBe("2026-10-25");
    expect(ajouterJours("2026-10-25", 1)).toBe("2026-10-26");
  });

  it("enjambe aussi une année", () => {
    expect(lundiDe("2027-01-01")).toBe("2026-12-28");
  });
});

describe("Objectif hebdomadaire", () => {
  it("vaut 7 fois l'Objectif journalier, et reste vide sans Objectif", () => {
    const journaliers: ObjectifsJournaliers = {
      calories: 2200, proteines: 90, glucides: 300, sucres: 45.5, lipides: 75, ags: 18, fibres: 30, sel: null,
    };
    expect(objectifsHebdomadaires(journaliers)).toEqual({
      calories: 15400, proteines: 630, glucides: 2100, sucres: 318.5, lipides: 525, ags: 126, fibres: 210, sel: null,
    });
  });
});

describe("moyenne globale", () => {
  const jour = (calories: number) => ({ calories, proteines: 0, glucides: 0, sucres: 0, lipides: 0, ags: 3, fibres: 0, sel: 0 });

  it("ne compte que les Journées où un Repas est enregistré", () => {
    // Période de 30 jours, mais seulement 2 Journées renseignées : les oublis ne font pas baisser la moyenne.
    expect(moyenneGlobale([jour(2000), jour(1000)])).toEqual({
      moyenne: { ...jour(1500), ags: 3 },
      nombreDeJournees: 2,
    });
  });

  it("n'a pas de moyenne sans Journée renseignée", () => {
    expect(moyenneGlobale([])).toEqual({ moyenne: null, nombreDeJournees: 0 });
  });

  it("commence 30 ou 90 Journées avant, ou au tout début", () => {
    expect(debutDePeriode("2026-11-26", "30_jours")).toBe("2026-10-28");
    expect(debutDePeriode("2026-11-26", "90_jours")).toBe("2026-08-29");
    expect(debutDePeriode("2026-11-26", "tout")).toBeNull();
  });
});
