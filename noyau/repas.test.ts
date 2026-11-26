import { describe, expect, it } from "vitest";
import { retirerValeurs, totauxDuRepas, type ValeursNutritionnelles } from "./index.ts";

describe("retrait de valeurs nutritionnelles", () => {
  it("retire une partie d'un total, nutriment par nutriment", () => {
    const total = { calories: 1030, proteines: 32, glucides: 104, sucres: 8.2, lipides: 53, ags: 13.2, fibres: 7.2, sel: 3.6 };
    const part = { calories: 515, proteines: 16, glucides: 52, sucres: 4.1, lipides: 26.5, ags: 6.6, fibres: 3.6, sel: 1.8 };
    expect(retirerValeurs(total, part)).toEqual(part);
  });
});

const riz: ValeursNutritionnelles = { calories: 195, proteines: 4, glucides: 42, sucres: 0.1, lipides: 0.5, ags: 0.1, fibres: 0.6, sel: 0 };
const mafe: ValeursNutritionnelles = { calories: 420, proteines: 28, glucides: 12, sucres: 5, lipides: 29, ags: 7.5, fibres: 4.4, sel: 2.1 };

describe("totaux d'un Repas", () => {
  it("additionne les nutriments de ses Constituants", () => {
    expect(totauxDuRepas([riz, mafe])).toEqual({
      calories: 615,
      proteines: 32,
      glucides: 54,
      sucres: 5.1,
      lipides: 29.5,
      ags: 7.6,
      fibres: 5,
      sel: 2.1,
    });
  });

  it("vaut zéro pour un Repas sans Constituant", () => {
    expect(totauxDuRepas([])).toEqual({ calories: 0, proteines: 0, glucides: 0, sucres: 0, lipides: 0, ags: 0, fibres: 0, sel: 0 });
  });
});
