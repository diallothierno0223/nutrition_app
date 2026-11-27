import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Une ligne qui ouvre un écran (« Yassa de poulet › »). Ce qui ouvre un écran ressemble toujours à une ligne de
 * liste, jamais à une puce de sélection.
 */
export function LigneDeListe({
  titre,
  surtitre,
  detail,
  valeur,
  couleurValeur,
  onPress,
}: {
  titre: string;
  /** Petite ligne au-dessus du titre (« Déjeuner · 13:05 »). */
  surtitre?: string;
  /** Petite ligne sous le titre. */
  detail?: string;
  /** Valeur alignée à droite (« 640 kcal »). */
  valeur?: string;
  couleurValeur?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.ligne, { backgroundColor: theme.backgroundElement }, pressed && styles.appuyee]}>
      <View style={styles.textes}>
        {surtitre && (
          <ThemedText type="detail" style={styles.surtitre}>
            {surtitre}
          </ThemedText>
        )}
        <ThemedText numberOfLines={2}>{titre}</ThemedText>
        {detail && <ThemedText type="detail">{detail}</ThemedText>}
      </View>
      {valeur && (
        <ThemedText type="smallBold" style={couleurValeur ? { color: couleurValeur } : null}>
          {valeur}
        </ThemedText>
      )}
      <ThemedText
        themeColor="textSecondary"
        style={styles.chevron}
        accessibilityElementsHidden
        importantForAccessibility="no">
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three - 4,
    paddingVertical: Spacing.three - 4,
    paddingHorizontal: 14,
    borderRadius: Rayons.moyen,
  },
  textes: { flex: 1, gap: Spacing.half, minWidth: 0 },
  surtitre: { fontWeight: 700 },
  chevron: { fontSize: 22, lineHeight: 26 },
  appuyee: { opacity: 0.7 },
});
