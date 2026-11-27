import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { BarreDeJauge } from "@/components/barre-de-jauge";
import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { ajouterEau, annulerDernierAjout } from "@/donnees/hydratation";
import { formaterLitres, jaugeHydratation } from "@noyau";

/** Jauge d'Hydratation du jour et ajout rapide d'eau (+250 / +500 ml), avec annulation du dernier ajout. */
export function CompteurEau({
  totalMl,
  objectifMl,
  onChange,
}: {
  totalMl: number;
  objectifMl: number | null;
  onChange: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function agir(action: () => Promise<unknown>) {
    setEnvoi(true);
    setMessage(null);
    try {
      await action();
      onChange();
    } catch {
      setMessage("Action impossible. Vérifie ta connexion.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Carte>
      <View style={styles.entete}>
        <ThemedText type="section" accessibilityRole="header">
          Eau
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {formaterLitres(totalMl)}
          {objectifMl !== null && ` sur ${formaterLitres(objectifMl)}`}
        </ThemedText>
      </View>
      <BarreDeJauge jauge={jaugeHydratation(totalMl, objectifMl)} />
      <View style={styles.actions}>
        <Bouton libelle="+250 ml" variante="secondaire" onPress={() => agir(() => ajouterEau(250))} desactive={envoi} />
        <Bouton libelle="+500 ml" variante="secondaire" onPress={() => agir(() => ajouterEau(500))} desactive={envoi} />
        <Bouton
          libelle="Annuler le dernier"
          variante="discret"
          onPress={() => agir(annulerDernierAjout)}
          desactive={envoi || totalMl === 0}
        />
      </View>
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
    </Carte>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: Spacing.two },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.two + 2 },
});
