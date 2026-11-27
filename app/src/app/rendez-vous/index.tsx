import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { formaterSamedi, listerRendezVous, type ResumeRendezVous } from "@/donnees/samedi";
import { useTheme } from "@/hooks/use-theme";

/** Historique des Rendez-vous du samedi, du plus récent au plus ancien. */
export default function RendezVousPasses() {
  const theme = useTheme();
  const [liste, setListe] = useState<ResumeRendezVous[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    listerRendezVous().then(setListe, () => setErreur(true));
  }, []);

  return (
    <Ecran>
      {erreur && <ThemedText themeColor="textSecondary">La base ne répond pas.</ThemedText>}
      {liste?.length === 0 && <ThemedText themeColor="textSecondary">Aucun Rendez-vous pour l'instant.</ThemedText>}
      {liste?.map((rdv) => (
        <Pressable
          key={rdv.id}
          onPress={() => router.push({ pathname: "/rendez-vous/[id]", params: { id: rdv.id } })}
          style={[styles.ligne, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText>Semaine du {formaterSamedi(rdv.samedi)}</ThemedText>
        </Pressable>
      ))}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  ligne: { borderRadius: 12, padding: Spacing.three },
});
