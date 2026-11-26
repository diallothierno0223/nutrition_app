import { describe, expect, it } from "vitest";
import { NUTRIMENTS, libelleDuNutriment, sensDuNutriment, uniteDuNutriment } from "./index.ts";

describe("unités des nutriments", () => {
  it("compte les calories en kcal et le reste en grammes", () => {
    expect(NUTRIMENTS.map(uniteDuNutriment)).toEqual(["kcal", "g", "g", "g", "g", "g", "g", "g"]);
  });
});

describe("libellés des nutriments", () => {
  it("donne le libellé affiché de chaque nutriment", () => {
    expect(NUTRIMENTS.map(libelleDuNutriment)).toEqual([
      "Calories",
      "Protéines",
      "Glucides",
      "Sucres",
      "Lipides",
      "AGS",
      "Fibres",
      "Sel",
    ]);
  });
});

describe("sens des nutriments", () => {
  it("suit les 8 nutriments de la V1", () => {
    expect(NUTRIMENTS).toEqual([
      "calories",
      "proteines",
      "glucides",
      "sucres",
      "lipides",
      "ags",
      "fibres",
      "sel",
    ]);
  });

  it("traite les AGS, les Sucres et le Sel comme des Plafonds", () => {
    expect(sensDuNutriment("ags")).toBe("plafond");
    expect(sensDuNutriment("sucres")).toBe("plafond");
    expect(sensDuNutriment("sel")).toBe("plafond");
  });

  it("traite les Protéines et les Fibres comme des Cibles", () => {
    expect(sensDuNutriment("proteines")).toBe("cible");
    expect(sensDuNutriment("fibres")).toBe("cible");
  });

  it("traite Calories, Glucides et Lipides comme des Plages", () => {
    expect(sensDuNutriment("calories")).toBe("plage");
    expect(sensDuNutriment("glucides")).toBe("plage");
    expect(sensDuNutriment("lipides")).toBe("plage");
  });
});
