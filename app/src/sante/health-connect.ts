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

import { listerPesees } from "@/donnees/profil";
import { fuseauDuTelephone } from "@/donnees/repas";
import { supabase } from "@/lib/supabase";
import { peseesAImporter } from "@noyau";

const PERMISSIONS = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "Weight" },
] as const;

/** Nombre de jours de mesures de poids relus à chaque synchronisation. */
const JOURS_DE_POIDS = 30;

export type EtatDeSante = "indisponible" | "a_autoriser" | "autorise";

let initialise: Promise<boolean> | null = null;

async function pret(): Promise<boolean> {
  if (Platform.OS !== "android") return false;
  if ((await getSdkStatus()) !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
  initialise ??= initialize();
  return initialise;
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

/** Les pas depuis minuit (heure du téléphone) ; null si Health Connect n'est pas autorisé. */
export async function pasDuJour(maintenant = new Date()): Promise<number | null> {
  if ((await etatDeSante()) !== "autorise") return null;
  const minuit = new Date(maintenant);
  minuit.setHours(0, 0, 0, 0);
  const resultat = await aggregateRecord({
    recordType: "Steps",
    timeRangeFilter: { operator: "between", startTime: minuit.toISOString(), endTime: maintenant.toISOString() },
  });
  return resultat.COUNT_TOTAL;
}

/**
 * Importe en Pesées les mesures de poids des 30 derniers jours, sans doublon (noyau métier) ; renvoie le nombre de
 * Pesées créées. Sans autorisation, ne fait rien.
 */
export async function importerPesees(maintenant = new Date()): Promise<number> {
  if ((await etatDeSante()) !== "autorise") return 0;
  const debut = new Date(maintenant.getTime() - JOURS_DE_POIDS * 24 * 60 * 60 * 1000);
  const [{ records }, existantes] = await Promise.all([
    readRecords("Weight", {
      timeRangeFilter: { operator: "between", startTime: debut.toISOString(), endTime: maintenant.toISOString() },
    }),
    listerPesees(JOURS_DE_POIDS + 10),
  ]);
  const nouvelles = peseesAImporter(
    records.map((r) => ({ instant: r.time, kg: r.weight.inKilograms })),
    existantes,
    fuseauDuTelephone(),
  );
  if (nouvelles.length === 0) return 0;
  // ignoreDuplicates : si une Pesée du même jour a été saisie entre-temps, elle est gardée.
  const { error } = await supabase
    .from("pesees")
    .upsert(nouvelles, { onConflict: "user_id,pese_le", ignoreDuplicates: true });
  if (error) throw error;
  return nouvelles.length;
}
