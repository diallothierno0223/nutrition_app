import { describe, expect, it } from "vitest";
import { journeeDe, libelleDuTypeDeRepas, typeDeRepas } from "./index.ts";

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
