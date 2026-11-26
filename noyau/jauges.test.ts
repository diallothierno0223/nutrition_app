import { describe, expect, it } from "vitest";
import { etatDeJauge, objectifsRestants } from "./index.ts";

describe("état d'une jauge de Plafond (AGS, Sel)", () => {
  it("reste normale sous 80 %", () => {
    expect(etatDeJauge("ags", 15.8, 20).etat).toBe("normal"); // 79 %
  });

  it("signale l'approche dès 80 % et jusqu'à 100 % inclus", () => {
    expect(etatDeJauge("ags", 16, 20).etat).toBe("approche");
    expect(etatDeJauge("sel", 5, 5).etat).toBe("approche");
  });

  it("signale le dépassement au-delà de 100 %", () => {
    expect(etatDeJauge("ags", 20.2, 20).etat).toBe("depasse"); // 101 %
  });
});

describe("état d'une jauge de Plage (Calories, Glucides, Lipides)", () => {
  it("est normale entre 90 % et 110 % inclus", () => {
    expect(etatDeJauge("calories", 2250, 2500).etat).toBe("normal");
    expect(etatDeJauge("calories", 2750, 2500).etat).toBe("normal");
  });

  it("signale un dépassement au-dessus de 110 %", () => {
    expect(etatDeJauge("glucides", 331, 300).etat).toBe("depasse");
  });

  it("signale un manque en dessous de 90 %", () => {
    expect(etatDeJauge("lipides", 89, 100).etat).toBe("en_dessous");
  });
});

describe("état d'une jauge de Cible (Protéines, Fibres)", () => {
  it("ne déclenche jamais d'alerte en journée", () => {
    expect(etatDeJauge("fibres", 0, 30).etat).toBe("normal");
    expect(etatDeJauge("proteines", 200, 90).etat).toBe("normal");
  });
});

describe("jauge en général", () => {
  it("donne la progression en pourcentage de l'Objectif", () => {
    expect(etatDeJauge("fibres", 15, 30).pourcentage).toBe(50);
  });

  it("n'a pas d'état sans Objectif défini", () => {
    expect(etatDeJauge("sel", 3, null)).toEqual({ etat: "sans_objectif", pourcentage: null });
    expect(etatDeJauge("sel", 3, 0)).toEqual({ etat: "sans_objectif", pourcentage: null });
  });
});

describe("Objectifs restants", () => {
  it("retire du jour ce qui est déjà consommé, nutriment par nutriment", () => {
    const restants = objectifsRestants(
      { calories: 2500, proteines: 90, glucides: null, lipides: 85, ags: 20, fibres: 30, sel: 5 },
      { calories: 1200, proteines: 40, glucides: 150, lipides: 50, ags: 22, fibres: 10.5, sel: 2 },
    );
    expect(restants).toEqual({ calories: 1300, proteines: 50, glucides: null, lipides: 35, ags: -2, fibres: 19.5, sel: 3 });
  });
});
