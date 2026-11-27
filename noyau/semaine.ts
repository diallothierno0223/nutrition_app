// Semaine (lundi–dimanche), Objectif hebdomadaire et moyenne globale (voir GLOSSARY.md).
// Les Journées sont des dates AAAA-MM-JJ déjà rattachées au bon fuseau : le calcul se fait en UTC, à l'abri
// des changements d'heure.
import type { ObjectifsJournaliers } from "./jauges.ts";
import { NUTRIMENTS } from "./nutriments.ts";
import type { ValeursNutritionnelles } from "./repas.ts";

const UN_JOUR = 24 * 60 * 60 * 1000;

const versDate = (journee: string) => new Date(`${journee}T00:00:00Z`);
const versJournee = (date: Date) => date.toISOString().slice(0, 10);

/** La Journée `n` jours après (ou avant, si `n` est négatif). */
export function ajouterJours(journee: string, n: number): string {
  return versJournee(new Date(versDate(journee).getTime() + n * UN_JOUR));
}

/** Le lundi de la Semaine d'une Journée. */
export function lundiDe(journee: string): string {
  const jourDeLaSemaine = (versDate(journee).getUTCDay() + 6) % 7; // lundi = 0 … dimanche = 6
  return ajouterJours(journee, -jourDeLaSemaine);
}

/** Les 7 Journées (lundi → dimanche) de la Semaine d'une Journée. */
export function journeesDeLaSemaine(journee: string): string[] {
  const lundi = lundiDe(journee);
  return Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i));
}

/** L'Objectif hebdomadaire : l'Objectif journalier × 7 (jamais saisi directement). */
export function objectifsHebdomadaires(journaliers: ObjectifsJournaliers): ObjectifsJournaliers {
  return Object.fromEntries(
    NUTRIMENTS.map((n) => {
      const objectif = journaliers[n];
      return [n, objectif === null ? null : Math.round(objectif * 7 * 100) / 100];
    }),
  ) as ObjectifsJournaliers;
}

export const PERIODES_DE_MOYENNE = ["30_jours", "90_jours", "tout"] as const;
export type PeriodeDeMoyenne = (typeof PERIODES_DE_MOYENNE)[number];

const LIBELLES_PERIODES: Record<PeriodeDeMoyenne, string> = {
  "30_jours": "30 jours",
  "90_jours": "90 jours",
  tout: "Tout",
};

export function libelleDePeriode(periode: PeriodeDeMoyenne): string {
  return LIBELLES_PERIODES[periode];
}

/** La première Journée de la période (aujourd'hui compris), ou null pour tout l'historique. */
export function debutDePeriode(aujourdhui: string, periode: PeriodeDeMoyenne): string | null {
  if (periode === "tout") return null;
  return ajouterJours(aujourdhui, -(periode === "30_jours" ? 29 : 89));
}

/**
 * La moyenne par Journée, sur les seules Journées où au moins un Repas est enregistré (celles qu'on lui passe) :
 * un jour oublié ne fait pas baisser la moyenne.
 */
export function moyenneGlobale(totauxParJournee: readonly ValeursNutritionnelles[]): {
  moyenne: ValeursNutritionnelles | null;
  nombreDeJournees: number;
} {
  const nombreDeJournees = totauxParJournee.length;
  if (nombreDeJournees === 0) return { moyenne: null, nombreDeJournees };
  const moyenne = Object.fromEntries(
    NUTRIMENTS.map((n) => {
      const somme = totauxParJournee.reduce((total, jour) => total + jour[n], 0);
      return [n, Math.round((somme / nombreDeJournees) * 100) / 100];
    }),
  ) as ValeursNutritionnelles;
  return { moyenne, nombreDeJournees };
}
