import { StyleSheet, View } from "react-native";

import { BarreDeJauge } from "@/components/barre-de-jauge";
import { Carte } from "@/components/carte";
import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { useCouleursJauge, useTheme } from "@/hooks/use-theme";
import {
  etatDeJauge,
  formaterNombre,
  libelleDEtat,
  libelleDuNutriment,
  resumeDuJour,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "@noyau";

/** En tête du Dashboard : les calories du jour, ce qui en reste, et les nutriments dépassés ou proches du plafond. */
export function ResumeDuJour({ totaux, objectifs }: { totaux: ValeursNutritionnelles; objectifs: ObjectifsJournaliers }) {
  const theme = useTheme();
  const couleurs = useCouleursJauge();
  const resume = resumeDuJour(totaux, objectifs);

  const alertes = [
    ...resume.depasses.map((n) => ({ n, etat: "depasse" as const, fond: couleurs.depasseDoux })),
    ...resume.proches.map((n) => ({ n, etat: "approche" as const, fond: couleurs.approcheDoux })),
  ];

  return (
    <Carte style={{ backgroundColor: theme.backgroundSelected }}>
      <ThemedText type="small" themeColor="textSecondary">
        Calories du jour
      </ThemedText>
      <View style={styles.chiffres}>
        <ThemedText style={styles.calories}>{formaterNombre(resume.calories, 0)}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sur}>
          {resume.objectifCalories === null ? "kcal" : `kcal sur ${formaterNombre(resume.objectifCalories, 0)}`}
        </ThemedText>
      </View>
      {resume.resteCalories !== null && (
        <ThemedText type="smallBold" style={[styles.reste, { color: couleurs[resume.etatCalories] }]}>
          {resume.resteCalories > 0 ? `Reste ${formaterNombre(resume.resteCalories, 0)} kcal` : "Objectif de calories atteint"}
        </ThemedText>
      )}
      {resume.objectifCalories === null ? (
        <ThemedText type="detail">Pas d'Objectif de calories : estime-le dans l'onglet Objectifs.</ThemedText>
      ) : (
        <BarreDeJauge jauge={etatDeJauge("calories", resume.calories, resume.objectifCalories)} />
      )}
      {alertes.length > 0 && (
        <View style={styles.alertes}>
          {alertes.map(({ n, etat, fond }) => (
            <View key={n} style={[styles.alerte, { backgroundColor: fond }]}>
              <ThemedText type="detail" style={[styles.texteAlerte, { color: couleurs[etat] }]}>
                {libelleDuNutriment(n)} : {libelleDEtat(etat)}
              </ThemedText>
            </View>
          ))}
        </View>
      )}
    </Carte>
  );
}

const styles = StyleSheet.create({
  chiffres: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: Spacing.two },
  calories: { fontSize: 36, lineHeight: 42, fontWeight: 700 },
  sur: { flexShrink: 1 },
  reste: { fontSize: 16 },
  alertes: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  alerte: { borderRadius: Rayons.puce, paddingVertical: Spacing.one, paddingHorizontal: Spacing.two + 2 },
  texteAlerte: { fontWeight: 700 },
});
