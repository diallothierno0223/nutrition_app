import { describe, expect, it } from "vitest";
import { lireAnalyseRepas } from "./index.ts";

const constituantValide = {
  nom: "Riz blanc cuit",
  quantite: 150,
  unite: "g",
  equivalent_cuisine: "1 bol",
  calories: 195,
  proteines: 4,
  glucides: 42,
  sucres: 0.1,
  lipides: 0.5,
  ags: 0.1,
  fibres: 0.6,
  sel: 0,
};

const analyseValide = { constituants: [constituantValide], commentaire: "Point fort : peu gras." };

describe("lecture d'une analyse de l'IA", () => {
  it("accepte une analyse bien formée", () => {
    expect(lireAnalyseRepas(analyseValide)).toEqual(analyseValide);
  });

  it("limite le Commentaire du repas à 10 lignes", () => {
    const douzeLignes = Array.from({ length: 12 }, (_, i) => `Ligne ${i + 1}`).join("\n");
    const analyse = lireAnalyseRepas({ ...analyseValide, commentaire: douzeLignes });
    expect(analyse.commentaire.split("\n")).toHaveLength(10);
    expect(analyse.commentaire.endsWith("Ligne 10")).toBe(true);
  });

  it("refuse une analyse sans Constituant", () => {
    expect(() => lireAnalyseRepas({ ...analyseValide, constituants: [] })).toThrow();
  });

  it("refuse un nutriment manquant", () => {
    const { ags: _ags, ...sansAgs } = constituantValide;
    expect(() => lireAnalyseRepas({ ...analyseValide, constituants: [sansAgs] })).toThrow(/ags/);
  });

  it("refuse une valeur négative", () => {
    expect(() => lireAnalyseRepas({ ...analyseValide, constituants: [{ ...constituantValide, sel: -1 }] })).toThrow(/sel/);
  });

  it("refuse une unité autre que g ou ml", () => {
    expect(() => lireAnalyseRepas({ ...analyseValide, constituants: [{ ...constituantValide, unite: "louche" }] })).toThrow(/unite/);
  });

  it("refuse une réponse qui n'est pas un objet", () => {
    expect(() => lireAnalyseRepas("du texte")).toThrow();
    expect(() => lireAnalyseRepas(null)).toThrow();
  });

  it("ignore les champs inattendus", () => {
    const analyse = lireAnalyseRepas({
      ...analyseValide,
      intrus: true,
      constituants: [{ ...constituantValide, intrus: "x" }],
    });
    expect(analyse).toEqual(analyseValide);
  });
});
