import { describe, expect, it } from "vitest";
import { CATEGORIES_DE_REGLE, contientUnSeuilChiffre, libelleDeCategorie } from "./index.ts";

describe("catégories des Règles du médecin", () => {
  it("classe les consignes en trois catégories", () => {
    expect(CATEGORIES_DE_REGLE.map(libelleDeCategorie)).toEqual(["À privilégier", "À éviter", "Conseil"]);
  });
});

describe("détection d'un seuil chiffré dans une consigne", () => {
  it("repère une quantité avec son unité", () => {
    expect(contientUnSeuilChiffre("Moins de 15 g d'AGS par jour")).toBe(true);
    expect(contientUnSeuilChiffre("Pas plus de 300mg de cholestérol")).toBe(true);
    expect(contientUnSeuilChiffre("Limiter à 2000 kcal")).toBe(true);
    expect(contientUnSeuilChiffre("Graisses saturées sous 7 % de l'énergie")).toBe(true);
    expect(contientUnSeuilChiffre("Sel : 5,5 g maximum")).toBe(true);
  });

  it("repère aussi les unités écrites en toutes lettres et les centilitres", () => {
    expect(contientUnSeuilChiffre("Pas plus de 5 grammes de sel")).toBe(true);
    expect(contientUnSeuilChiffre("Boire 1,5 litre d'eau")).toBe(true);
    expect(contientUnSeuilChiffre("Un verre de 25 cl de jus au maximum")).toBe(true);
  });

  it("laisse passer une consigne sans seuil", () => {
    expect(contientUnSeuilChiffre("Privilégier le poisson et le fonio")).toBe(false);
    expect(contientUnSeuilChiffre("Éviter l'huile de palme")).toBe(false);
  });

  it("ne confond pas une fréquence avec un seuil", () => {
    expect(contientUnSeuilChiffre("Poisson gras 2 fois par semaine")).toBe(false);
  });
});
