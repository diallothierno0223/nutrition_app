/** Type de repas, déduit de l'heure locale (modifiable par l'utilisateur). */
export type TypeDeRepas = "petit_dejeuner" | "dejeuner" | "collation" | "diner";

const LIBELLES_TYPES: Record<TypeDeRepas, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  collation: "Collation",
  diner: "Dîner",
};

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

/** La Journée (AAAA-MM-JJ, de 00 h 00 à 23 h 59 dans le fuseau donné) à laquelle un instant est rattaché. */
export function journeeDe(instant: Date, fuseau: string): string {
  const { annee, mois, jour } = partiesLocales(instant, fuseau);
  return `${annee}-${mois}-${jour}`;
}

/** Avant 11 h : petit-déjeuner ; 11 h–16 h : déjeuner ; 16 h–18 h : collation ; à partir de 18 h : dîner. */
export function typeDeRepas(instant: Date, fuseau: string): TypeDeRepas {
  const { heure } = partiesLocales(instant, fuseau);
  if (heure < 11) return "petit_dejeuner";
  if (heure < 16) return "dejeuner";
  if (heure < 18) return "collation";
  return "diner";
}
