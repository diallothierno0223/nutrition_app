import { describe, expect, it } from "vitest";
import {
  depuisJournee,
  estUneJourneeValide,
  journeeDe,
  libelleDHeure,
  libelleDeJournee,
  libelleDuTypeDeRepas,
  typeDeRepas,
  versHeure,
  versJournee,
} from "./index.ts";

describe("validation d'une date de Journée (AAAA-MM-JJ)", () => {
  it("accepte une date réelle", () => {
    expect(estUneJourneeValide("2026-11-20")).toBe(true);
    expect(estUneJourneeValide("2028-02-29")).toBe(true);
  });

  it("refuse une date impossible ou mal écrite", () => {
    expect(estUneJourneeValide("2026-13-45")).toBe(false);
    expect(estUneJourneeValide("2026-02-30")).toBe(false);
    expect(estUneJourneeValide("2027-02-29")).toBe(false);
    expect(estUneJourneeValide("20/11/2026")).toBe(false);
    expect(estUneJourneeValide("")).toBe(false);
  });
});

describe("libellés des Types de repas", () => {
  it("donne le libellé affiché de chaque Type de repas", () => {
    expect(libelleDuTypeDeRepas("petit_dejeuner")).toBe("Petit-déjeuner");
    expect(libelleDuTypeDeRepas("dejeuner")).toBe("Déjeuner");
    expect(libelleDuTypeDeRepas("collation")).toBe("Collation");
    expect(libelleDuTypeDeRepas("diner")).toBe("Dîner");
  });
});

const PARIS = "Europe/Paris";

describe("Journée", () => {
  it("rattache 23 h 59 à la Journée en cours", () => {
    expect(journeeDe(new Date("2026-11-26T22:59:00Z"), PARIS)).toBe("2026-11-26");
  });

  it("rattache 00 h 00 à la Journée suivante", () => {
    expect(journeeDe(new Date("2026-11-26T23:00:00Z"), PARIS)).toBe("2026-11-27");
  });

  it("dépend du fuseau du téléphone", () => {
    const instant = new Date("2026-11-26T23:30:00Z");
    expect(journeeDe(instant, PARIS)).toBe("2026-11-27");
    expect(journeeDe(instant, "Africa/Dakar")).toBe("2026-11-26");
  });

  it("tient compte de l'heure d'été", () => {
    // 29 mars 2026, Paris passe à UTC+2 : 22 h 30 UTC = 00 h 30 le 30 mars.
    expect(journeeDe(new Date("2026-03-29T22:30:00Z"), PARIS)).toBe("2026-03-30");
  });
});

describe("Type de repas", () => {
  const aParis = (heureLocale: string) => new Date(`2026-11-26T${heureLocale}:00+01:00`);

  it("déduit le petit-déjeuner avant 11 h", () => {
    expect(typeDeRepas(aParis("07:30"), PARIS)).toBe("petit_dejeuner");
    expect(typeDeRepas(aParis("10:59"), PARIS)).toBe("petit_dejeuner");
  });

  it("déduit le déjeuner de 11 h à 16 h", () => {
    expect(typeDeRepas(aParis("11:00"), PARIS)).toBe("dejeuner");
    expect(typeDeRepas(aParis("15:59"), PARIS)).toBe("dejeuner");
  });

  it("déduit la collation de 16 h à 18 h", () => {
    expect(typeDeRepas(aParis("16:00"), PARIS)).toBe("collation");
    expect(typeDeRepas(aParis("17:59"), PARIS)).toBe("collation");
  });

  it("déduit le dîner à partir de 18 h", () => {
    expect(typeDeRepas(aParis("18:00"), PARIS)).toBe("diner");
    expect(typeDeRepas(aParis("23:59"), PARIS)).toBe("diner");
  });

  it("utilise l'heure locale, pas l'heure UTC", () => {
    // 10 h 30 UTC = 11 h 30 à Paris en hiver : déjeuner.
    expect(typeDeRepas(new Date("2026-11-26T10:30:00Z"), PARIS)).toBe("dejeuner");
  });
});

describe("libelleDeJournee", () => {
  it("écrit la Journée en toutes lettres, jour de la semaine compris", () => {
    expect(libelleDeJournee("2026-11-28")).toBe("samedi 28 novembre 2026");
    expect(libelleDeJournee("2027-01-01")).toBe("vendredi 1er janvier 2027");
    expect(libelleDeJournee("2024-02-29")).toBe("jeudi 29 février 2024");
  });

  it("renvoie le texte tel quel s'il n'est pas une Journée valide", () => {
    expect(libelleDeJournee("2026-02-30")).toBe("2026-02-30");
  });
});

describe("libelleDHeure", () => {
  it("écrit l'heure à la française", () => {
    expect(libelleDHeure("21:00")).toBe("21 h 00");
    expect(libelleDHeure("07:05")).toBe("7 h 05");
  });

  it("renvoie le texte tel quel s'il n'est pas une heure valide", () => {
    expect(libelleDHeure("25:00")).toBe("25:00");
  });
});

describe("versJournee et depuisJournee", () => {
  it("passent d'une date locale à sa Journée et inversement", () => {
    expect(versJournee(new Date(2026, 10, 28, 23, 59))).toBe("2026-11-28");
    const date = depuisJournee("2026-11-28");
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 28]);
  });
});

describe("versHeure", () => {
  it("donne l'heure HH:MM d'une date locale", () => {
    expect(versHeure(new Date(2026, 10, 28, 7, 5))).toBe("07:05");
  });
});
