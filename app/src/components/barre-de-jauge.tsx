import { StyleSheet, View } from "react-native";

import { Rayons } from "@/constants/theme";
import { useCouleursJauge, useTheme } from "@/hooks/use-theme";
import type { Jauge } from "@noyau";

/** La barre d'une jauge : remplie selon le pourcentage (plafonné à 100 %), colorée selon l'état. */
export function BarreDeJauge({ jauge }: { jauge: Jauge }) {
  const theme = useTheme();
  const couleurs = useCouleursJauge();
  return (
    <View style={[styles.piste, { backgroundColor: theme.piste }]}>
      <View
        style={[
          styles.remplissage,
          { width: `${Math.min(jauge.pourcentage ?? 0, 100)}%`, backgroundColor: couleurs[jauge.etat] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  piste: { height: 10, borderRadius: Rayons.puce, overflow: "hidden" },
  remplissage: { height: "100%", borderRadius: Rayons.puce },
});
