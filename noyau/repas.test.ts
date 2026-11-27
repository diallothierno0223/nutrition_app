import { describe, expect, it } from "vitest";
import {
  changerEquivalentCuisine,
  appliquerCoefficient,
  changerQuantite,
  lireEquivalentCuisine,
  retirerValeurs,
  totauxDuRepas,
  type Constituant,
  type ValeursNutritionnelles,
} from "./index.ts";

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

const sauce: Constituant = {
  nom: "Sauce arachide",
  quantite: 200,
  unite: "ml",
  equivalent_cuisine: "1 louche",
  calories: 320, proteines: 12, glucides: 10, sucres: 4, lipides: 26, ags: 6.5, fibres: 3, sel: 1.8,
};

describe("correction de la quantité d'un Constituant", () => {
  it("recalcule les nutriments proportionnellement", () => {
    expect(changerQuantite(sauce, 300)).toEqual({
      ...sauce,
      quantite: 300,
      equivalent_cuisine: "1,5 louche",
      calories: 480, proteines: 18, glucides: 15, sucres: 6, lipides: 39, ags: 9.75, fibres: 4.5, sel: 2.7,
    });
  });

  it("arrondit les nutriments au centième", () => {
    expect(changerQuantite(sauce, 100 / 3).ags).toBe(1.08);
  });

  it("refuse une quantité nulle ou négative", () => {
    expect(() => changerQuantite(sauce, 0)).toThrow();
    expect(() => changerQuantite(sauce, -5)).toThrow();
  });

  it("refuse de recalculer un Constituant estimé à 0 g", () => {
    expect(() => changerQuantite({ ...sauce, quantite: 0 }, 50)).toThrow();
  });
  it("refuse une quantité qui s'arrondit à zéro", () => {
    expect(() => changerQuantite(sauce, 0.001)).toThrow();
  });
});

describe("équivalent en cuisine", () => {
  it("lit le nombre et l'ustensile, au singulier", () => {
    expect(lireEquivalentCuisine("2 c. à soupe")).toEqual({ nombre: 2, ustensile: "c. à soupe" });
    expect(lireEquivalentCuisine("1,5 louche")).toEqual({ nombre: 1.5, ustensile: "louche" });
    expect(lireEquivalentCuisine("3 louches")).toEqual({ nombre: 3, ustensile: "louche" });
    expect(lireEquivalentCuisine("2 cuillères à soupe")).toEqual({ nombre: 2, ustensile: "cuillère à soupe" });
  });

  it("lit les fractions", () => {
    expect(lireEquivalentCuisine("1/2 bol")).toEqual({ nombre: 0.5, ustensile: "bol" });
    expect(lireEquivalentCuisine("1 1/2 bol")).toEqual({ nombre: 1.5, ustensile: "bol" });
    expect(lireEquivalentCuisine("½ bol")).toEqual({ nombre: 0.5, ustensile: "bol" });
  });

  it("ne lit rien sans nombre en tête", () => {
    expect(lireEquivalentCuisine("une poignée")).toBeNull();
    expect(lireEquivalentCuisine("1,5/2 bol")).toBeNull();
  });

  it("corrige un Constituant en nombre d'ustensiles, au pluriel", () => {
    const corrige = changerEquivalentCuisine(sauce, 2);
    expect(corrige.quantite).toBe(400);
    expect(corrige.equivalent_cuisine).toBe("2 louches");
    expect(corrige.calories).toBe(640);
  });

  it("garde l'équivalent précis au centième pour les corrections suivantes", () => {
    const tiers = changerQuantite(sauce, 200 / 3);
    expect(tiers.equivalent_cuisine).toBe("0,33 louche");
    // 0,33 au lieu d'un tiers : à peine 1 % d'écart en revenant à une louche.
    expect(Math.abs(changerEquivalentCuisine(tiers, 1).quantite - 200)).toBeLessThan(2.1);
  });

  it("retire un équivalent devenu trop petit pour s'écrire", () => {
    expect(changerQuantite(sauce, 0.5).equivalent_cuisine).toBe("");
  });

  it("refuse de corriger en ustensiles un Constituant sans équivalent lisible", () => {
    expect(() => changerEquivalentCuisine({ ...sauce, equivalent_cuisine: "une poignée" }, 2)).toThrow();
  });
});

describe("Coefficient de portion", () => {
  it("multiplie quantités, équivalents et nutriments de chaque Constituant", () => {
    const [demi] = appliquerCoefficient([sauce], 0.5);
    expect(demi).toEqual({
      ...sauce,
      quantite: 100,
      equivalent_cuisine: "0,5 louche",
      calories: 160, proteines: 6, glucides: 5, sucres: 2, lipides: 13, ags: 3.25, fibres: 1.5, sel: 0.9,
    });
  });

  it("laisse intacts les Constituants d'origine (copie)", () => {
    appliquerCoefficient([sauce], 2);
    expect(sauce.quantite).toBe(200);
  });

  it("accepte un Constituant estimé à 0 g", () => {
    expect(appliquerCoefficient([{ ...sauce, quantite: 0 }], 1.5)[0]?.calories).toBe(480);
  });

  it("refuse un coefficient nul ou négatif", () => {
    expect(() => appliquerCoefficient([sauce], 0)).toThrow();
  });
});
