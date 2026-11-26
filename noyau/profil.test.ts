import { describe, expect, it } from "vitest";
import {
  NUTRIMENTS,
  SEUIL_ECART_GARDE_FOU,
  SEXES,
  ageA,
  libelleDuSexe,
  besoinEnergetique,
  ecartAvecGardeFou,
  lireEstimationObjectifs,
  reestimationAProposer,
} from "./index.ts";

describe("sexes", () => {
  it("propose les deux sexes de la formule, avec leur libellé", () => {
    expect(SEXES.map(libelleDuSexe)).toEqual(["Homme", "Femme"]);
  });
});

describe("âge", () => {
  it("compte les anniversaires passés à la date donnée", () => {
    expect(ageA("1996-03-15", "2026-03-14")).toBe(29);
    expect(ageA("1996-03-15", "2026-03-15")).toBe(30);
  });
});

describe("besoin énergétique (formule garde-fou, Mifflin-St Jeor × activité)", () => {
  it("calcule le besoin d'un homme modérément actif", () => {
    // 10 × 70 + 6,25 × 175 − 5 × 30 + 5 = 1648,75 kcal ; × 1,55 = 2555,6
    const profil = { taille_cm: 175, date_naissance: "1996-01-01", sexe: "homme", niveau_activite: "modere" } as const;
    expect(besoinEnergetique(profil, 70, "2026-11-27")).toBe(2556);
  });

  it("calcule le besoin d'une femme sédentaire", () => {
    // 10 × 60 + 6,25 × 165 − 5 × 40 − 161 = 1270,25 kcal ; × 1,2 = 1524,3
    const profil = { taille_cm: 165, date_naissance: "1986-01-01", sexe: "femme", niveau_activite: "sedentaire" } as const;
    expect(besoinEnergetique(profil, 60, "2026-11-27")).toBe(1524);
  });
});

describe("écart avec le garde-fou", () => {
  it("mesure l'écart en pourcentage de la référence", () => {
    expect(ecartAvecGardeFou(2750, 2500)).toEqual({ pourcentage: 10, alerte: false });
    expect(ecartAvecGardeFou(2000, 2500)).toEqual({ pourcentage: -20, alerte: false });
  });

  it("alerte au-delà du seuil, dans les deux sens", () => {
    expect(SEUIL_ECART_GARDE_FOU).toBe(20);
    expect(ecartAvecGardeFou(3100, 2500).alerte).toBe(true);
    expect(ecartAvecGardeFou(1900, 2500).alerte).toBe(true);
  });
});

describe("lecture d'une Estimation des Objectifs par l'IA", () => {
  const estimationValide = Object.fromEntries(
    NUTRIMENTS.map((n) => [n, { valeur: 100, justification: `Pour ${n}.` }]),
  );

  it("accepte une estimation complète", () => {
    expect(lireEstimationObjectifs({ objectifs: estimationValide })).toEqual(estimationValide);
  });

  it("refuse un nutriment manquant ou une valeur non positive", () => {
    const { sel: _sel, ...sansSel } = estimationValide;
    expect(() => lireEstimationObjectifs({ objectifs: sansSel })).toThrow(/sel/);
    expect(() =>
      lireEstimationObjectifs({ objectifs: { ...estimationValide, ags: { valeur: 0, justification: "x" } } }),
    ).toThrow(/ags/);
  });

  it("refuse une justification absente", () => {
    expect(() =>
      lireEstimationObjectifs({ objectifs: { ...estimationValide, fibres: { valeur: 30 } } }),
    ).toThrow(/fibres/);
  });
});

describe("réestimation à proposer", () => {
  it("est proposée quand une source a changé après les Objectifs", () => {
    expect(reestimationAProposer("2026-11-20T10:00:00Z", ["2026-11-21T08:00:00Z", null])).toBe(true);
  });

  it("n'est pas proposée quand rien n'a changé depuis", () => {
    expect(reestimationAProposer("2026-11-20T10:00:00Z", ["2026-11-19T08:00:00Z", null])).toBe(false);
  });

  it("n'est pas proposée tant qu'aucun Objectif n'existe (on propose alors une première estimation)", () => {
    expect(reestimationAProposer(null, ["2026-11-21T08:00:00Z"])).toBe(false);
  });
});
