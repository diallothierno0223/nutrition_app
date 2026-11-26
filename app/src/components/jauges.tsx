import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { formaterValeur } from "@/components/valeurs-nutritionnelles";
import { CouleursJauge, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  NUTRIMENTS,
  etatDeJauge,
  libelleDuNutriment,
  type EtatDeJauge,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "@noyau";

const MENTIONS: Partial<Record<EtatDeJauge, string>> = {
  approche: "proche du plafond",
  depasse: "dépassé",
  en_dessous: "en dessous",
};

/** Les jauges du jour : consommation face à l'Objectif journalier, colorées selon leur état. */
export function Jauges({ totaux, objectifs }: { totaux: ValeursNutritionnelles; objectifs: ObjectifsJournaliers }) {
  const theme = useTheme();
  return (
    <View style={styles.liste}>
      {NUTRIMENTS.map((n) => {
        const objectif = objectifs[n];
        const { etat, pourcentage } = etatDeJauge(n, totaux[n], objectif);
        const mention = MENTIONS[etat];
        return (
          <View key={n} style={styles.jauge}>
            <View style={styles.entete}>
              <ThemedText type="smallBold">{libelleDuNutriment(n)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formaterValeur(n, totaux[n])}
                {objectif !== null && ` / ${formaterValeur(n, objectif)}`}
                {mention && ` · ${mention}`}
              </ThemedText>
            </View>
            <View style={[styles.piste, { backgroundColor: theme.backgroundElement }]}>
              <View
                style={[
                  styles.remplissage,
                  { width: `${Math.min(pourcentage ?? 0, 100)}%`, backgroundColor: CouleursJauge[etat] },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  liste: { gap: Spacing.three },
  jauge: { gap: Spacing.one },
  entete: { flexDirection: "row", justifyContent: "space-between", gap: Spacing.two },
  piste: { height: 8, borderRadius: 4, overflow: "hidden" },
  remplissage: { height: "100%", borderRadius: 4 },
});
