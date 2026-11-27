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

const HEURE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Vrai si le texte est une heure au format HH:MM (« 21:00 »). */
export function estUneHeureValide(heure: string): boolean {
  return HEURE.test(heure);
}

/** L'heure et la minute d'une heure valide (« 21:00 » → 21, 0). */
export function heureEtMinute(heure: string): { heure: number; minute: number } {
  const [h = "0", m = "0"] = heure.split(":");
  return { heure: Number(h), minute: Number(m) };
}

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/** Année, mois et jour d'une Journée valide. */
const partiesDeJournee = (journee: string) => journee.split("-").map(Number) as [number, number, number];

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** « samedi 28 novembre 2026 », « vendredi 1er janvier 2027 » ; un texte invalide est renvoyé tel quel. */
export function libelleDeJournee(journee: string): string {
  if (!estUneJourneeValide(journee)) return journee;
  const [annee, mois, jour] = partiesDeJournee(journee);
  const jourDeLaSemaine = JOURS[new Date(Date.UTC(annee, mois - 1, jour)).getUTCDay()];
  return `${jourDeLaSemaine} ${jour === 1 ? "1er" : jour} ${MOIS[mois - 1]} ${annee}`;
}

/** « 3 mars 2004 », « 1er janvier 2027 » : la Journée sans le jour de la semaine, pour tenir dans un champ. */
export function libelleCourtDeJournee(journee: string): string {
  if (!estUneJourneeValide(journee)) return journee;
  const [annee, mois, jour] = partiesDeJournee(journee);
  return `${jour === 1 ? "1er" : jour} ${MOIS[mois - 1]} ${annee}`;
}

/** « 21 h 00 », « 7 h 05 » ; un texte invalide est renvoyé tel quel. */
export function libelleDHeure(heure: string): string {
  if (!estUneHeureValide(heure)) return heure;
  const { heure: h, minute } = heureEtMinute(heure);
  return `${h} h ${deuxChiffres(minute)}`;
}

/** La Journée d'une date, lue dans le fuseau du téléphone (celui où le sélecteur de date l'a créée). */
export function versJournee(date: Date): string {
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;
}

/** Une Journée valide en date locale, à midi (pour ouvrir le sélecteur de date sur ce jour). */
export function depuisJournee(journee: string): Date {
  const [annee, mois, jour] = partiesDeJournee(journee);
  return new Date(annee, mois - 1, jour, 12);
}

/** L'heure HH:MM d'une date, lue dans le fuseau du téléphone. */
export function versHeure(date: Date): string {
  return `${deuxChiffres(date.getHours())}:${deuxChiffres(date.getMinutes())}`;
}
