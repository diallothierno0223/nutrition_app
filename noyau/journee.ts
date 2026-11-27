/** Type de repas, déduit de l'heure locale (modifiable par l'utilisateur). */
export type TypeDeRepas = "petit_dejeuner" | "dejeuner" | "collation" | "diner";

const LIBELLES_TYPES: Record<TypeDeRepas, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  collation: "Collation",
  diner: "Dîner",
};

export const TYPES_DE_REPAS = Object.keys(LIBELLES_TYPES) as readonly TypeDeRepas[];

export function libelleDuTypeDeRepas(type: TypeDeRepas): string {
  return LIBELLES_TYPES[type];
}

function partiesLocales(instant: Date, fuseau: string) {
  const parties = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const valeur = (type: Intl.DateTimeFormatPartTypes) => parties.find((p) => p.type === type)?.value ?? "";
  return { annee: valeur("year"), mois: valeur("month"), jour: valeur("day"), heure: Number(valeur("hour")) };
}

/** Vrai si le texte est une date réelle au format AAAA-MM-JJ (« 2026-02-30 » est refusé). */
export function estUneJourneeValide(texte: string): boolean {
  const morceaux = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texte);
  if (!morceaux) return false;
  const [annee, mois, jour] = morceaux.slice(1).map(Number) as [number, number, number];
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  return date.getUTCFullYear() === annee && date.getUTCMonth() === mois - 1 && date.getUTCDate() === jour;
}

/** La Journée (AAAA-MM-JJ, de 00 h 00 à 23 h 59 dans le fuseau donné) à laquelle un instant est rattaché. */
export function journeeDe(instant: Date, fuseau: string): string {
  const { annee, mois, jour } = partiesLocales(instant, fuseau);
  return `${annee}-${mois}-${jour}`;
}

/** L'heure locale (0 à 23) d'un instant dans le fuseau donné. */
export function heureDe(instant: Date, fuseau: string): number {
  return partiesLocales(instant, fuseau).heure;
}

/** Avant 11 h : petit-déjeuner ; 11 h–16 h : déjeuner ; 16 h–18 h : collation ; à partir de 18 h : dîner. */
export function typeDeRepas(instant: Date, fuseau: string): TypeDeRepas {
  const { heure } = partiesLocales(instant, fuseau);
  if (heure < 11) return "petit_dejeuner";
  if (heure < 16) return "dejeuner";
  if (heure < 18) return "collation";
  return "diner";
}
