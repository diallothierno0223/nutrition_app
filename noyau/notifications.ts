// Notifications locales : réglages (heure, activée) et contenu, calculé à partir de la Journée en cours.
import { objectifsRestants, type ObjectifsJournaliers } from "./jauges.ts";
import { NUTRIMENTS, libelleDuNutriment, sensDuNutriment, uniteDuNutriment, type Nutriment } from "./nutriments.ts";
import { estUneHeureValide } from "./journee.ts";
import type { ValeursNutritionnelles } from "./repas.ts";

export const TYPES_DE_NOTIFICATION = ["matin", "midi", "soir", "samedi"] as const;
export type TypeDeNotification = (typeof TYPES_DE_NOTIFICATION)[number];

const LIBELLES: Record<TypeDeNotification, string> = {
  matin: "Matin (petit-déjeuner, eau)",
  midi: "Midi (saisie du déjeuner)",
  soir: "Soir (quotas restants)",
  samedi: "Samedi (Rendez-vous)",
};

export function libelleDeNotification(type: TypeDeNotification): string {
  return LIBELLES[type];
}

/** Heure au format HH:MM, dans le fuseau du téléphone. */
export type ReglageDeNotification = { heure: string; active: boolean };
export type ReglagesDesNotifications = Record<TypeDeNotification, ReglageDeNotification>;

export const NOTIFICATIONS_PAR_DEFAUT: ReglagesDesNotifications = {
  matin: { heure: "10:00", active: true },
  midi: { heure: "14:00", active: true },
  soir: { heure: "21:00", active: true },
  samedi: { heure: "09:00", active: true },
};

/** Lit les réglages enregistrés ; tout réglage absent ou invalide prend sa valeur par défaut. */
export function lireReglagesDesNotifications(brut: unknown): ReglagesDesNotifications {
  const source = typeof brut === "object" && brut !== null ? (brut as Record<string, unknown>) : {};
  return Object.fromEntries(
    TYPES_DE_NOTIFICATION.map((type) => {
      const r = source[type] as Partial<ReglageDeNotification> | undefined;
      const valide = typeof r?.heure === "string" && estUneHeureValide(r.heure) && typeof r.active === "boolean";
      return [type, valide ? { heure: r.heure, active: r.active } : NOTIFICATIONS_PAR_DEFAUT[type]];
    }),
  ) as ReglagesDesNotifications;
}

export type ContexteDuJour = {
  totaux: ValeursNutritionnelles;
  objectifs: ObjectifsJournaliers;
  eauMl: number;
  objectifEauMl: number | null;
};

export type ContenuDeNotification = { titre: string; corps: string };

/** « 3,8 » ; les calories à l'unité, le reste au dixième (sans décimale inutile). */
function quantite(nutriment: Nutriment, valeur: number): string {
  const arrondie = uniteDuNutriment(nutriment) === "kcal" ? Math.round(valeur) : Math.round(valeur * 10) / 10;
  return String(arrondie).replace(".", ",");
}

/** « AGS » reste en capitales, les autres libellés passent en minuscules dans une phrase. */
const enMinuscules = (n: Nutriment) => {
  const libelle = libelleDuNutriment(n);
  return libelle === libelle.toUpperCase() ? libelle : libelle.toLocaleLowerCase("fr-FR");
};

const litres = (ml: number) => `${String(Math.round(ml / 10) / 100).replace(".", ",")} L`;

function contenuDuSoir({ totaux, objectifs, eauMl, objectifEauMl }: ContexteDuJour): string {
  const restants = objectifsRestants(objectifs, totaux);
  const reste: string[] = [];
  const aCompleter: string[] = [];
  const depasses: string[] = [];

  for (const n of NUTRIMENTS) {
    const r = restants[n];
    if (r === null) continue;
    const sens = sensDuNutriment(n);
    if (sens === "cible") {
      if (r > 0) aCompleter.push(`${enMinuscules(n)} ${quantite(n, r)} ${uniteDuNutriment(n)}`);
    } else if (r > 0) {
      reste.push(n === "calories" ? `${quantite(n, r)} kcal` : `${enMinuscules(n)} ${quantite(n, r)} ${uniteDuNutriment(n)}`);
    } else if (sens === "plafond" && r < 0) {
      depasses.push(enMinuscules(n));
    }
  }

  const lignes: string[] = [];
  if (reste.length > 0) lignes.push(`Reste : ${reste.join(", ")}.`);
  if (aCompleter.length > 0) lignes.push(`À compléter : ${aCompleter.join(", ")}.`);
  if (depasses.length > 0) lignes.push(`Déjà dépassé : ${depasses.join(", ")}.`);
  if (objectifEauMl !== null && eauMl < objectifEauMl) lignes.push(`Eau : encore ${litres(objectifEauMl - eauMl)}.`);
  return lignes.length > 0 ? lignes.join("\n") : "Objectifs du jour atteints.";
}

function contenuDuMatin({ objectifs }: ContexteDuJour): string {
  const reperes = [
    ...(objectifs.calories !== null ? [`${quantite("calories", objectifs.calories)} kcal`] : []),
    ...(objectifs.ags !== null ? [`AGS ${quantite("ags", objectifs.ags)} g au plus`] : []),
  ];
  return `Petit-déjeuner et un verre d'eau.${reperes.length > 0 ? ` Objectif du jour : ${reperes.join(", ")}.` : ""}`;
}

function contenuDeMidi({ eauMl, objectifEauMl }: ContexteDuJour): string {
  const eau = objectifEauMl !== null ? ` Eau : ${litres(eauMl)} sur ${litres(objectifEauMl)}.` : "";
  return `Pense à saisir ton déjeuner.${eau}`;
}

/** Le contenu d'une notification, à partir de la Journée en cours (Repas analysés, eau, Objectifs). */
export function contenuDeNotification(type: TypeDeNotification, contexte: ContexteDuJour): ContenuDeNotification {
  switch (type) {
    case "matin":
      return { titre: "Bonjour", corps: contenuDuMatin(contexte) };
    case "midi":
      return { titre: "Déjeuner", corps: contenuDeMidi(contexte) };
    case "soir":
      return { titre: "Avant le dîner", corps: contenuDuSoir(contexte) };
    case "samedi":
      return { titre: "Rendez-vous du samedi", corps: "Ton Rendez-vous du samedi t'attend." };
  }
}
