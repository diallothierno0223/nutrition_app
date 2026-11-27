// Les actions permises hors ligne (ADR 0002), telles qu'elles attendent dans la file d'envoi.
// Chaque création porte un identifiant choisi par le téléphone : la rejouer ne crée jamais de doublon.
import type { Constituant, TypeDeRepas } from "../../../noyau/index.ts";

export type Envoi =
  | { type: "cocher_ingredient"; ingredientId: string; coche: boolean }
  | { type: "cocher_article"; articleId: string; coche: boolean }
  | { type: "ajouter_article"; id: string; rendezVousId: string; nom: string }
  | { type: "ajouter_eau"; id: string; quantiteMl: number; buLe: string; journee: string }
  | {
      type: "repas_depuis_plat";
      id: string;
      description: string;
      mangeLe: string;
      journee: string;
      typeRepas: TypeDeRepas;
      constituants: Constituant[];
      /** Précision à appliquer après l'enregistrement : l'analyse est alors relancée sur ces Constituants. */
      precision?: string;
    }
  | {
      /** Repas en attente (ticket 18) : saisi sans réseau, analysé au retour du réseau. */
      type: "repas_en_attente";
      id: string;
      description: string;
      /** La photo compressée, copiée dans les documents de l'app, ou null pour une saisie en texte. */
      photoLocale: string | null;
      mangeLe: string;
      journee: string;
      typeRepas: TypeDeRepas;
    };

export type TypeDEnvoi = Envoi["type"];

/**
 * Ce que l'envoi modifie. Pour une case cochée, seul le dernier état compte (la dernière écriture l'emporte) : un
 * nouvel envoi sur la même cible remplace celui qui attendait encore.
 */
export function cibleDe(envoi: Envoi): string {
  switch (envoi.type) {
    case "cocher_ingredient":
      return `ingredient:${envoi.ingredientId}`;
    case "cocher_article":
      return `article:${envoi.articleId}`;
    default:
      return `${envoi.type}:${envoi.id}`;
  }
}

/** Pour une case cochée, seul le dernier état compte : le nouvel envoi remplace celui qui attendait sur la même cible. */
export function remplaceLePrecedent(envoi: Envoi): boolean {
  return envoi.type === "cocher_ingredient" || envoi.type === "cocher_article";
}

/**
 * Nombre de refus du serveur après lequel l'envoi est abandonné.
 * - Cases cochées et articles ajoutés : `tentativesMax` (une course supprimée entre-temps, par exemple).
 * - Eau, Repas depuis un Plat, Repas en attente : jamais, ce sont des saisies de l'utilisateur. Seule exception,
 *   l'analyse d'un Repas en attente déjà enregistré sur le serveur (`repasEnregistre`) : abandonnée au bout de
 *   `2 × tentativesMax` échecs, le Repas reste visible en attente et l'analyse peut être relancée depuis sa fiche.
 */
export function limiteDeTentatives(envoi: Envoi, erreur: unknown, tentativesMax: number): number {
  switch (envoi.type) {
    case "cocher_ingredient":
    case "cocher_article":
    case "ajouter_article":
      return tentativesMax;
    case "repas_en_attente":
      return (erreur as { repasEnregistre?: unknown } | null)?.repasEnregistre === true ? 2 * tentativesMax : Infinity;
    default:
      return Infinity;
  }
}
