// Hors ligne, l'écran montre la dernière valeur synchronisée, à laquelle s'ajoutent les envois encore en file.
// Au retour du réseau, les vues SQL du serveur redeviennent la référence (ADR 0002).
import {
  NUTRIMENTS,
  totauxDuRepas,
  type AjoutManuel,
  type Constituant,
  type TypeDeRepas,
  type ValeursNutritionnelles,
} from "../../../noyau/index.ts";
import type { Envoi } from "./envois.ts";

type EnvoiDe<T extends Envoi["type"]> = Extract<Envoi, { type: T }>;
const deType =
  <T extends Envoi["type"]>(type: T) =>
  (e: Envoi): e is EnvoiDe<T> =>
    e.type === type;

/** Totaux du jour + Repas enregistrés depuis un Plat hors ligne. Les Repas en attente ne comptent pas. */
export function totauxAvecEnvois(
  totaux: ValeursNutritionnelles,
  envois: readonly Envoi[],
  journee: string,
): ValeursNutritionnelles {
  const ajouts = envois.filter(deType("repas_depuis_plat")).filter((e) => e.journee === journee);
  if (ajouts.length === 0) return totaux;
  const enPlus = totauxDuRepas(ajouts.flatMap((e) => e.constituants));
  return Object.fromEntries(NUTRIMENTS.map((n) => [n, totaux[n] + enPlus[n]])) as ValeursNutritionnelles;
}

export function eauAvecEnvois(eauMl: number, envois: readonly Envoi[], journee: string): number {
  return envois
    .filter(deType("ajouter_eau"))
    .filter((e) => e.journee === journee)
    .reduce((total, e) => total + e.quantiteMl, eauMl);
}

/** Un Repas encore dans la file d'envoi, tel que le Journal l'affiche. */
export type RepasEnFile = {
  id: string;
  journee: string;
  mange_le: string;
  type_repas: TypeDeRepas;
  description: string;
  /** « analyse » : enregistré depuis un Plat (compté dans les jauges) ; « en_attente » : Repas en attente. */
  statut: "analyse" | "en_attente";
  constituants: Constituant[];
  photoLocale: string | null;
};

/** Tous les Repas encore en file, du plus ancien au plus récent. */
export function repasEnFile(envois: readonly Envoi[]): RepasEnFile[] {
  return envois
    .flatMap((e): RepasEnFile[] => {
      if (e.type !== "repas_depuis_plat" && e.type !== "repas_en_attente") return [];
      return [
        {
          id: e.id,
          journee: e.journee,
          mange_le: e.mangeLe,
          type_repas: e.typeRepas,
          description: e.description,
          statut: e.type === "repas_depuis_plat" ? "analyse" : "en_attente",
          constituants: e.type === "repas_depuis_plat" ? e.constituants : [],
          photoLocale: e.type === "repas_en_attente" ? e.photoLocale : null,
        },
      ];
    })
    .sort((a, b) => a.mange_le.localeCompare(b.mange_le));
}

export function repasEnFileDuJour(envois: readonly Envoi[], journee: string): RepasEnFile[] {
  return repasEnFile(envois).filter((r) => r.journee === journee);
}

/** Les ingrédients de la Liste de courses avec les cases cochées en file. */
export function ingredientsAvecEnvois<I extends { id: string; coche: boolean }>(ingredients: readonly I[], envois: readonly Envoi[]): I[] {
  const coches = new Map(envois.filter(deType("cocher_ingredient")).map((e) => [e.ingredientId, e.coche]));
  return ingredients.map((i) => (coches.has(i.id) ? { ...i, coche: coches.get(i.id) ?? i.coche } : i));
}

/** Les ajouts manuels d'une Liste de courses, avec les articles créés et cochés hors ligne. */
export function ajoutsManuelsAvecEnvois(ajouts: readonly AjoutManuel[], envois: readonly Envoi[], rendezVousId: string): AjoutManuel[] {
  const crees = envois
    .filter(deType("ajouter_article"))
    .filter((e) => e.rendezVousId === rendezVousId && !ajouts.some((a) => a.id === e.id))
    .map((e) => ({ id: e.id, nom: e.nom, coche: false }));
  const coches = new Map(envois.filter(deType("cocher_article")).map((e) => [e.articleId, e.coche]));
  return [...ajouts, ...crees].map((a) => (coches.has(a.id) ? { ...a, coche: coches.get(a.id) ?? a.coche } : a));
}
