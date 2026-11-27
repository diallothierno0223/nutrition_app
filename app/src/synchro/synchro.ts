// Synchro de l'app (ADR 0002) : lectures mises en cache, file d'envoi et rejeu automatique.
// - Chaque lecture essaie le serveur ; sans réseau (ou s'il tarde), elle rend la dernière valeur en cache.
// - Les actions permises hors ligne passent par la file d'envoi, vidée aussitôt que possible.
// - Le rejeu repart à l'ouverture, au retour de l'app au premier plan et toutes les 30 s tant que la file n'est pas vide.
// - Le cache appartient au compte connecté : si un autre compte se connecte, il est vidé.
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

import { supabase } from "@/lib/supabase";
import { ouvrirBaseLocale } from "@/synchro/base-locale-expo";
import type { BaseLocale } from "@/synchro/base-locale";
import { ouvrirCacheLocal, type CacheLocal } from "@/synchro/cache-local";
import type { Envoi } from "@/synchro/envois";
import { executerEnvoi } from "@/synchro/executer";
import { rejouer } from "@/synchro/rejeu";
import { estErreurReseau } from "@/synchro/reseau";

const INTERVALLE_DE_REJEU_MS = 30_000;
/** Au-delà, l'écran n'attend plus le serveur : il montre le cache, mis à jour dès que la réponse arrive. */
const DELAI_DE_LECTURE_MS = 3_000;

export type EtatDeSynchro = {
  /** La dernière requête n'a pas atteint le serveur : l'écran montre des données en cache. */
  horsLigne: boolean;
  derniereSynchro: Date | null;
  /** Actions encore dans la file d'envoi. */
  enAttente: number;
};

let etat: EtatDeSynchro = { horsLigne: false, derniereSynchro: null, enAttente: 0 };
const abonnes = new Set<() => void>();
const apresRejeu = new Set<() => void>();

function changerEtat(changement: Partial<EtatDeSynchro>) {
  etat = { ...etat, ...changement };
  for (const abonne of abonnes) abonne();
}

let base: Promise<BaseLocale> | null = null;
let ouverture: { utilisateur: string; cache: Promise<CacheLocal> } | null = null;

/** Le cache du compte connecté (lu dans la session locale, sans réseau). */
async function cache(): Promise<CacheLocal> {
  const { data } = await supabase.auth.getSession();
  const utilisateur = data.session?.user.id ?? "";
  if (ouverture?.utilisateur !== utilisateur) {
    base ??= ouvrirBaseLocale();
    const ouvert = base.then(ouvrirCacheLocal).then(async (c) => {
      if (utilisateur) await c.reserverA(utilisateur);
      changerEtat({ derniereSynchro: await c.derniereSynchro(), enAttente: (await c.envoisEnAttente()).length });
      return c;
    });
    ouverture = { utilisateur, cache: ouvert };
  }
  return ouverture.cache;
}

/** L'état de la synchro, pour afficher « hors ligne · dernière synchro à HH:MM ». */
export function useEtatDeSynchro(): EtatDeSynchro {
  return useSyncExternalStore(
    (abonne) => {
      abonnes.add(abonne);
      return () => {
        abonnes.delete(abonne);
      };
    },
    () => etat,
  );
}

/** Appelé après chaque rejeu qui a envoyé quelque chose : l'écran recharge les vraies valeurs du serveur. */
export function surRejeu(rappel: () => void): () => void {
  apresRejeu.add(rappel);
  return () => {
    apresRejeu.delete(rappel);
  };
}

const TROP_LONG = Symbol("trop long");

/**
 * Lit sur le serveur et garde le résultat en cache. Sans réseau, rend la dernière valeur en cache ; si le serveur tarde
 * (réseau faible), aussi, et la réponse, quand elle arrive, met le cache à jour pour la lecture suivante.
 * Une autre erreur (refus du serveur), ou l'absence de valeur en cache, remonte telle quelle.
 */
export async function lectureEnCache<T>(cle: string, lire: () => Promise<T>): Promise<T> {
  const lecture = lire().then(async (valeur) => {
    const maintenant = new Date();
    changerEtat({ horsLigne: false, derniereSynchro: maintenant });
    try {
      const c = await cache();
      await c.ecrireLecture(cle, valeur, maintenant);
      await c.noterSynchro(maintenant);
    } catch (e) {
      console.warn("cache non mis à jour :", e);
    }
    return valeur;
  });
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const delai = new Promise<typeof TROP_LONG>((resoudre) => {
    minuterie = setTimeout(() => resoudre(TROP_LONG), DELAI_DE_LECTURE_MS);
  });

  try {
    const premiere = await Promise.race([lecture, delai]);
    if (premiere !== TROP_LONG) return premiere;
    const enCache = await (await cache()).lireLecture<T>(cle);
    if (!enCache) return await lecture;
    lecture.catch(() => undefined); // La réponse tardive ne sert plus qu'au cache.
    return enCache.valeur;
  } catch (erreur) {
    if (!estErreurReseau(erreur)) throw erreur;
    changerEtat({ horsLigne: true });
    const enCache = await (await cache()).lireLecture<T>(cle);
    if (!enCache) throw erreur;
    return enCache.valeur;
  } finally {
    clearTimeout(minuterie);
  }
}

/** Les actions encore en file, pour les ajouter aux valeurs en cache (eau, jauges, coches, Repas en attente). */
export async function envoisEnFile(): Promise<Envoi[]> {
  return (await (await cache()).envoisEnAttente()).map((e) => e.envoi);
}

let rejeuEnCours: Promise<void> | null = null;
let relancerApres = false;

async function unRejeu(): Promise<void> {
  const c = await cache();
  const bilan = await rejouer(c, executerEnvoi, estErreurReseau);
  changerEtat({ enAttente: bilan.restants, ...(bilan.horsLigne ? { horsLigne: true } : {}) });
  if (bilan.envoyes > 0) for (const rappel of apresRejeu) rappel();
}

/**
 * Vide la file d'envoi dans l'ordre ; un seul rejeu à la fois. Une action mise en file pendant un rejeu est envoyée
 * par un nouveau tour, juste après.
 */
export function lancerRejeu(): Promise<void> {
  if (rejeuEnCours) {
    relancerApres = true;
    return rejeuEnCours;
  }
  rejeuEnCours = (async () => {
    try {
      do {
        relancerApres = false;
        await unRejeu();
      } while (relancerApres);
    } catch (e) {
      console.warn("rejeu interrompu :", e);
    } finally {
      rejeuEnCours = null;
    }
  })();
  return rejeuEnCours;
}

/**
 * Met l'action en file et lance son envoi. Par défaut sans l'attendre : l'écran l'affiche aussitôt (les envois en
 * file s'ajoutent au cache), et `surRejeu` prévient quand le serveur l'a reçue. Avec `attendre`, rend la main une fois
 * l'envoi tenté (avant d'ouvrir la fiche du Repas créé, par exemple). Ne lève jamais pour une absence de réseau.
 */
export async function envoyer(envoi: Envoi, { attendre = false } = {}): Promise<void> {
  const c = await cache();
  await c.mettreEnFile(envoi);
  changerEtat({ enAttente: (await c.envoisEnAttente()).length });
  const rejeu = lancerRejeu();
  if (attendre) await rejeu;
}

/**
 * Retire de la file une action pas encore partie ; false si elle n'y est plus (déjà envoyée). Le rejeu en cours est
 * attendu d'abord, pour ne jamais retirer une action en train de partir.
 */
export async function annulerEnvoi(trouver: (envoi: Envoi) => boolean): Promise<boolean> {
  if (rejeuEnCours) await rejeuEnCours;
  const c = await cache();
  const enAttente = await c.envoisEnAttente();
  const cible = [...enAttente].reverse().find((e) => trouver(e.envoi));
  if (!cible) return false;
  await c.retirerEnvoi(cible.id);
  changerEtat({ enAttente: enAttente.length - 1 });
  return true;
}

/** Démarre le rejeu automatique et le préchargement du cache ; renvoie de quoi les arrêter (déconnexion). */
export function demarrerSynchro(prechargement: () => Promise<void>): () => void {
  const aLOuverture = async () => {
    await lancerRejeu();
    await prechargement().catch((e) => console.warn("préchargement du cache incomplet :", e));
  };
  aLOuverture();
  const abonnement = AppState.addEventListener("change", (statut) => {
    if (statut === "active") aLOuverture();
  });
  const minuterie = setInterval(() => {
    if (etat.enAttente > 0) lancerRejeu();
  }, INTERVALLE_DE_REJEU_MS);
  return () => {
    abonnement.remove();
    clearInterval(minuterie);
  };
}
