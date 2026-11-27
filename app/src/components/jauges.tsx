import { StyleSheet, View } from "react-native";

import { BarreDeJauge } from "@/components/barre-de-jauge";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useCouleursJauge } from "@/hooks/use-theme";
import {
  NUTRIMENTS,
  etatDeJauge,
  formaterQuantite,
  libelleDEtat,
  libelleDuNutriment,
  libelleDuSens,
  sensDuNutriment,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "@noyau";

/**
 * Les jauges du jour : consommation face à l'Objectif journalier, colorées selon leur état. Sous chaque nutriment,
 * ce que demande son Objectif (« à ne pas dépasser », « à atteindre », « à ±10 % »).
 */
export function Jauges({ totaux, objectifs }: { totaux: ValeursNutritionnelles; objectifs: ObjectifsJournaliers }) {
  const couleurs = useCouleursJauge();
  return (
    <View style={styles.liste}>
      {NUTRIMENTS.map((n) => {
        const objectif = objectifs[n];
        const jauge = etatDeJauge(n, totaux[n], objectif);
        const mention = libelleDEtat(jauge.etat);
        return (
          <View key={n} style={styles.jauge}>
            <View style={styles.entete}>
              <View style={styles.nom}>
                <ThemedText type="smallBold">{libelleDuNutriment(n)}</ThemedText>
                {objectif !== null && <ThemedText type="detail">{libelleDuSens(sensDuNutriment(n))}</ThemedText>}
              </View>
              <View style={styles.valeurs}>
                <ThemedText type="small" themeColor="textSecondary">
                  {formaterQuantite(n, totaux[n])}
                  {objectif !== null && ` / ${formaterQuantite(n, objectif)}`}
                </ThemedText>
                {mention && (
                  <ThemedText type="detail" style={[styles.mention, { color: couleurs[jauge.etat] }]}>
                    {mention}
                  </ThemedText>
                )}
              </View>
            </View>
            <BarreDeJauge jauge={jauge} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  liste: { gap: Spacing.three - 2 },
  jauge: { gap: Spacing.one + 1 },
  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: Spacing.two },
  nom: { flexShrink: 1 },
  valeurs: { alignItems: "flex-end" },
  mention: { fontWeight: 700 },
});
