// Liste de courses (voir GLOSSARY.md) : rangée par Recette (Recettes, puis petits-déjeuners, puis Ajouts manuels).
// Un ingrédient commun reste dans chaque Recette avec sa propre case, et affiche le total des Recettes sélectionnées.
// La liste est recalculée à partir de l'état (sélection, cases, ajouts) : rien ne se perd quand on change la sélection.
import { formaterNombre } from "./affichage.ts";
import type { Unite } from "./repas.ts";
import type { CategorieDeRecette } from "./samedi.ts";

export type IngredientPourCourses = {
  id: string;
  nom: string;
  quantite: number;
  unite: Unite;
  equivalent_cuisine: string;
  coche: boolean;
};

export type RecettePourCourses = {
  id: string;
  nom: string;
  categorie: CategorieDeRecette;
  /** Recette incluse dans la Liste de courses (toutes par défaut). */
  dans_la_liste: boolean;
  ingredients: IngredientPourCourses[];
};

export type AjoutManuel = { id: string; nom: string; coche: boolean };

export type LigneDeCourses = {
  id: string;
  nom: string;
  /** « 150 g (1 oignon) » ; vide pour un ajout manuel. */
  detail: string;
  coche: boolean;
  /** « 500 g au total » quand l'ingrédient revient dans plusieurs Recettes sélectionnées ; null sinon. */
  total: string | null;
  manuel: boolean;
};

export type SectionDeCourses = { titre: string; lignes: LigneDeCourses[] };

export const TITRE_AJOUTS_MANUELS = "Ajouts manuels";

const cle = (nom: string, unite: Unite) => `${nom.trim().toLocaleLowerCase("fr-FR")}|${unite}`;
const enFrancais = (n: number) => formaterNombre(n);

export function construireListeDeCourses(
  recettes: readonly RecettePourCourses[],
  ajouts: readonly AjoutManuel[],
): SectionDeCourses[] {
  const ordre = (c: CategorieDeRecette) => (c === "repas" ? 0 : 1);
  const selectionnees = recettes
    .map((recette, rang) => ({ recette, rang }))
    .filter(({ recette }) => recette.dans_la_liste)
    .sort((a, b) => ordre(a.recette.categorie) - ordre(b.recette.categorie) || a.rang - b.rang)
    .map(({ recette }) => recette);

  // Totaux par ingrédient (même nom, même unité) sur les Recettes sélectionnées.
  const totaux = new Map<string, { quantite: number; recettes: Set<string> }>();
  for (const recette of selectionnees) {
    for (const i of recette.ingredients) {
      const entree = totaux.get(cle(i.nom, i.unite)) ?? { quantite: 0, recettes: new Set<string>() };
      entree.quantite += i.quantite;
      entree.recettes.add(recette.id);
      totaux.set(cle(i.nom, i.unite), entree);
    }
  }

  const sections: SectionDeCourses[] = selectionnees.map((recette) => ({
    titre: recette.nom,
    lignes: recette.ingredients.map((i) => {
      const total = totaux.get(cle(i.nom, i.unite));
      return {
        id: i.id,
        nom: i.nom.trim(),
        detail: `${enFrancais(i.quantite)} ${i.unite}${i.equivalent_cuisine ? ` (${i.equivalent_cuisine})` : ""}`,
        coche: i.coche,
        total: total && total.recettes.size > 1 ? `${enFrancais(total.quantite)} ${i.unite} au total` : null,
        manuel: false,
      };
    }),
  }));

  if (ajouts.length > 0) {
    sections.push({
      titre: TITRE_AJOUTS_MANUELS,
      lignes: ajouts.map((a) => ({ id: a.id, nom: a.nom, detail: "", coche: a.coche, total: null, manuel: true })),
    });
  }
  return sections;
}
