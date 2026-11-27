import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useEnvoi } from "@/hooks/use-envoi";
import {
  chargerReglagesDesNotifications,
  enregistrerReglagesDesNotifications,
  rafraichirNotifications,
} from "@/notifications/programmation";
import {
  TYPES_DE_NOTIFICATION,
  estUneHeureValide,
  libelleDeNotification,
  type ReglagesDesNotifications as Reglages,
} from "@noyau";

/** Heure et activation de chaque notification ; l'enregistrement reprogramme tout. */
export function ReglagesDesNotifications() {
  const [reglages, setReglages] = useState<Reglages | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { envoi, erreur, envoyer } = useEnvoi();

  useEffect(() => {
    chargerReglagesDesNotifications().then(setReglages, () => setMessage("La base ne répond pas."));
  }, []);

  if (!reglages) return message ? <ThemedText themeColor="textSecondary">{message}</ThemedText> : null;

  const valides = TYPES_DE_NOTIFICATION.every((t) => estUneHeureValide(reglages[t].heure));

  async function enregistrer() {
    if (!reglages || !valides) return;
    setMessage(null);
    if (await envoyer(() => enregistrerReglagesDesNotifications(reglages))) {
      await rafraichirNotifications();
      setMessage("Notifications reprogrammées.");
    }
  }

  return (
    <View style={styles.bloc}>
      <ThemedText type="smallBold">Notifications</ThemedText>
      {TYPES_DE_NOTIFICATION.map((type) => (
        <View key={type} style={styles.ligne}>
          <ThemedText type="small" style={styles.libelle}>
            {libelleDeNotification(type)}
          </ThemedText>
          <Champ
            style={styles.heure}
            placeholder="HH:MM"
            value={reglages[type].heure}
            editable={reglages[type].active}
            onChangeText={(heure) => setReglages({ ...reglages, [type]: { ...reglages[type], heure } })}
          />
          <Bouton
            libelle={reglages[type].active ? "Activée" : "Désactivée"}
            variante="secondaire"
            onPress={() => setReglages({ ...reglages, [type]: { ...reglages[type], active: !reglages[type].active } })}
          />
        </View>
      ))}
      {!valides && <ThemedText themeColor="textSecondary">Heure invalide (format HH:MM, par exemple 21:00).</ThemedText>}
      {(erreur ?? message) && <ThemedText themeColor="textSecondary">{erreur ?? message}</ThemedText>}
      <Bouton libelle="Enregistrer les notifications" variante="secondaire" onPress={enregistrer} desactive={!valides} enCours={envoi} />
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  libelle: { flex: 1 },
  heure: { width: 80, textAlign: "center" },
});
