import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Jauges } from "@/components/jauges";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { totauxDesJournees } from "@/donnees/objectifs";
import {
  PERIODES_DE_MOYENNE,
  debutDePeriode,
  libelleDePeriode,
  moyenneGlobale,
  type ObjectifsJournaliers,
  type PeriodeDeMoyenne,
} from "@noyau";

/**
 * Moyenne globale par Journée sur la période choisie (30 jours par défaut), face aux Objectifs journaliers.
 * Seules les Journées avec au moins un Repas analysé comptent.
 */
export function MoyenneGlobale({
  aujourdhui,
  objectifs,
  rafraichissement,
}: {
  aujourdhui: string;
  objectifs: ObjectifsJournaliers;
  /** Change à chaque rechargement du Dashboard, pour suivre les corrections de Repas. */
  rafraichissement: number;
}) {
  const [periode, setPeriode] = useState<PeriodeDeMoyenne>("30_jours");
  const [resultat, setResultat] = useState<ReturnType<typeof moyenneGlobale> | null>(null);

  useEffect(() => {
    let actuel = true;
    totauxDesJournees(debutDePeriode(aujourdhui, periode), aujourdhui).then(
      (journees) => actuel && setResultat(moyenneGlobale(journees)),
      () => actuel && setResultat(null),
    );
    return () => {
      actuel = false;
    };
  }, [aujourdhui, periode, rafraichissement]);

  return (
    <View style={styles.bloc}>
      <ThemedText type="smallBold">Moyenne par Journée</ThemedText>
      <Puces options={PERIODES_DE_MOYENNE} valeur={periode} libelle={libelleDePeriode} onChange={setPeriode} />
      {resultat?.moyenne ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Sur {resultat.nombreDeJournees} Journée{resultat.nombreDeJournees > 1 ? "s" : ""} renseignée
            {resultat.nombreDeJournees > 1 ? "s" : ""}.
          </ThemedText>
          <Jauges totaux={resultat.moyenne} objectifs={objectifs} />
        </>
      ) : (
        resultat && <ThemedText themeColor="textSecondary">Aucune Journée renseignée sur cette période.</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
});
