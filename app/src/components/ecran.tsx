import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

/** Gabarit commun des écrans : un titre (optionnel), puis le contenu, défilant. */
export function Ecran({ titre, children }: PropsWithChildren<{ titre?: string }>) {
  return (
    <ThemedView style={styles.ecran}>
      <SafeAreaView style={styles.ecran} edges={titre ? undefined : ["bottom", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          {titre && (
            <ThemedText type="ecran" accessibilityRole="header">
              {titre}
            </ThemedText>
          )}
          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/** Onglet dont le contenu arrive avec un ticket ultérieur. */
export function EcranAVenir({ titre }: { titre: string }) {
  return (
    <Ecran titre={titre}>
      <ThemedText themeColor="textSecondary">Bientôt disponible.</ThemedText>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  contenu: { padding: Spacing.four, gap: Spacing.three },
});
