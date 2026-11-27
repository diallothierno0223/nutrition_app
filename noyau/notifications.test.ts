import { describe, expect, it } from "vitest";
import {
  NOTIFICATIONS_PAR_DEFAUT,
  contenuDeNotification,
  lireReglagesDesNotifications,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "./index.ts";

const OBJECTIFS: ObjectifsJournaliers = {
  calories: 2200, proteines: 90, glucides: 300, sucres: 45, lipides: 75, ags: 18, fibres: 30, sel: 5,
};
const consomme = (v: Partial<ValeursNutritionnelles>): ValeursNutritionnelles => ({
  calories: 0, proteines: 0, glucides: 0, sucres: 0, lipides: 0, ags: 0, fibres: 0, sel: 0, ...v,
});

describe("notification du soir", () => {
  it("donne les quotas restants, les Cibles non atteintes et l'eau qui manque", () => {
    const contenu = contenuDeNotification("soir", {
      totaux: consomme({ calories: 1550, proteines: 70, glucides: 220, sucres: 35, lipides: 60, ags: 14.2, fibres: 18, sel: 3.8 }),
      objectifs: OBJECTIFS,
      eauMl: 1500,
      objectifEauMl: 2000,
    });
    expect(contenu).toEqual({
      titre: "Avant le dîner",
      corps:
        "Reste : 650 kcal, glucides 80 g, sucres 10 g, lipides 15 g, AGS 3,8 g, sel 1,2 g.\n" +
        "À compléter : protéines 20 g, fibres 12 g.\n" +
        "Eau : encore 0,5 L.",
    });
  });

  it("signale les Plafonds déjà dépassés", () => {
    const { corps } = contenuDeNotification("soir", {
      totaux: consomme({ calories: 2000, proteines: 95, glucides: 280, sucres: 50, lipides: 70, ags: 21, fibres: 31, sel: 4 }),
      objectifs: OBJECTIFS,
      eauMl: 2000,
      objectifEauMl: 2000,
    });
    expect(corps).toBe("Reste : 200 kcal, glucides 20 g, lipides 5 g, sel 1 g.\nDéjà dépassé : sucres, AGS.");
  });

  it("ne parle que des nutriments qui ont un Objectif", () => {
    const { corps } = contenuDeNotification("soir", {
      totaux: consomme({ calories: 1000 }),
      objectifs: { ...OBJECTIFS, glucides: null, sucres: null, lipides: null, ags: null, sel: null, proteines: null, fibres: null },
      eauMl: 0,
      objectifEauMl: null,
    });
    expect(corps).toBe("Reste : 1200 kcal.");
  });

  it("félicite quand tout est atteint", () => {
    const { corps } = contenuDeNotification("soir", {
      totaux: consomme({ calories: 2200, proteines: 90, glucides: 300, sucres: 10, lipides: 75, ags: 5, fibres: 30, sel: 2 }),
      objectifs: { ...OBJECTIFS, sucres: null, ags: null, sel: null },
      eauMl: 2500,
      objectifEauMl: 2000,
    });
    expect(corps).toBe("Objectifs du jour atteints.");
  });
});

describe("autres notifications", () => {
  const contexte = { totaux: consomme({}), objectifs: OBJECTIFS, eauMl: 750, objectifEauMl: 2000 };

  it("rappelle le matin le petit-déjeuner, l'eau et l'objectif du jour", () => {
    expect(contenuDeNotification("matin", contexte)).toEqual({
      titre: "Bonjour",
      corps: "Petit-déjeuner et un verre d'eau. Objectif du jour : 2200 kcal, AGS 18 g au plus.",
    });
  });

  it("rappelle à midi la saisie du déjeuner et l'eau", () => {
    expect(contenuDeNotification("midi", contexte)).toEqual({
      titre: "Déjeuner",
      corps: "Pense à saisir ton déjeuner. Eau : 0,75 L sur 2 L.",
    });
  });

  it("rappelle l'export mensuel des données", () => {
    expect(contenuDeNotification("export", contexte)).toEqual({
      titre: "Export mensuel",
      corps: "Pense à exporter tes données (Réglages › Données) et à garder le fichier en lieu sûr.",
    });
  });

  it("reste neutre le samedi", () => {
    expect(contenuDeNotification("samedi", contexte)).toEqual({
      titre: "Rendez-vous du samedi",
      corps: "Ton Rendez-vous du samedi t'attend.",
    });
  });
});

describe("réglages des notifications", () => {
  it("ont des heures par défaut : 10 h, 14 h, 21 h, samedi 9 h et export le 1er du mois à 10 h", () => {
    expect(NOTIFICATIONS_PAR_DEFAUT).toEqual({
      matin: { heure: "10:00", active: true },
      midi: { heure: "14:00", active: true },
      soir: { heure: "21:00", active: true },
      samedi: { heure: "09:00", active: true },
      export: { heure: "10:00", active: true },
    });
  });

  it("complètent un réglage absent ou invalide par la valeur par défaut", () => {
    expect(lireReglagesDesNotifications({ soir: { heure: "20:30", active: false }, midi: { heure: "25:00", active: true } }))
      .toEqual({ ...NOTIFICATIONS_PAR_DEFAUT, soir: { heure: "20:30", active: false } });
    expect(lireReglagesDesNotifications(null)).toEqual(NOTIFICATIONS_PAR_DEFAUT);
  });
});
