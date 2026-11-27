// Cache local (ADR 0002) : la dernière valeur lue de chaque donnée du quotidien et la file d'envoi des actions faites
// hors ligne. Supabase reste la seule source de vérité : chaque lecture réussie remplace la valeur en cache.
import type { BaseLocale } from "./base-locale.ts";
import { cibleDe, remplaceLePrecedent, type Envoi } from "./envois.ts";

export type Lecture<T> = { valeur: T; majLe: Date };

export type EnvoiEnAttente = {
  id: number;
  envoi: Envoi;
  tentatives: number;
  derniereErreur: string | null;
  dernierEchecLe: Date | null;
};

export interface CacheLocal {
  derniereSynchro(): Promise<Date | null>;
  noterSynchro(quand: Date): Promise<void>;
  lireLecture<T>(cle: string): Promise<Lecture<T> | null>;
  ecrireLecture(cle: string, valeur: unknown, quand?: Date): Promise<void>;
  /** Ajoute l'envoi en fin de file ; un envoi en attente sur la même case cochée est remplacé. */
  mettreEnFile(envoi: Envoi, quand?: Date): Promise<void>;
  envoisEnAttente(): Promise<EnvoiEnAttente[]>;
  retirerEnvoi(id: number): Promise<void>;
  noterEchec(id: number, erreur: string, quand?: Date): Promise<void>;
  /**
   * Réserve le cache au compte connecté. Si un autre compte l'utilisait, tout est vidé (lectures, file, dernière
   * synchro) pour ne jamais montrer ni envoyer ses données sous un autre compte ; renvoie alors true.
   */
  reserverA(utilisateurId: string): Promise<boolean>;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS meta (
    cle TEXT PRIMARY KEY NOT NULL,
    valeur TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS lectures (
    cle TEXT PRIMARY KEY NOT NULL,
    valeur TEXT NOT NULL,
    maj_le TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS envois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cible TEXT NOT NULL,
    envoi TEXT NOT NULL,
    cree_le TEXT NOT NULL,
    tentatives INTEGER NOT NULL DEFAULT 0,
    derniere_erreur TEXT,
    dernier_echec_le TEXT
  );
`;

export async function ouvrirCacheLocal(base: BaseLocale): Promise<CacheLocal> {
  await base.execAsync(SCHEMA);

  return {
    async derniereSynchro() {
      const ligne = await base.getFirstAsync<{ valeur: string }>(
        "SELECT valeur FROM meta WHERE cle = 'derniere_synchro'",
      );
      return ligne ? new Date(ligne.valeur) : null;
    },
    async noterSynchro(quand) {
      await base.runAsync(
        "INSERT INTO meta (cle, valeur) VALUES ('derniere_synchro', ?) ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur",
        quand.toISOString(),
      );
    },

    async lireLecture<T>(cle: string) {
      const ligne = await base.getFirstAsync<{ valeur: string; maj_le: string }>(
        "SELECT valeur, maj_le FROM lectures WHERE cle = ?",
        cle,
      );
      return ligne ? { valeur: JSON.parse(ligne.valeur) as T, majLe: new Date(ligne.maj_le) } : null;
    },
    async ecrireLecture(cle, valeur, quand = new Date()) {
      await base.runAsync(
        `INSERT INTO lectures (cle, valeur, maj_le) VALUES (?, ?, ?)
         ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur, maj_le = excluded.maj_le`,
        cle,
        JSON.stringify(valeur),
        quand.toISOString(),
      );
    },

    async mettreEnFile(envoi, quand = new Date()) {
      const cible = cibleDe(envoi);
      if (remplaceLePrecedent(envoi)) await base.runAsync("DELETE FROM envois WHERE cible = ?", cible);
      await base.runAsync(
        "INSERT INTO envois (cible, envoi, cree_le) VALUES (?, ?, ?)",
        cible,
        JSON.stringify(envoi),
        quand.toISOString(),
      );
    },
    async envoisEnAttente() {
      const lignes = await base.getAllAsync<{
        id: number;
        envoi: string;
        tentatives: number;
        derniere_erreur: string | null;
        dernier_echec_le: string | null;
      }>("SELECT id, envoi, tentatives, derniere_erreur, dernier_echec_le FROM envois ORDER BY id");
      return lignes.map((l) => ({
        id: l.id,
        envoi: JSON.parse(l.envoi) as Envoi,
        tentatives: l.tentatives,
        derniereErreur: l.derniere_erreur,
        dernierEchecLe: l.dernier_echec_le ? new Date(l.dernier_echec_le) : null,
      }));
    },
    async retirerEnvoi(id) {
      await base.runAsync("DELETE FROM envois WHERE id = ?", id);
    },
    async noterEchec(id, erreur, quand = new Date()) {
      await base.runAsync(
        "UPDATE envois SET tentatives = tentatives + 1, derniere_erreur = ?, dernier_echec_le = ? WHERE id = ?",
        erreur,
        quand.toISOString(),
        id,
      );
    },
    async reserverA(utilisateurId) {
      const ligne = await base.getFirstAsync<{ valeur: string }>("SELECT valeur FROM meta WHERE cle = 'utilisateur'");
      if (ligne?.valeur === utilisateurId) return false;
      const autreCompte = ligne !== null;
      if (autreCompte) await base.execAsync("DELETE FROM lectures; DELETE FROM envois; DELETE FROM meta;");
      await base.runAsync("INSERT INTO meta (cle, valeur) VALUES ('utilisateur', ?)", utilisateurId);
      return autreCompte;
    },
  };
}
