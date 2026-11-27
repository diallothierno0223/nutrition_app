import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Jauges } from "@/components/jauges";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { formaterValeur } from "@/components/valeurs-nutritionnelles";
import { CouleursJauge, Spacing } from "@/constants/theme";
import type { TotauxDUneJournee } from "@/donnees/objectifs";
import { useTheme } from "@/hooks/use-theme";
import {
  NUTRIMENTS,
  etatDeJauge,
  journeesDeLaSemaine,
  libelleDuNutriment,
  objectifsHebdomadaires,
  type Nutriment,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "@noyau";

const INITIALES = ["L", "M", "M", "J", "V", "S", "D"];
const HAUTEUR = 72;

/**
 * Récapitulatif de la Semaine (lundi–dimanche) : jauges face à l'Objectif hebdomadaire, et mini-graphique
 * d'un nutriment, jour par jour, face à l'Objectif journalier.
 */
export function RecapSemaine({
  aujourdhui,
  totauxSemaine,
  journees,
  objectifs,
}: {
  aujourdhui: string;
  totauxSemaine: ValeursNutritionnelles;
  journees: readonly TotauxDUneJournee[];
  objectifs: ObjectifsJournaliers;
}) {
  const theme = useTheme();
  const [nutriment, setNutriment] = useState<Nutriment>("calories");

  const objectif = objectifs[nutriment];
  const parJour = journeesDeLaSemaine(aujourdhui).map((journee) => ({
    journee,
    valeur: journees.find((j) => j.journee === journee)?.[nutriment] ?? 0,
  }));
  // L'échelle couvre l'Objectif (trait de repère) et le plus haut jour.
  const maximum = Math.max(objectif ?? 0, ...parJour.map((j) => j.valeur), 1);

  return (
    <View style={styles.bloc}>
      <ThemedText type="smallBold">Semaine (face à l'Objectif hebdomadaire)</ThemedText>
      <Jauges totaux={totauxSemaine} objectifs={objectifsHebdomadaires(objectifs)} />

      <Puces options={NUTRIMENTS} valeur={nutriment} libelle={libelleDuNutriment} onChange={setNutriment} />
      <View style={[styles.graphique, { height: HAUTEUR }]}>
        {objectif !== null && (
          <View style={[styles.repere, { bottom: (objectif / maximum) * HAUTEUR, borderColor: theme.textSecondary }]} />
        )}
        {parJour.map(({ journee, valeur }) => (
          <View key={journee} style={styles.colonne}>
            <View
              style={[
                styles.barre,
                {
                  height: Math.max((valeur / maximum) * HAUTEUR, valeur > 0 ? 2 : 0),
                  backgroundColor: CouleursJauge[etatDeJauge(nutriment, valeur, objectif).etat],
                  opacity: journee > aujourdhui ? 0.3 : 1,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.legende}>
        {parJour.map(({ journee }, i) => (
          <ThemedText
            key={journee}
            type={journee === aujourdhui ? "smallBold" : "small"}
            themeColor="textSecondary"
            style={styles.initiale}>
            {INITIALES[i]}
          </ThemedText>
        ))}
      </View>
      {objectif !== null && (
        <ThemedText type="small" themeColor="textSecondary">
          Trait : Objectif journalier ({formaterValeur(nutriment, objectif)}).
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  graphique: { flexDirection: "row", alignItems: "flex-end", gap: Spacing.two },
  repere: { position: "absolute", left: 0, right: 0, borderTopWidth: 1, borderStyle: "dashed" },
  colonne: { flex: 1, justifyContent: "flex-end", height: "100%" },
  barre: { borderRadius: 3 },
  legende: { flexDirection: "row", gap: Spacing.two },
  initiale: { flex: 1, textAlign: "center" },
});
