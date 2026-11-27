import { describe, expect, it } from "vitest";
import {
  REGLAGES_DU_SAMEDI_PAR_DEFAUT,
  lireRendezVous,
  nutrimentsParPortion,
  periodeDAnalyse,
  platDUnePortion,
  recettesInterdites,
  samediDeReference,
  type Constituant,
} from "./index.ts";

const PARIS = "Europe/Paris";

describe("samedi de référence", () => {
  it("devient le samedi même à partir de 6 h, heure locale", () => {
    expect(samediDeReference(new Date("2026-11-28T04:59:00Z"), PARIS)).toBe("2026-11-21"); // 5 h 59 à Paris
    expect(samediDeReference(new Date("2026-11-28T05:00:00Z"), PARIS)).toBe("2026-11-28"); // 6 h 00 à Paris
  });

  it("reste le samedi passé le reste de la semaine", () => {
    expect(samediDeReference(new Date("2026-11-25T12:00:00Z"), PARIS)).toBe("2026-11-21");
    expect(samediDeReference(new Date("2026-11-29T12:00:00Z"), PARIS)).toBe("2026-11-28");
    expect(samediDeReference(new Date("2026-12-04T22:00:00Z"), PARIS)).toBe("2026-11-28");
  });

  it("suit l'heure d'été", () => {
    expect(samediDeReference(new Date("2026-06-27T03:59:00Z"), PARIS)).toBe("2026-06-20"); // 5 h 59 (UTC+2)
    expect(samediDeReference(new Date("2026-06-27T04:00:00Z"), PARIS)).toBe("2026-06-27"); // 6 h 00 (UTC+2)
  });
});

describe("Période d'analyse", () => {
  it("couvre les 7 Journées qui précèdent le samedi", () => {
    expect(periodeDAnalyse("2026-11-28")).toEqual([
      "2026-11-21", "2026-11-22", "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27",
    ]);
  });
});

describe("règle de variété", () => {
  const historique = [
    { nom: "Mafé de poisson", samedi: "2026-11-21", a_refaire: false },
    { nom: "Fonio aux légumes", samedi: "2026-11-14", a_refaire: true },
    { nom: "Attiéké poisson braisé", samedi: "2026-11-07", a_refaire: false },
    { nom: "Yassa de poulet", samedi: "2026-10-31", a_refaire: false }, // 4 semaines avant : de nouveau permise
  ];

  it("écarte les Recettes des 3 dernières semaines, sauf celles « à refaire »", () => {
    expect(recettesInterdites(historique, "2026-11-28")).toEqual(["Mafé de poisson", "Attiéké poisson braisé"]);
  });

  it("garde « à refaire » une Recette marquée une seule fois, même proposée de nouveau ensuite", () => {
    const refaite = [...historique, { nom: "Mafé de poisson", samedi: "2026-11-14", a_refaire: true }];
    expect(recettesInterdites(refaite, "2026-11-28")).toEqual(["Attiéké poisson braisé"]);
  });
});

const ingredient = (nom: string, calories: number): Constituant => ({
  nom, quantite: 100, unite: "g", equivalent_cuisine: "", calories,
  proteines: 10, glucides: 10, sucres: 1, lipides: 5, ags: 1, fibres: 2, sel: 0.5,
});

const recette = (nom: string, categorie: string, portions: number) => ({
  nom,
  categorie,
  portions,
  ingredients: [ingredient("Oignon", 40), ingredient(`Base de ${nom}`, 960)],
  etapes: ["Émincer", "Mijoter"],
  conservation: "Réfrigérateur 3 jours",
  ordre_conseille: "À manger en premier",
});

const reponseValide = () => ({
  bilan: "Semaine riche en AGS : des Recettes plus légères.",
  recettes: [
    recette("Mafé de poisson", "repas", 4),
    recette("Fonio aux légumes", "repas", 3),
    recette("Soupe kandia", "repas", 3),
    recette("Galettes de mil", "petit_dejeuner_nomade", 3),
    recette("Bouillie de mil", "petit_dejeuner_rapide", 2),
    recette("Pain complet et avocat", "petit_dejeuner_rapide", 2),
  ],
});

describe("lecture du Rendez-vous généré par l'IA", () => {
  it("accepte une réponse conforme aux Réglages du samedi", () => {
    const lu = lireRendezVous(reponseValide(), REGLAGES_DU_SAMEDI_PAR_DEFAUT, []);
    expect(lu.recettes).toHaveLength(6);
    expect(lu.recettes[0]?.ingredients[0]?.nom).toBe("Oignon");
  });

  it("refuse un nombre de Recettes ou de portions différent des Réglages", () => {
    const enTrop = reponseValide();
    enTrop.recettes.push(recette("Yassa", "repas", 2));
    expect(() => lireRendezVous(enTrop, REGLAGES_DU_SAMEDI_PAR_DEFAUT, [])).toThrow();

    const portions = reponseValide();
    portions.recettes[0]!.portions = 5;
    expect(() => lireRendezVous(portions, REGLAGES_DU_SAMEDI_PAR_DEFAUT, [])).toThrow();
  });

  it("refuse une Recette interdite par la règle de variété", () => {
    expect(() => lireRendezVous(reponseValide(), REGLAGES_DU_SAMEDI_PAR_DEFAUT, ["mafé de poisson"])).toThrow();
  });

  it("laisse revenir les petits-déjeuners d'une semaine à l'autre", () => {
    expect(() => lireRendezVous(reponseValide(), REGLAGES_DU_SAMEDI_PAR_DEFAUT, ["Galettes de mil"])).not.toThrow();
  });

  it("refuse une Recette sans ingrédient ou sans étape", () => {
    const sansEtape = reponseValide();
    sansEtape.recettes[1]!.etapes = [];
    expect(() => lireRendezVous(sansEtape, REGLAGES_DU_SAMEDI_PAR_DEFAUT, [])).toThrow();
  });
});

describe("nutriments par portion", () => {
  it("divisent les nutriments des ingrédients par le nombre de portions", () => {
    const lu = lireRendezVous(reponseValide(), REGLAGES_DU_SAMEDI_PAR_DEFAUT, []);
    expect(nutrimentsParPortion(lu.recettes[0]!)).toMatchObject({ calories: 250, ags: 0.5, sel: 0.25 });
  });
});

describe("Plat de la semaine", () => {
  it("contient une portion de chaque ingrédient de la Recette", () => {
    const lu = lireRendezVous(reponseValide(), REGLAGES_DU_SAMEDI_PAR_DEFAUT, []);
    const [oignonPourUnePortion] = platDUnePortion(lu.recettes[0]!); // Mafé de poisson, 4 portions
    expect(oignonPourUnePortion).toMatchObject({ nom: "Oignon", quantite: 25, calories: 10, ags: 0.25 });
  });
});
