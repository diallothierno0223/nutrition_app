// Adaptateur de test : BaseLocale sur node:sqlite, en mémoire. Jamais embarqué dans l'app.
import { DatabaseSync } from "node:sqlite";
import type { BaseLocale, ValeurSql } from "./base-locale.ts";

export function baseEnMemoire(): BaseLocale {
  const db = new DatabaseSync(":memory:");
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, ...parametres: ValeurSql[]) {
      return db.prepare(sql).run(...parametres);
    },
    async getFirstAsync<T>(sql: string, ...parametres: ValeurSql[]) {
      return (db.prepare(sql).get(...parametres) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, ...parametres: ValeurSql[]) {
      return db.prepare(sql).all(...parametres) as T[];
    },
  };
}
