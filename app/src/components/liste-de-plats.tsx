import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { Plat } from "@/donnees/plats";
import { useTheme } from "@/hooks/use-theme";

/** Des Plats sous forme de puces : un appui ouvre le Plat pour l'enregistrer comme Repas. */
export function ListeDePlats({ titre, plats }: { titre: string; plats: readonly Plat[] }) {
  const theme = useTheme();
  if (plats.length === 0) return null;
  return (
    <View style={styles.bloc}>
      <ThemedText type="smallBold">{titre}</ThemedText>
      <View style={styles.puces}>
        {plats.map((plat) => (
          <Pressable
            key={plat.id}
            onPress={() => router.push({ pathname: "/plat/[id]", params: { id: plat.id } })}
            style={[styles.puce, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small">{plat.nom}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  puce: { borderRadius: 999, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
});
