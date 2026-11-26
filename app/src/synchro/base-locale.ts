// Interface minimale vers la base SQLite locale.
// Elle reprend le sous-ensemble de l'API asynchrone d'expo-sqlite dont la synchro a besoin,
// pour que la synchro se teste dans Node avec une base en mémoire.
export type ValeurSql = string | number | null;

export interface BaseLocale {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...parametres: ValeurSql[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, ...parametres: ValeurSql[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...parametres: ValeurSql[]): Promise<T[]>;
}
