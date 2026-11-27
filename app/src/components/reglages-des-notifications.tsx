import { useEffect, useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { ChampHeure } from "@/components/champ-date-heure";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { chargerReglagesDesNotifications, enregistrerReglagesDesNotifications } from "@/donnees/reglages";
import { useEnvoi } from "@/hooks/use-envoi";
import {
  autoriserAlarmesExactes,
  envoyerNotificationDeTest,
  etatDesNotifications,
  rafraichirNotifications,
  type EtatDesNotifications,
} from "@/notifications/programmation";
import {
  TYPES_DE_NOTIFICATION,
  libelleDeNotification,
  type ReglagesDesNotifications as Reglages,
} from "@noyau";

/** Heure et activation de chaque notification ; l'enregistrement reprogramme tout. */
export function ReglagesDesNotifications() {
  const [reglages, setReglages] = useState<Reglages | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { envoi, erreur, envoyer } = useEnvoi();

  const [etat, setEtat] = useState<EtatDesNotifications | null>(null);

  useEffect(() => {
    chargerReglagesDesNotifications().then(setReglages, () => setMessage("La base ne répond pas."));
    etatDesNotifications().then(setEtat, () => undefined);
  }, []);

  if (!reglages) return message ? <ThemedText themeColor="textSecondary">{message}</ThemedText> : null;

  async function enregistrer() {
    if (!reglages) return;
    setMessage(null);
    if (await envoyer(() => enregistrerReglagesDesNotifications(reglages))) {
      // Enregistrer ses réglages vaut accord : la permission est redemandée si elle avait été refusée.
      await rafraichirNotifications(undefined, { demander: true });
      await actualiserEtat();
    }
  }

  async function actualiserEtat() {
    setEtat(await etatDesNotifications().catch(() => null));
  }

  async function tester(delaiSecondes: number, annonce: string) {
    const envoyee = await envoyerNotificationDeTest(delaiSecondes);
    setMessage(envoyee ? annonce : "Notifications refusées : autorise-les dans les paramètres Android de l'app.");
    await actualiserEtat();
  }

  async function heureExacte() {
    await autoriserAlarmesExactes().catch(() => setMessage("Cette build ne déclare pas les alarmes exactes : il faut une nouvelle build."));
    await rafraichirNotifications();
    await actualiserEtat();
  }

  return (
    <View style={styles.bloc}>
      <ThemedText type="smallBold">Notifications</ThemedText>
      {TYPES_DE_NOTIFICATION.map((type) => (
        <View key={type} style={styles.ligne}>
          <ThemedText type="small" style={styles.libelle}>
            {libelleDeNotification(type)}
          </ThemedText>
          <ChampHeure
            style={styles.heure}
            placeholder="Heure"
            valeur={reglages[type].heure}
            desactive={!reglages[type].active}
            onChange={(heure) => setReglages({ ...reglages, [type]: { ...reglages[type], heure } })}
          />
          <Switch
            value={reglages[type].active}
            accessibilityLabel={`Activer : ${libelleDeNotification(type)}`}
            onValueChange={(active) => setReglages({ ...reglages, [type]: { ...reglages[type], active } })}
          />
        </View>
      ))}
      {(erreur ?? message) && <ThemedText themeColor="textSecondary">{erreur ?? message}</ThemedText>}
      <Bouton libelle="Enregistrer les notifications" variante="secondaire" onPress={enregistrer} enCours={envoi} />
      {etat && (
        <ThemedText type="small" themeColor="textSecondary">
          {etat.autorisees ? "Permission accordée" : "Permission refusée"} · {etat.programmees} programmée(s)
          {etat.prochaine ? ` · prochaine ${etat.prochaine.toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" })}` : ""}
          {etat.exactes ? "" : " · heure approximative (alarmes exactes non autorisées)"}
        </ThemedText>
      )}
      <View style={styles.ligne}>
        <Bouton libelle="Test dans 10 s" variante="secondaire" onPress={() => tester(10, "Notification de test dans 10 secondes.")} />
        <Bouton
          libelle="Test dans 2 min"
          variante="secondaire"
          onPress={() => tester(120, "Notification de test dans 2 minutes : ferme l'app (balaye-la des apps récentes) et attends.")}
        />
        {etat && !etat.exactes && <Bouton libelle="Autoriser l'heure exacte" variante="secondaire" onPress={heureExacte} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  ligne: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.two },
  libelle: { flex: 1 },
  heure: { width: 100 },
});
