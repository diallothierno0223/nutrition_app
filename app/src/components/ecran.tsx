import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

/** Gabarit commun des onglets : un titre, puis le contenu de l'écran. */
export function Ecran({ titre, children }: PropsWithChildren<{ titre: string }>) {
  return (
    <ThemedView style={styles.ecran}>
      <SafeAreaView style={styles.contenu}>
        <ThemedText type="subtitle">{titre}</ThemedText>
        {children}
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
  contenu: { flex: 1, padding: Spacing.four, gap: Spacing.three },
});
