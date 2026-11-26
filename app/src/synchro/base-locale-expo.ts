// Adaptateur de production : BaseLocale sur expo-sqlite.
import { openDatabaseAsync } from "expo-sqlite";
import type { BaseLocale } from "./base-locale.ts";

export async function ouvrirBaseLocale(): Promise<BaseLocale> {
  return openDatabaseAsync("cache.db");
}
