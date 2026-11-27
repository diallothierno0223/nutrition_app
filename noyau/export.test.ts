import { describe, expect, it } from "vitest";
import {
  fichierDePhotoExportee,
  ligneDePhotoExportee,
  nomDuFichierDExport,
  photosDesRepas,
  versCsv,
} from "./index.ts";

const BOM = "﻿";

describe("versCsv", () => {
  it("écrit l'en-tête puis une ligne par enregistrement, séparés par des points-virgules", () => {
    const csv = versCsv([
      { journee: "2026-11-27", poids_kg: 72.5 },
      { journee: "2026-11-28", poids_kg: 72.1 },
    ]);
    expect(csv).toBe(`${BOM}journee;poids_kg\r\n2026-11-27;72.5\r\n2026-11-28;72.1\r\n`);
  });

  it("met entre guillemets les cellules contenant un séparateur, un guillemet ou un retour à la ligne", () => {
    const csv = versCsv([{ texte: 'riz; "jollof"\nbien cuit' }]);
    expect(csv).toBe(`${BOM}texte\r\n"riz; ""jollof""\nbien cuit"\r\n`);
  });

  it("laisse vides les valeurs absentes, joint les listes et écrit les objets en JSON", () => {
    const csv = versCsv([
      { a: null, b: ["Laver", "Cuire"], c: { soir: { heure: "21:00" } }, d: true },
      { a: 1, e: "nouvelle colonne" },
    ]);
    expect(csv).toBe(
      `${BOM}a;b;c;d;e\r\n;Laver | Cuire;"{""soir"":{""heure"":""21:00""}}";true;\r\n1;;;;nouvelle colonne\r\n`,
    );
  });

  it("donne un fichier vide (avec le BOM) quand il n'y a rien à exporter", () => {
    expect(versCsv([])).toBe(BOM);
  });
});

describe("nomDuFichierDExport", () => {
  it("porte la Journée de l'export", () => {
    expect(nomDuFichierDExport("2026-11-27")).toBe("suivi-nutritionnel-2026-11-27.zip");
  });
});

describe("fichierDePhotoExportee", () => {
  it("range la photo dans photos/, nommée par sa Journée puis son Repas", () => {
    expect(fichierDePhotoExportee("2026-11-27", "8f1c")).toBe("photos/2026-11-27_8f1c.jpg");
  });
});

describe("photosDesRepas", () => {
  it("garde les Repas qui ont une photo, avec leur Journée et le chemin de la photo", () => {
    expect(
      photosDesRepas([
        { id: "r1", journee: "2026-11-27", photo_chemin: "u/a.jpg" },
        { id: "r2", journee: "2026-11-27", photo_chemin: null },
      ]),
    ).toEqual([{ repasId: "r1", journee: "2026-11-27", chemin: "u/a.jpg" }]);
  });
});

describe("ligneDePhotoExportee", () => {
  const photo = { repasId: "r1", journee: "2026-11-27", chemin: "u/a.jpg" };

  it("indique le fichier de la photo dans le ZIP, et son lien", () => {
    expect(ligneDePhotoExportee(photo, true, "https://lien")).toEqual({
      repas_id: "r1",
      journee: "2026-11-27",
      chemin: "u/a.jpg",
      fichier: "photos/2026-11-27_r1.jpg",
      lien_valable_7_jours: "https://lien",
    });
  });

  it("laisse le fichier vide quand la photo n'est pas dans le ZIP", () => {
    expect(ligneDePhotoExportee(photo, false, "").fichier).toBe("");
  });
});
