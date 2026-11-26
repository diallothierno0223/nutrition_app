import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { CouleursJauge, Spacing } from "@/constants/theme";
import type { Pesee } from "@/donnees/profil";
import { useTheme } from "@/hooks/use-theme";

const HAUTEUR = 48;

/** Courbe de poids simplifiée : une barre par Pesée (de la plus ancienne à la plus récente). */
export function CourbeDePoids({ pesees }: { pesees: Pesee[] }) {
  const theme = useTheme();
  if (pesees.length === 0) {
    return <ThemedText themeColor="textSecondary">Aucune Pesée : ajoute-en dans l'onglet Objectifs.</ThemedText>;
  }

  const chronologique = [...pesees].reverse();
  const poids = chronologique.map((p) => p.poids_kg);
  const min = Math.min(...poids);
  const etendue = Math.max(...poids) - min || 1;
  const premiere = chronologique[0]!;
  const derniere = chronologique[chronologique.length - 1]!;
  const variation = Math.round((derniere.poids_kg - premiere.poids_kg) * 10) / 10;

  return (
    <View style={styles.bloc}>
      <ThemedText type="small" themeColor="textSecondary">
        {derniere.poids_kg} kg le {derniere.pese_le}
        {pesees.length > 1 && ` · ${variation > 0 ? "+" : ""}${variation} kg depuis le ${premiere.pese_le}`}
      </ThemedText>
      <View style={[styles.barres, { backgroundColor: theme.backgroundElement }]}>
        {chronologique.map((p) => (
          <View
            key={p.id}
            style={[
              styles.barre,
              // Au moins 15 % de hauteur pour que la plus basse reste visible.
              { height: HAUTEUR * (0.15 + (0.85 * (p.poids_kg - min)) / etendue), backgroundColor: CouleursJauge.normal },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.one },
  barres: { height: HAUTEUR, flexDirection: "row", alignItems: "flex-end", gap: 3, borderRadius: 8, padding: 4 },
  barre: { flex: 1, borderRadius: 2 },
});
