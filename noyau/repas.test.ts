import { describe, expect, it } from "vitest";
import { totauxDuRepas, type ValeursNutritionnelles } from "./index.ts";

const riz: ValeursNutritionnelles = { calories: 195, proteines: 4, glucides: 42, lipides: 0.5, ags: 0.1, fibres: 0.6, sel: 0 };
const mafe: ValeursNutritionnelles = { calories: 420, proteines: 28, glucides: 12, lipides: 29, ags: 7.5, fibres: 4.4, sel: 2.1 };

describe("totaux d'un Repas", () => {
  it("additionne les nutriments de ses Constituants", () => {
    expect(totauxDuRepas([riz, mafe])).toEqual({
      calories: 615,
      proteines: 32,
      glucides: 54,
      lipides: 29.5,
      ags: 7.6,
      fibres: 5,
      sel: 2.1,
    });
  });

  it("vaut zéro pour un Repas sans Constituant", () => {
    expect(totauxDuRepas([])).toEqual({ calories: 0, proteines: 0, glucides: 0, lipides: 0, ags: 0, fibres: 0, sel: 0 });
  });
});
