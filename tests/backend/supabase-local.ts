// Accès au Supabase local pour les tests backend.
// Prérequis : `npx supabase start` (et `npx supabase functions serve` pour les Edge Functions).
import { execSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type StatutLocal = { API_URL: string; ANON_KEY: string; SERVICE_ROLE_KEY: string };

let statut: StatutLocal | undefined;

export function statutLocal(): StatutLocal {
  if (!statut) {
    const sortie = execSync("npx supabase status -o json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    statut = JSON.parse(sortie) as StatutLocal;
  }
  return statut;
}

const sansSession = { auth: { persistSession: false, autoRefreshToken: false } };

export function clientAnonyme(): SupabaseClient {
  const { API_URL, ANON_KEY } = statutLocal();
  return createClient(API_URL, ANON_KEY, sansSession);
}

export function clientAdmin(): SupabaseClient {
  const { API_URL, SERVICE_ROLE_KEY } = statutLocal();
  return createClient(API_URL, SERVICE_ROLE_KEY, sansSession);
}

export type UtilisateurDeTest = { id: string; client: SupabaseClient; supprimer: () => Promise<void> };

/** Crée un compte par l'API admin (les inscriptions publiques sont fermées) et renvoie un client connecté. */
export async function creerUtilisateurConnecte(): Promise<UtilisateurDeTest> {
  const admin = clientAdmin();
  const email = `test-${crypto.randomUUID()}@exemple.test`;
  const motDePasse = `mdp-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("création du compte impossible");

  const client = clientAnonyme();
  const connexion = await client.auth.signInWithPassword({ email, password: motDePasse });
  if (connexion.error) throw connexion.error;

  const id = data.user.id;
  return { id, client, supprimer: async () => void (await admin.auth.admin.deleteUser(id)) };
}
