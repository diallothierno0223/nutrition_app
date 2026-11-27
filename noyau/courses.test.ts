import { describe, expect, it } from "vitest";
import { construireListeDeCourses, type RecettePourCourses } from "./index.ts";

const oignon = (id: string, quantite: number, coche = false) => ({
  id, nom: "Oignon", quantite, unite: "g" as const, equivalent_cuisine: "1 oignon", coche,
});

function recettes(): RecettePourCourses[] {
  return [
    { id: "r1", nom: "Mafé de poisson", categorie: "repas", dans_la_liste: true,
      ingredients: [oignon("i1", 150, true), { id: "i2", nom: "Poisson", quantite: 600, unite: "g", equivalent_cuisine: "", coche: false }] },
    { id: "r2", nom: "Yassa de poulet", categorie: "repas", dans_la_liste: true, ingredients: [oignon("i3", 300)] },
    { id: "p1", nom: "Galettes de mil", categorie: "petit_dejeuner_nomade", dans_la_liste: true,
      ingredients: [{ id: "i4", nom: "oignon ", quantite: 50, unite: "g", equivalent_cuisine: "", coche: false }] },
    { id: "p2", nom: "Bouillie de mil", categorie: "petit_dejeuner_rapide", dans_la_liste: true,
      ingredients: [{ id: "i5", nom: "Lait", quantite: 500, unite: "ml", equivalent_cuisine: "2 verres", coche: false }] },
  ];
}

describe("Liste de courses", () => {
  it("range par Recette, puis petits-déjeuners, puis ajouts manuels", () => {
    const liste = construireListeDeCourses(recettes(), [{ id: "a1", nom: "Piment", coche: false }]);
    expect(liste.map((s) => s.titre)).toEqual([
      "Mafé de poisson", "Yassa de poulet", "Galettes de mil", "Bouillie de mil", "Ajouts manuels",
    ]);
  });

  it("garde un ingrédient commun dans chaque Recette, avec sa case et son total", () => {
    const [mafe, yassa, galettes] = construireListeDeCourses(recettes(), []);
    expect(mafe?.lignes[0]).toEqual({
      id: "i1", nom: "Oignon", detail: "150 g (1 oignon)", coche: true, total: "500 g au total", manuel: false,
    });
    expect(yassa?.lignes[0]).toMatchObject({ id: "i3", coche: false, total: "500 g au total" });
    expect(galettes?.lignes[0]).toMatchObject({ id: "i4", total: "500 g au total" });
    expect(mafe?.lignes[1]).toMatchObject({ nom: "Poisson", detail: "600 g", total: null });
  });

  it("recalcule sans la Recette désélectionnée, en gardant cases cochées et ajouts manuels", () => {
    const etat = recettes();
    etat[1]!.dans_la_liste = false; // Yassa
    const liste = construireListeDeCourses(etat, [{ id: "a1", nom: "Piment", coche: true }]);

    expect(liste.map((s) => s.titre)).not.toContain("Yassa de poulet");
    expect(liste[0]?.lignes[0]).toMatchObject({ id: "i1", coche: true, total: "200 g au total" });
    expect(liste.at(-1)?.lignes).toEqual([{ id: "a1", nom: "Piment", detail: "", coche: true, total: null, manuel: true }]);
  });

  it("retrouve les cases d'une Recette resélectionnée", () => {
    const etat = recettes();
    etat[1]!.ingredients[0]!.coche = true;
    etat[1]!.dans_la_liste = false;
    construireListeDeCourses(etat, []);
    etat[1]!.dans_la_liste = true;

    const yassa = construireListeDeCourses(etat, []).find((s) => s.titre === "Yassa de poulet");
    expect(yassa?.lignes[0]).toMatchObject({ coche: true, total: "500 g au total" });
  });

  it("n'affiche pas de section d'ajouts manuels vide", () => {
    expect(construireListeDeCourses(recettes(), []).map((s) => s.titre)).not.toContain("Ajouts manuels");
  });
});
