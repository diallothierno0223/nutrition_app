import { StyleSheet, View } from "react-native";

import { CouleursJauge } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Jauge } from "@noyau";

/** La barre d'une jauge : remplie selon le pourcentage (plafonné à 100 %), colorée selon l'état. */
export function BarreDeJauge({ jauge }: { jauge: Jauge }) {
  const theme = useTheme();
  return (
    <View style={[styles.piste, { backgroundColor: theme.backgroundElement }]}>
      <View
        style={[
          styles.remplissage,
          { width: `${Math.min(jauge.pourcentage ?? 0, 100)}%`, backgroundColor: CouleursJauge[jauge.etat] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  piste: { height: 8, borderRadius: 4, overflow: "hidden" },
  remplissage: { height: "100%", borderRadius: 4 },
});
