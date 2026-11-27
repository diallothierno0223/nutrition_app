// Notifications locales (ticket 16), programmées sur le téléphone à partir des réglages et de la Journée en cours.
// Tout est reprogrammé à chaque appel, l'un après l'autre (file d'attente) : la notification du soir porte ainsi des
// chiffres à jour après chaque Repas ou ajout d'eau. Le contenu est calculé par le noyau métier.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { chargerObjectifEau, eauDuJour } from "@/donnees/hydratation";
import { chargerObjectifs, totauxDuJour } from "@/donnees/objectifs";
import { chargerReglagesDesNotifications } from "@/donnees/reglages";
import { fuseauDuTelephone } from "@/donnees/repas";
import {
  contenuDeNotification,
  heureEtMinute,
  journeeDe,
  type ContexteDuJour,
  type ReglagesDesNotifications,
  type TypeDeNotification,
} from "@noyau";

const CANAL = "rappels";
const SAMEDI_EXPO = 7; // expo-notifications : 1 = dimanche … 7 = samedi
/** Jours programmés d'avance pour midi et soir (aujourd'hui avec les chiffres, les suivants sans). */
const JOURS_PROGRAMMES = 14;
const CLE_DEMANDE_FAITE = "notifications.permission-demandee";

const SANS_CHIFFRES: Record<"midi" | "soir", { titre: string; corps: string }> = {
  midi: { titre: "Déjeuner", corps: "Pense à saisir ton déjeuner et à boire de l'eau." },
  soir: { titre: "Avant le dîner", corps: "Ouvre l'app pour voir tes quotas restants du jour." },
};

/** Les notifications s'affichent aussi quand l'app est ouverte (appelée une fois, au démarrage). */
export function configurerNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Vrai si les notifications sont autorisées. La demande n'est faite d'office qu'une fois ; ensuite, seulement
 * quand l'utilisateur enregistre ses réglages de notifications (`demander`).
 */
async function autorisees(demander: boolean): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: "Rappels",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const actuelles = await Notifications.getPermissionsAsync();
  if (actuelles.granted) return true;
  const dejaDemandee = (await AsyncStorage.getItem(CLE_DEMANDE_FAITE).catch(() => null)) === "oui";
  if (!actuelles.canAskAgain || (dejaDemandee && !demander)) return false;
  await AsyncStorage.setItem(CLE_DEMANDE_FAITE, "oui").catch(() => undefined);
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function programmer(
  identifiant: string,
  contenu: { titre: string; corps: string },
  trigger: Notifications.NotificationTriggerInput,
) {
  await Notifications.scheduleNotificationAsync({
    identifier: identifiant,
    content: { title: contenu.titre, body: contenu.corps },
    trigger,
  });
}

/** Midi ou soir : chaque jour à son heure, aujourd'hui avec les chiffres du moment, les jours suivants sans. */
async function programmerJourParJour(
  type: "midi" | "soir",
  heureReglee: string,
  contexte: ContexteDuJour,
  maintenant: Date,
) {
  const { heure, minute } = heureEtMinute(heureReglee);
  for (let jour = 0; jour < JOURS_PROGRAMMES; jour++) {
    const quand = new Date(maintenant);
    quand.setDate(quand.getDate() + jour);
    quand.setHours(heure, minute, 0, 0);
    if (quand <= maintenant) continue;
    const contenu = jour === 0 ? contenuDeNotification(type, contexte) : SANS_CHIFFRES[type];
    await programmer(`${type}-${jour}`, contenu, {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: quand,
      channelId: CANAL,
    });
  }
}

/** Heure et minute au format attendu par les déclencheurs DAILY et WEEKLY d'expo-notifications. */
function horaire(heureReglee: string): { hour: number; minute: number } {
  const { heure, minute } = heureEtMinute(heureReglee);
  return { hour: heure, minute };
}

const programmes: Record<TypeDeNotification, (heure: string, contexte: ContexteDuJour, maintenant: Date) => Promise<void>> = {
  // Le matin ne parle que des Objectifs journaliers, qui ne changent pas d'un jour à l'autre : quotidienne.
  matin: (heure, contexte) =>
    programmer("matin", contenuDeNotification("matin", contexte), {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      ...horaire(heure),
      channelId: CANAL,
    }),
  midi: (heure, contexte, maintenant) => programmerJourParJour("midi", heure, contexte, maintenant),
  soir: (heure, contexte, maintenant) => programmerJourParJour("soir", heure, contexte, maintenant),
  samedi: (heure, contexte) =>
    programmer("samedi", contenuDeNotification("samedi", contexte), {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: SAMEDI_EXPO,
      ...horaire(heure),
      channelId: CANAL,
    }),
};

/** Reprogramme toutes les notifications actives, à partir des réglages et de la Journée en cours. */
async function programmerNotifications(
  reglages: ReglagesDesNotifications,
  contexte: ContexteDuJour,
  demander: boolean,
  maintenant = new Date(),
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const actives = (Object.keys(programmes) as TypeDeNotification[]).filter((t) => reglages[t].active);
  if (actives.length === 0 || !(await autorisees(demander))) return;
  // Chaque type est programmé indépendamment : l'échec de l'un ne prive pas les autres de leur notification.
  for (const type of actives) {
    try {
      await programmes[type](reglages[type].heure, contexte, maintenant);
    } catch (e) {
      console.warn(`notification « ${type} » non programmée :`, e instanceof Error ? e.message : String(e));
    }
  }
}

async function contexteDuJour(): Promise<ContexteDuJour> {
  const journee = journeeDe(new Date(), fuseauDuTelephone());
  const [totaux, objectifs, eauMl, objectifEauMl] = await Promise.all([
    totauxDuJour(journee),
    chargerObjectifs(),
    eauDuJour(journee),
    chargerObjectifEau(),
  ]);
  return { totaux, objectifs, eauMl, objectifEauMl };
}

// Les reprogrammations s'enchaînent sans se chevaucher (plusieurs écrans peuvent en demander une en même temps).
let file: Promise<void> = Promise.resolve();

/**
 * Relit les réglages (et la Journée en cours, si l'appelant ne l'a pas déjà chargée), puis reprogramme.
 * Sans effet visible en cas d'échec (réseau absent). `demander` : redemander la permission si elle a été refusée.
 */
export function rafraichirNotifications(contexte?: ContexteDuJour, { demander = false } = {}): Promise<void> {
  file = file.then(async () => {
    try {
      const [reglages, jour] = await Promise.all([chargerReglagesDesNotifications(), contexte ?? contexteDuJour()]);
      await programmerNotifications(reglages, jour, demander);
    } catch (e) {
      console.warn("notifications non reprogrammées :", e instanceof Error ? e.message : String(e));
    }
  });
  return file;
}
