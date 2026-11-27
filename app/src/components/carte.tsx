import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Une section d'écran : fond de carte, coins arrondis. Avec `titre`, un titre de section net et, dessous, un
 * `detail` en petit texte secondaire.
 */
export function Carte({
  titre,
  detail,
  style,
  children,
}: PropsWithChildren<{ titre?: string; detail?: string; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  return (
    <View style={[styles.carte, { backgroundColor: theme.carte }, style]}>
      {titre && (
        <View style={styles.entete}>
          <ThemedText type="section" accessibilityRole="header">
            {titre}
          </ThemedText>
          {detail && <ThemedText type="detail">{detail}</ThemedText>}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: Rayons.carte, padding: 18, gap: Spacing.three - 4 },
  entete: { gap: Spacing.half },
});
