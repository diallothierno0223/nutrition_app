// Health Connect (ticket 19), en lecture seule : pas du jour (affichés) et mesures de poids (importées en Pesées).
// Google Fit est remplacé par Health Connect : voir docs/health-connect.md. L'activité n'ajuste jamais les Objectifs.
import { Platform } from "react-native";
import {
  SdkAvailabilityStatus,
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
} from "react-native-health-connect";

import { ajouterPeseesManquantes, listerPesees } from "@/donnees/profil";
import { fuseauDuTelephone } from "@/donnees/repas";
import { peseesAImporter } from "@noyau";

const PERMISSIONS = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "Weight" },
] as const;

/** Nombre de jours de mesures de poids relus à chaque import. */
const JOURS_DE_POIDS = 30;
/** L'import automatique (au chargement du Dashboard) a lieu au plus une fois par heure. */
const INTERVALLE_D_IMPORT_MS = 60 * 60 * 1000;

export type EtatDeSante = "indisponible" | "a_autoriser" | "autorise";

let initialise: Promise<boolean> | null = null;
let dernierImport = 0;

async function pret(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  if ((await getSdkStatus()) !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
  initialise ??= initialize();
  const ok = await initialise.catch(() => false);
  if (!ok) initialise = null; // un échec d'initialisation sera retenté au prochain appel
  return ok;
}

export async function etatDeSante(): Promise<EtatDeSante> {
  try {
    if (!(await pret())) return "indisponible";
    const accordees = await getGrantedPermissions();
    const lit = (type: string) => accordees.some((p) => p.recordType === type && p.accessType === "read");
    return lit("Steps") && lit("Weight") ? "autorise" : "a_autoriser";
  } catch {
    return "indisponible";
  }
}

/** Demande la lecture des pas et du poids ; renvoie le nouvel état. */
export async function autoriserSante(): Promise<EtatDeSante> {
  if (!(await pret())) return "indisponible";
  await requestPermission([...PERMISSIONS]);
  return etatDeSante();
}

export { openHealthConnectSettings as ouvrirReglagesHealthConnect };

/** Les pas depuis minuit (heure du téléphone). */
async function compterLesPas(maintenant: Date): Promise<number> {
  const minuit = new Date(maintenant);
  minuit.setHours(0, 0, 0, 0);
  const resultat = await aggregateRecord({
    recordType: "Steps",
    timeRangeFilter: { operator: "between", startTime: minuit.toISOString(), endTime: maintenant.toISOString() },
  });
  return resultat.COUNT_TOTAL;
}

/** Importe en Pesées les mesures de poids des 30 derniers jours, sans doublon (noyau métier). */
async function importer(maintenant: Date): Promise<number> {
  const debut = new Date(maintenant.getTime() - JOURS_DE_POIDS * 24 * 60 * 60 * 1000);
  const [{ records }, existantes] = await Promise.all([
    readRecords("Weight", {
      timeRangeFilter: { operator: "between", startTime: debut.toISOString(), endTime: maintenant.toISOString() },
    }),
    listerPesees(JOURS_DE_POIDS + 10),
  ]);
  const nouvelles = peseesAImporter(
    records.map((r) => ({ instant: r.time, kg: r.weight.inKilograms })),
    existantes.map((p) => ({ journee: p.pese_le, kg: p.poids_kg })),
    fuseauDuTelephone(),
  );
  return ajouterPeseesManquantes(nouvelles.map((p) => ({ pese_le: p.journee, poids_kg: p.kg })));
}

/** Import à la demande (Réglages) : nombre de Pesées réellement ajoutées. */
export async function importerPesees(maintenant = new Date()): Promise<number> {
  if ((await etatDeSante()) !== "autorise") return 0;
  dernierImport = maintenant.getTime();
  return importer(maintenant);
}

/**
 * Au chargement du Dashboard : pas du jour (null sans autorisation) et import des Pesées au plus une fois par heure.
 * Un seul contrôle de l'état de Health Connect pour les deux.
 */
export async function synchroniserSante(maintenant = new Date()): Promise<{ pas: number | null }> {
  if ((await etatDeSante()) !== "autorise") return { pas: null };
  if (maintenant.getTime() - dernierImport >= INTERVALLE_D_IMPORT_MS) {
    dernierImport = maintenant.getTime();
    await importer(maintenant).catch((e) => console.warn("Pesées non importées :", e instanceof Error ? e.message : e));
  }
  return { pas: await compterLesPas(maintenant) };
}
