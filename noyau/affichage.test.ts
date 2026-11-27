import { describe, expect, it } from "vitest";
import {
  formaterNombre,
  formaterQuantite,
  libelleCourtDeJournee,
  formaterLitres,
  libelleDEtat,
  libelleDuSens,
  resumeDuJour,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "./index.ts";

const ESPACE = " ";

describe("formaterNombre", () => {
  it("écrit les nombres à la française : virgule décimale, milliers séparés par une espace insécable", () => {
    expect(formaterNombre(1522.5)).toBe(`1${ESPACE}522,5`);
    expect(formaterNombre(1959)).toBe(`1${ESPACE}959`);
    expect(formaterNombre(13713.04)).toBe(`13${ESPACE}713`);
    expect(formaterNombre(0.4)).toBe("0,4");
    expect(formaterNombre(-0.36)).toBe("-0,4");
  });

  it("arrondit au nombre de décimales demandé, sans zéro inutile", () => {
    expect(formaterNombre(19.5, 0)).toBe("20");
    expect(formaterNombre(3.14159, 2)).toBe("3,14");
    expect(formaterNombre(4, 1)).toBe("4");
  });
});

describe("formaterQuantite", () => {
  it("donne les calories à l'unité et les grammes au dixième, avec l'unité", () => {
    expect(formaterQuantite("calories", 1959.4)).toBe(`1${ESPACE}959 kcal`);
    expect(formaterQuantite("glucides", 1522.54)).toBe(`1${ESPACE}522,5 g`);
  });
});

describe("formaterLitres", () => {
  it("donne un volume stocké en ml en litres, au centième", () => {
    expect(formaterLitres(1250)).toBe("1,25 L");
    expect(formaterLitres(2000)).toBe("2 L");
    expect(formaterLitres(750)).toBe("0,75 L");
  });
});

describe("libelleDEtat", () => {
  it("dit l'état d'une jauge quand il mérite une mention", () => {
    expect(libelleDEtat("depasse")).toBe("dépassé");
    expect(libelleDEtat("approche")).toBe("proche du plafond");
    expect(libelleDEtat("en_dessous")).toBe("en dessous");
    expect(libelleDEtat("normal")).toBeNull();
    expect(libelleDEtat("sans_objectif")).toBeNull();
  });
});

describe("libelleDuSens", () => {
  it("dit ce que l'Objectif demande", () => {
    expect(libelleDuSens("plafond")).toBe("à ne pas dépasser");
    expect(libelleDuSens("cible")).toBe("à atteindre");
    expect(libelleDuSens("plage")).toBe("à ±10 %");
  });
});

describe("libelleCourtDeJournee", () => {
  it("écrit la Journée sans le jour de la semaine, pour tenir dans un champ", () => {
    expect(libelleCourtDeJournee("2004-03-03")).toBe("3 mars 2004");
    expect(libelleCourtDeJournee("2027-01-01")).toBe("1er janvier 2027");
    expect(libelleCourtDeJournee("2026-02-30")).toBe("2026-02-30");
  });
});

describe("resumeDuJour", () => {
  const objectifs: ObjectifsJournaliers = {
    calories: 1959, proteines: 90, glucides: 330, sucres: 40, lipides: 85, ags: 18, fibres: 30, sel: 5,
  };
  const totaux: ValeursNutritionnelles = {
    calories: 1820, proteines: 62, glucides: 245, sucres: 34, lipides: 79, ags: 19.5, fibres: 14, sel: 3.1,
  };

  it("donne les calories du jour, ce qui reste, et les nutriments dépassés ou proches du plafond", () => {
    expect(resumeDuJour(totaux, objectifs)).toEqual({
      calories: 1820,
      objectifCalories: 1959,
      resteCalories: 139,
      etatCalories: "normal",
      depasses: ["ags"],
      proches: ["sucres"],
    });
  });

  it("ne donne pas de reste sans Objectif de calories, ni un reste négatif", () => {
    expect(resumeDuJour(totaux, { ...objectifs, calories: null }).resteCalories).toBeNull();
    expect(resumeDuJour({ ...totaux, calories: 2300 }, objectifs).resteCalories).toBe(0);
  });

  it("compte une Plage au-dessus de sa tolérance comme dépassée", () => {
    expect(resumeDuJour({ ...totaux, calories: 2300 }, objectifs).depasses).toEqual(["calories", "ags"]);
  });
});
