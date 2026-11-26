import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { BarreDeJauge } from "@/components/barre-de-jauge";
import { Bouton } from "@/components/bouton";
import { ThemedText } from "@/components/themed-text";
import { formaterLitres } from "@/components/valeurs-nutritionnelles";
import { Spacing } from "@/constants/theme";
import { ajouterEau, annulerDernierAjout } from "@/donnees/hydratation";
import { jaugeHydratation } from "@noyau";

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
    <View style={styles.bloc}>
      <View style={styles.entete}>
        <ThemedText type="smallBold">Eau</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formaterLitres(totalMl)}
          {objectifMl !== null && ` / ${formaterLitres(objectifMl)}`}
        </ThemedText>
      </View>
      <BarreDeJauge jauge={jaugeHydratation(totalMl, objectifMl)} />
      <View style={styles.actions}>
        <Bouton libelle="+250 ml" variante="secondaire" onPress={() => agir(() => ajouterEau(250))} desactive={envoi} />
        <Bouton libelle="+500 ml" variante="secondaire" onPress={() => agir(() => ajouterEau(500))} desactive={envoi} />
        <Bouton
          libelle="Annuler le dernier"
          variante="secondaire"
          onPress={() => agir(annulerDernierAjout)}
          desactive={envoi || totalMl === 0}
        />
      </View>
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  entete: { flexDirection: "row", justifyContent: "space-between" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});
