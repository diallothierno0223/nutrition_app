import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { NUTRIMENTS, libelleDuNutriment, type Nutriment, type ValeursNutritionnelles } from "@noyau";

export function formaterValeur(nutriment: Nutriment, valeur: number): string {
  return nutriment === "calories" ? `${Math.round(valeur)} kcal` : `${Math.round(valeur * 10) / 10} g`;
}

/** Les 7 nutriments d'un Repas ou d'une Journée, en grille compacte. */
export function ValeursNutritionnelles({ valeurs }: { valeurs: ValeursNutritionnelles }) {
  return (
    <View style={styles.grille}>
      {NUTRIMENTS.map((n) => (
        <View key={n} style={styles.cellule}>
          <ThemedText type="small" themeColor="textSecondary">
            {libelleDuNutriment(n)}
          </ThemedText>
          <ThemedText type="smallBold">{formaterValeur(n, valeurs[n])}</ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grille: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.three },
  cellule: { minWidth: 88 },
});
