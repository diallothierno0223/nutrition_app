// Rendez-vous du samedi (voir GLOSSARY.md) : samedi de référence, Période d'analyse, règle de variété,
// lecture défensive de la réponse de l'IA et nutriments par portion.
import { lireConstituant } from "./analyse.ts";
import { heureDe, journeeDe } from "./journee.ts";
import { NUTRIMENTS } from "./nutriments.ts";
import { totauxDuRepas, type Constituant, type ValeursNutritionnelles } from "./repas.ts";
import { ajouterJours } from "./semaine.ts";

/** L'heure locale à partir de laquelle le Rendez-vous du samedi est dû. */
export const HEURE_DU_RENDEZ_VOUS = 6;

/** Nombre de semaines pendant lesquelles une Recette n'est pas reproposée (sauf « à refaire »). */
export const SEMAINES_SANS_REPETITION = 3;

/** Les nombres du Rendez-vous, modifiables dans les Réglages. */
export type ReglagesDuSamedi = {
  /** Recettes de déjeuners et dîners. */
  recettes: number;
  /** Portions couvertes par l'ensemble de ces Recettes. */
  portions: number;
  /** Portions de la Recette de Petit-déjeuner nomade. */
  portionsNomade: number;
  /** Matins couverts par les idées de petit-déjeuner rapide. */
  matinsRapides: number;
};

export const REGLAGES_DU_SAMEDI_PAR_DEFAUT: ReglagesDuSamedi = {
  recettes: 3,
  portions: 10,
  portionsNomade: 3,
  matinsRapides: 4,
};

/** Nombre d'idées de petit-déjeuner rapide (elles couvrent les matins rapides à elles deux). */
export const IDEES_RAPIDES = 2;

export const CATEGORIES_DE_RECETTE = ["repas", "petit_dejeuner_nomade", "petit_dejeuner_rapide"] as const;
export type CategorieDeRecette = (typeof CATEGORIES_DE_RECETTE)[number];

const LIBELLES_CATEGORIES: Record<CategorieDeRecette, string> = {
  repas: "Déjeuners et dîners",
  petit_dejeuner_nomade: "Petit-déjeuner nomade",
  petit_dejeuner_rapide: "Petit-déjeuner rapide",
};

export function libelleDeCategorieDeRecette(categorie: CategorieDeRecette): string {
  return LIBELLES_CATEGORIES[categorie];
}

/** Une Recette suggérée : ses ingrédients (avec leurs nutriments, pour toute la Recette) et ses consignes. */
export type Recette = {
  nom: string;
  categorie: CategorieDeRecette;
  portions: number;
  ingredients: Constituant[];
  etapes: string[];
  conservation: string;
  ordre_conseille: string;
};

/** Ce que l'IA renvoie pour un Rendez-vous du samedi. */
export type RendezVousGenere = { bilan: string; recettes: Recette[] };

const SAMEDI = 6; // getUTCDay()

/**
 * Le samedi auquel se rattache le Rendez-vous « en cours » : le samedi même à partir de 6 h (heure locale),
 * sinon le samedi précédent.
 */
export function samediDeReference(maintenant: Date, fuseau: string): string {
  const journee = journeeDe(maintenant, fuseau);
  const jour = new Date(`${journee}T00:00:00Z`).getUTCDay();
  const ecart = (jour - SAMEDI + 7) % 7;
  if (ecart === 0 && heureDe(maintenant, fuseau) < HEURE_DU_RENDEZ_VOUS) return ajouterJours(journee, -7);
  return ajouterJours(journee, -ecart);
}

/** Les 7 Journées qui précèdent le samedi (du samedi précédent au vendredi). */
export function periodeDAnalyse(samedi: string): string[] {
  return Array.from({ length: 7 }, (_, i) => ajouterJours(samedi, i - 7));
}

const normaliser = (nom: string) => nom.trim().toLocaleLowerCase("fr-FR");

export type RecetteDejaProposee = { nom: string; samedi: string; a_refaire: boolean };

/**
 * Les Recettes de déjeuners et dîners à ne pas reproposer (l'historique ne contient qu'elles) : celles des 3 semaines précédentes (et de la semaine en cours, en cas de
 * nouvelle génération), sauf celles marquées « à refaire ». Noms d'origine, sans doublon.
 */
export function recettesInterdites(historique: readonly RecetteDejaProposee[], samedi: string): string[] {
  const debut = ajouterJours(samedi, -7 * SEMAINES_SANS_REPETITION);
  const recentes = historique.filter((r) => r.samedi >= debut && r.samedi <= samedi);
  const aRefaire = new Set(historique.filter((r) => r.a_refaire).map((r) => normaliser(r.nom)));
  const interdites = new Map<string, string>();
  for (const r of recentes) {
    const cle = normaliser(r.nom);
    if (!aRefaire.has(cle) && !interdites.has(cle)) interdites.set(cle, r.nom);
  }
  return [...interdites.values()];
}

class RendezVousInvalide extends Error {
  constructor(detail: string) {
    super(`Rendez-vous de l'IA invalide : ${detail}`);
    this.name = "RendezVousInvalide";
  }
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function texteNonVide(objet: Record<string, unknown>, champ: string): string {
  const v = objet[champ];
  if (typeof v !== "string" || v.trim() === "") throw new RendezVousInvalide(`« ${champ} » doit être un texte`);
  return v.trim();
}

function lireRecette(brut: unknown): Recette {
  if (!estObjet(brut)) throw new RendezVousInvalide("une Recette doit être un objet");
  const categorie = brut.categorie;
  if (!CATEGORIES_DE_RECETTE.includes(categorie as CategorieDeRecette)) {
    throw new RendezVousInvalide("catégorie de Recette inconnue");
  }
  const portions = brut.portions;
  if (typeof portions !== "number" || !Number.isInteger(portions) || portions <= 0) {
    throw new RendezVousInvalide("« portions » doit être un entier positif");
  }
  const { ingredients, etapes } = brut;
  if (!Array.isArray(ingredients) || ingredients.length === 0) throw new RendezVousInvalide("il faut des ingrédients");
  if (!Array.isArray(etapes) || etapes.length === 0 || !etapes.every((e) => typeof e === "string" && e.trim())) {
    throw new RendezVousInvalide("il faut des étapes");
  }
  return {
    nom: texteNonVide(brut, "nom"),
    categorie: categorie as CategorieDeRecette,
    portions,
    ingredients: ingredients.map(lireConstituant),
    etapes: etapes.map((e: string) => e.trim()),
    conservation: texteNonVide(brut, "conservation"),
    ordre_conseille: texteNonVide(brut, "ordre_conseille"),
  };
}

/**
 * Valide la réponse brute de l'IA : nombres conformes aux Réglages du samedi et règle de variété respectée.
 * Lève une erreur si elle est inutilisable.
 */
export function lireRendezVous(
  brut: unknown,
  reglages: ReglagesDuSamedi,
  interdites: readonly string[],
): RendezVousGenere {
  if (!estObjet(brut) || !Array.isArray(brut.recettes)) throw new RendezVousInvalide("« recettes » manquant");
  const bilan = texteNonVide(brut, "bilan");
  const recettes = brut.recettes.map(lireRecette);

  const de = (categorie: CategorieDeRecette) => recettes.filter((r) => r.categorie === categorie);
  const repas = de("repas");
  const nomades = de("petit_dejeuner_nomade");
  if (repas.length !== reglages.recettes) throw new RendezVousInvalide(`il faut ${reglages.recettes} Recettes`);
  if (repas.reduce((total, r) => total + r.portions, 0) !== reglages.portions) {
    throw new RendezVousInvalide(`les Recettes doivent couvrir ${reglages.portions} portions`);
  }
  if (nomades.length !== 1 || nomades[0]?.portions !== reglages.portionsNomade) {
    throw new RendezVousInvalide(`il faut un Petit-déjeuner nomade de ${reglages.portionsNomade} portions`);
  }
  if (de("petit_dejeuner_rapide").length !== IDEES_RAPIDES) {
    throw new RendezVousInvalide(`il faut ${IDEES_RAPIDES} idées de petit-déjeuner rapide`);
  }

  // La variété porte sur les Recettes de déjeuners et dîners ; les petits-déjeuners peuvent revenir.
  const interditesNormalisees = new Set(interdites.map(normaliser));
  const repetee = repas.find((r) => interditesNormalisees.has(normaliser(r.nom)));
  if (repetee) throw new RendezVousInvalide(`« ${repetee.nom} » a déjà été proposée ces dernières semaines`);

  return { bilan, recettes };
}

/** Les nutriments d'une portion de Recette : ceux de tous ses ingrédients, divisés par le nombre de portions. */
export function nutrimentsParPortion(recette: Pick<Recette, "ingredients" | "portions">): ValeursNutritionnelles {
  const total = totauxDuRepas(recette.ingredients);
  return Object.fromEntries(
    NUTRIMENTS.map((n) => [n, Math.round((total[n] / recette.portions) * 100) / 100]),
  ) as ValeursNutritionnelles;
}
