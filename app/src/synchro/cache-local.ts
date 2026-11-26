// Cache local (ADR 0002) : copie en lecture des données du quotidien et file d'envoi.
// Supabase reste la seule source de vérité. Les tables du cache arrivent avec leurs tickets.
import type { BaseLocale } from "./base-locale.ts";

export interface CacheLocal {
  derniereSynchro(): Promise<Date | null>;
  noterSynchro(quand: Date): Promise<void>;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS meta (
    cle TEXT PRIMARY KEY NOT NULL,
    valeur TEXT NOT NULL
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
  };
}
