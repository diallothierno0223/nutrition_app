import { describe, expect, it } from "vitest";
import { peseesAImporter } from "./index.ts";

const PARIS = "Europe/Paris";

describe("Pesées importées de Health Connect", () => {
  it("crée une Pesée par Journée, avec la dernière mesure du jour, arrondie à 100 g", () => {
    const mesures = [
      { instant: "2026-11-24T06:10:00Z", kg: 81.23 },
      { instant: "2026-11-24T18:00:00Z", kg: 81.68 },
      { instant: "2026-11-25T06:05:00Z", kg: 80.94 },
    ];
    expect(peseesAImporter(mesures, [], PARIS)).toEqual([
      { pese_le: "2026-11-24", poids_kg: 81.7 },
      { pese_le: "2026-11-25", poids_kg: 80.9 },
    ]);
  });

  it("rattache la mesure à la Journée locale", () => {
    // 23 h 30 UTC le 24 = 0 h 30 à Paris le 25.
    expect(peseesAImporter([{ instant: "2026-11-24T23:30:00Z", kg: 80 }], [], PARIS)).toEqual([
      { pese_le: "2026-11-25", poids_kg: 80 },
    ]);
  });

  it("ne crée pas de doublon : une Journée qui a déjà une Pesée est laissée telle quelle", () => {
    const mesures = [
      { instant: "2026-11-24T06:10:00Z", kg: 81.2 },
      { instant: "2026-11-25T06:10:00Z", kg: 80.8 },
    ];
    const existantes = [{ pese_le: "2026-11-24", poids_kg: 81.2 }];
    expect(peseesAImporter(mesures, existantes, PARIS)).toEqual([{ pese_le: "2026-11-25", poids_kg: 80.8 }]);
  });

  it("garde la Pesée saisie à la main quand Health Connect donne une autre valeur le même jour", () => {
    const mesures = [{ instant: "2026-11-24T06:10:00Z", kg: 82 }];
    expect(peseesAImporter(mesures, [{ pese_le: "2026-11-24", poids_kg: 81.5 }], PARIS)).toEqual([]);
  });

  it("ignore une mesure hors des limites d'une Pesée (20 à 400 kg)", () => {
    expect(peseesAImporter([{ instant: "2026-11-24T06:10:00Z", kg: 4.2 }], [], PARIS)).toEqual([]);
  });
});
