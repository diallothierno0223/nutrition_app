import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Une case à cocher : la case pleine de la couleur principale avec « ✓ » quand elle est cochée, le libellé barré et
 * atténué. `detail` : lignes secondaires sous le libellé.
 */
export function CaseACocher({
  libelle,
  coche,
  detail,
  onPress,
}: {
  libelle: string;
  coche: boolean;
  detail?: ReactNode;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: coche }}
      accessibilityLabel={libelle}
      style={({ pressed }) => [styles.case, pressed && styles.appuyee]}>
      <View
        style={[
          styles.boite,
          coche ? { backgroundColor: theme.accent, borderColor: theme.accent } : { borderColor: theme.textSecondary },
        ]}>
        {coche && <ThemedText style={[styles.marque, { color: theme.surAccent }]}>✓</ThemedText>}
      </View>
      <View style={styles.textes}>
        <ThemedText themeColor={coche ? "textSecondary" : "text"} style={coche ? styles.barre : undefined}>
          {libelle}
        </ThemedText>
        {detail}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  case: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", gap: Spacing.three - 4 },
  boite: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  marque: { fontSize: 15, lineHeight: 18, fontWeight: 700 },
  textes: { flex: 1, gap: Spacing.half },
  barre: { textDecorationLine: "line-through" },
  appuyee: { opacity: 0.7 },
});
