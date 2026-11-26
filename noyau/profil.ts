// Profil, formule garde-fou et Estimation des Objectifs par l'IA (ADR 0004).
import { NUTRIMENTS, type Nutriment } from "./nutriments.ts";

export const SEXES = ["homme", "femme"] as const;
export type Sexe = (typeof SEXES)[number];

export function libelleDuSexe(sexe: Sexe): string {
  return sexe === "homme" ? "Homme" : "Femme";
}

export const NIVEAUX_D_ACTIVITE = ["sedentaire", "leger", "modere", "actif", "tres_actif"] as const;
export type NiveauDActivite = (typeof NIVEAUX_D_ACTIVITE)[number];

const FACTEURS_D_ACTIVITE: Record<NiveauDActivite, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

const LIBELLES_D_ACTIVITE: Record<NiveauDActivite, string> = {
  sedentaire: "Sédentaire",
  leger: "Légèrement actif",
  modere: "Modérément actif",
  actif: "Actif",
  tres_actif: "Très actif",
};

export function libelleDuNiveauDActivite(niveau: NiveauDActivite): string {
  return LIBELLES_D_ACTIVITE[niveau];
}

/** Ce dont la formule garde-fou a besoin du Profil (le poids vient de la dernière Pesée). */
export type ProfilCorporel = {
  taille_cm: number;
  date_naissance: string;
  sexe: Sexe;
  niveau_activite: NiveauDActivite;
};

/** L'âge en années révolues à une Journée donnée (dates AAAA-MM-JJ). */
export function ageA(dateNaissance: string, journee: string): number {
  const [an, mois, jour] = dateNaissance.split("-").map(Number) as [number, number, number];
  const [anJ, moisJ, jourJ] = journee.split("-").map(Number) as [number, number, number];
  const anniversairePasse = moisJ > mois || (moisJ === mois && jourJ >= jour);
  return anJ - an - (anniversairePasse ? 0 : 1);
}

/** Formule garde-fou : Mifflin-St Jeor × facteur d'activité, en kcal arrondies. */
export function besoinEnergetique(profil: ProfilCorporel, poidsKg: number, journee: string): number {
  const age = ageA(profil.date_naissance, journee);
  const base = 10 * poidsKg + 6.25 * profil.taille_cm - 5 * age + (profil.sexe === "homme" ? 5 : -161);
  return Math.round(base * FACTEURS_D_ACTIVITE[profil.niveau_activite]);
}

/** Au-delà de cet écart (en %) entre les calories proposées et la formule, la proposition est signalée. */
export const SEUIL_ECART_GARDE_FOU = 20;

export function ecartAvecGardeFou(caloriesProposees: number, reference: number): { pourcentage: number; alerte: boolean } {
  const pourcentage = Math.round(((caloriesProposees - reference) * 100) / reference);
  return { pourcentage, alerte: Math.abs(pourcentage) > SEUIL_ECART_GARDE_FOU };
}

/** L'Estimation des Objectifs : une valeur et une justification par nutriment. */
export type EstimationObjectifs = Record<Nutriment, { valeur: number; justification: string }>;

class EstimationInvalide extends Error {
  constructor(detail: string) {
    super(`Estimation des Objectifs invalide : ${detail}`);
    this.name = "EstimationInvalide";
  }
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Valide la réponse brute de l'IA ; lève une erreur si un nutriment manque ou est incohérent. */
export function lireEstimationObjectifs(brut: unknown): EstimationObjectifs {
  if (!estObjet(brut) || !estObjet(brut.objectifs)) throw new EstimationInvalide("« objectifs » manquant");
  const objectifs = brut.objectifs;
  const estimation = {} as EstimationObjectifs;
  for (const n of NUTRIMENTS) {
    const entree = objectifs[n];
    if (!estObjet(entree)) throw new EstimationInvalide(`« ${n} » manquant`);
    const { valeur, justification } = entree;
    if (typeof valeur !== "number" || !Number.isFinite(valeur) || valeur <= 0) {
      throw new EstimationInvalide(`« ${n} » doit avoir une valeur positive`);
    }
    if (typeof justification !== "string" || justification.trim() === "") {
      throw new EstimationInvalide(`« ${n} » doit avoir une justification`);
    }
    estimation[n] = { valeur, justification: justification.trim() };
  }
  return estimation;
}

/**
 * Vrai si une source de l'estimation (Profil, Objectifs personnels, Règles du médecin) a changé après la dernière
 * mise à jour des Objectifs. Sans Objectifs, on ne parle pas de réestimation : l'écran propose une première estimation.
 */
export function reestimationAProposer(objectifsModifiesLe: string | null, sourcesModifieesLe: (string | null)[]): boolean {
  if (objectifsModifiesLe === null) return false;
  const reference = Date.parse(objectifsModifiesLe);
  return sourcesModifieesLe.some((date) => date !== null && Date.parse(date) > reference);
}
