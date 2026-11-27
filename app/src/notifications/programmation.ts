// Notifications locales (ticket 16), programmées sur le téléphone à partir des réglages et de la Journée en cours.
// Tout est reprogrammé à chaque appel : la notification du soir porte ainsi des chiffres à jour après chaque Repas
// ou ajout d'eau. Le contenu est calculé par le noyau métier.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { chargerObjectifEau, eauDuJour } from "@/donnees/hydratation";
import { chargerObjectifs, totauxDuJour } from "@/donnees/objectifs";
import { fuseauDuTelephone } from "@/donnees/repas";
import { supabase } from "@/lib/supabase";
import {
  contenuDeNotification,
  heureEtMinute,
  journeeDe,
  lireReglagesDesNotifications,
  type ContexteDuJour,
  type ReglagesDesNotifications,
} from "@noyau";

const CANAL = "rappels";
const SAMEDI_EXPO = 7; // expo-notifications : 1 = dimanche … 7 = samedi
const JOURS_DU_SOIR_PROGRAMMES = 7;
const SOIR_SANS_CHIFFRES = { titre: "Avant le dîner", corps: "Ouvre l'app pour voir tes quotas restants du jour." };

// Les notifications arrivent aussi quand l'app est ouverte.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function chargerReglagesDesNotifications(): Promise<ReglagesDesNotifications> {
  const { data, error } = await supabase.from("reglages").select("notifications").single();
  if (error) throw error;
  return lireReglagesDesNotifications(data.notifications);
}

export async function enregistrerReglagesDesNotifications(reglages: ReglagesDesNotifications): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const { error } = await supabase
    .from("reglages")
    .update({ notifications: reglages })
    .eq("user_id", session.session?.user.id ?? "");
  if (error) throw error;
}

/** Vrai si l'utilisateur accepte les notifications (la demande n'est faite qu'une fois par Android). */
async function autorisees(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: "Rappels",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const actuelles = await Notifications.getPermissionsAsync();
  if (actuelles.granted) return true;
  if (!actuelles.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Reprogramme toutes les notifications actives, à partir des réglages et de la Journée en cours. */
export async function programmerNotifications(
  reglages: ReglagesDesNotifications,
  contexte: ContexteDuJour,
  maintenant = new Date(),
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!Object.values(reglages).some((r) => r.active) || !(await autorisees())) return;

  const programmer = (contenu: { titre: string; corps: string }, trigger: Notifications.NotificationTriggerInput) =>
    Notifications.scheduleNotificationAsync({ content: { title: contenu.titre, body: contenu.corps }, trigger });

  for (const type of ["matin", "midi"] as const) {
    if (!reglages[type].active) continue;
    const { heure, minute } = heureEtMinute(reglages[type].heure);
    await programmer(contenuDeNotification(type, contexte), {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: heure,
      minute,
      channelId: CANAL,
    });
  }

  // Le soir : aujourd'hui avec les chiffres du moment, les jours suivants un rappel sans chiffres (remplacé dès que
  // l'app est rouverte).
  if (reglages.soir.active) {
    const { heure, minute } = heureEtMinute(reglages.soir.heure);
    for (let jour = 0; jour < JOURS_DU_SOIR_PROGRAMMES; jour++) {
      const quand = new Date(maintenant);
      quand.setDate(quand.getDate() + jour);
      quand.setHours(heure, minute, 0, 0);
      if (quand <= maintenant) continue;
      const contenu = jour === 0 ? contenuDeNotification("soir", contexte) : SOIR_SANS_CHIFFRES;
      await programmer(contenu, { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quand, channelId: CANAL });
    }
  }

  if (reglages.samedi.active) {
    const { heure, minute } = heureEtMinute(reglages.samedi.heure);
    await programmer(contenuDeNotification("samedi", contexte), {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: SAMEDI_EXPO,
      hour: heure,
      minute,
      channelId: CANAL,
    });
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

/**
 * Relit les réglages (et la Journée en cours, si l'appelant ne l'a pas déjà chargée), puis reprogramme.
 * Sans effet visible en cas d'échec (réseau absent).
 */
export async function rafraichirNotifications(contexte?: ContexteDuJour): Promise<void> {
  try {
    const [reglages, jour] = await Promise.all([chargerReglagesDesNotifications(), contexte ?? contexteDuJour()]);
    await programmerNotifications(reglages, jour);
  } catch (e) {
    console.warn("notifications non reprogrammées :", e instanceof Error ? e.message : String(e));
  }
}
