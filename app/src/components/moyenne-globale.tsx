import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Carte } from "@/components/carte";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { totauxDesJournees } from "@/donnees/objectifs";
import { useCouleursJauge, useTheme } from "@/hooks/use-theme";
import {
  NUTRIMENTS,
  PERIODES_DE_MOYENNE,
  debutDePeriode,
  etatDeJauge,
  formaterQuantite,
  libelleDePeriode,
  libelleDuNutriment,
  moyenneGlobale,
  type ObjectifsJournaliers,
  type PeriodeDeMoyenne,
} from "@noyau";

/**
 * Moyenne par Journée sur la période choisie (30 jours par défaut), face aux Objectifs journaliers, en tableau
 * compact : la moyenne prend la couleur de l'état de sa jauge. Seules les Journées avec un Repas analysé comptent.
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
  const theme = useTheme();
  const couleurs = useCouleursJauge();
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

  const nombre = resultat?.nombreDeJournees ?? 0;
  const moyenne = resultat?.moyenne;

  return (
    <Carte
      titre="Moyenne"
      detail={moyenne ? `Par Journée renseignée · sur ${nombre} Journée${nombre > 1 ? "s" : ""}` : "Par Journée renseignée"}>
      <Puces options={PERIODES_DE_MOYENNE} valeur={periode} libelle={libelleDePeriode} onChange={setPeriode} />
      {moyenne ? (
        <View>
          <View style={styles.ligne}>
            <ThemedText type="detail" style={[styles.nom, styles.entete]}>
              Nutriment
            </ThemedText>
            <ThemedText type="detail" style={[styles.nombre, styles.entete]}>
              Moyenne
            </ThemedText>
            <ThemedText type="detail" style={[styles.nombre, styles.entete]}>
              Objectif
            </ThemedText>
          </View>
          {NUTRIMENTS.map((n) => {
            const objectif = objectifs[n];
            const etat = etatDeJauge(n, moyenne[n], objectif).etat;
            return (
              <View key={n} style={[styles.ligne, styles.separee, { borderTopColor: theme.bordure }]}>
                <ThemedText style={styles.nom}>{libelleDuNutriment(n)}</ThemedText>
                <ThemedText type="smallBold" style={[styles.nombre, { color: couleurs[etat] }]}>
                  {formaterQuantite(n, moyenne[n])}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.nombre}>
                  {objectif === null ? "—" : formaterQuantite(n, objectif)}
                </ThemedText>
              </View>
            );
          })}
        </View>
      ) : (
        resultat && <ThemedText themeColor="textSecondary">Aucune Journée renseignée sur cette période.</ThemedText>
      )}
    </Carte>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.two, paddingVertical: Spacing.two },
  separee: { borderTopWidth: StyleSheet.hairlineWidth },
  entete: { fontWeight: 700 },
  nom: { flex: 1.3 },
  nombre: { flex: 1, textAlign: "right" },
});
