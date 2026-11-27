import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Carte } from "@/components/carte";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { TotauxDUneJournee } from "@/donnees/objectifs";
import { useCouleursJauge, useTheme } from "@/hooks/use-theme";
import {
  NUTRIMENTS,
  etatDeJauge,
  formaterQuantite,
  journeesDeLaSemaine,
  libelleDEtat,
  libelleDuNutriment,
  objectifsHebdomadaires,
  type Nutriment,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "@noyau";

const INITIALES = ["L", "M", "M", "J", "V", "S", "D"];
const HAUTEUR = 120;

/**
 * La Semaine (lundi–dimanche) d'un nutriment au choix : un graphique jour par jour face à l'Objectif journalier
 * (pointillés), et le total de la Semaine face à l'Objectif hebdomadaire.
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
  const couleurs = useCouleursJauge();
  const [nutriment, setNutriment] = useState<Nutriment>("calories");

  const objectif = objectifs[nutriment];
  const objectifSemaine = objectifsHebdomadaires(objectifs)[nutriment];
  const total = totauxSemaine[nutriment];
  const etatSemaine = etatDeJauge(nutriment, total, objectifSemaine).etat;
  const mention = libelleDEtat(etatSemaine);
  const parJour = journeesDeLaSemaine(aujourdhui).map((journee) => ({
    journee,
    valeur: journees.find((j) => j.journee === journee)?.[nutriment] ?? 0,
  }));
  // L'échelle couvre l'Objectif (trait de repère) et le plus haut jour.
  const maximum = Math.max(objectif ?? 0, ...parJour.map((j) => j.valeur), 1);

  return (
    <Carte titre="Semaine" detail="Face à l'Objectif hebdomadaire">
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
                  height: Math.max((valeur / maximum) * HAUTEUR, valeur > 0 ? 3 : 0),
                  backgroundColor: couleurs[etatDeJauge(nutriment, valeur, objectif).etat],
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
            style={[styles.initiale, { color: journee === aujourdhui ? theme.accent : theme.textSecondary }]}>
            {INITIALES[i]}
          </ThemedText>
        ))}
      </View>
      <ThemedText>
        {libelleDuNutriment(nutriment)} : <ThemedText type="smallBold">{formaterQuantite(nutriment, total)}</ThemedText>
        {objectifSemaine !== null && ` sur ${formaterQuantite(nutriment, objectifSemaine)}`}
        {mention && <ThemedText style={{ color: couleurs[etatSemaine], fontWeight: 700 }}> · {mention}</ThemedText>}
      </ThemedText>
      {objectif !== null && (
        <ThemedText type="detail">Pointillés : Objectif journalier ({formaterQuantite(nutriment, objectif)}).</ThemedText>
      )}
    </Carte>
  );
}

const styles = StyleSheet.create({
  graphique: { flexDirection: "row", alignItems: "flex-end", gap: Spacing.two },
  repere: { position: "absolute", left: 0, right: 0, borderTopWidth: 1.5, borderStyle: "dashed" },
  colonne: { flex: 1, justifyContent: "flex-end", height: "100%" },
  barre: { borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  legende: { flexDirection: "row", gap: Spacing.two },
  initiale: { flex: 1, textAlign: "center" },
});
