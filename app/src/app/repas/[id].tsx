import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { ValeursNutritionnelles } from "@/components/valeurs-nutritionnelles";
import { Spacing } from "@/constants/theme";
import { adresseDePhoto } from "@/donnees/photos";
import { analyserRepas, chargerRepas, type RepasDetaille } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";
import { libelleDuTypeDeRepas, totauxDuRepas } from "@noyau";

export default function DetailRepas() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [repas, setRepas] = useState<RepasDetaille | null | undefined>(undefined);
  const [relance, setRelance] = useState(false);
  const [adressePhoto, setAdressePhoto] = useState<string | null>(null);

  const charger = useCallback(() => chargerRepas(id).then(setRepas, () => setRepas(null)), [id]);
  useEffect(() => {
    charger();
  }, [charger]);

  const photoChemin = repas?.photo_chemin;
  useEffect(() => {
    setAdressePhoto(null);
    if (photoChemin) adresseDePhoto(photoChemin).then(setAdressePhoto, () => setAdressePhoto(null));
  }, [photoChemin]);

  async function relancer() {
    setRelance(true);
    try {
      await analyserRepas(id);
      await charger();
    } finally {
      setRelance(false);
    }
  }

  if (repas === undefined) return <Ecran />;
  if (repas === null) {
    return (
      <Ecran>
        <ThemedText>Ce Repas est introuvable.</ThemedText>
      </Ecran>
    );
  }

  const heure = new Date(repas.mange_le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Ecran>
      <Stack.Screen options={{ title: `${libelleDuTypeDeRepas(repas.type_repas)} · ${heure}` }} />
      {adressePhoto && <Image source={{ uri: adressePhoto }} style={styles.photo} contentFit="cover" />}
      {repas.description !== "" && <ThemedText>{repas.description}</ThemedText>}

      {repas.statut === "en_attente" ? (
        <>
          <ThemedText themeColor="textSecondary">
            {repas.erreur_analyse ? "L'analyse a échoué." : "Analyse en attente."} Ce Repas n'est pas compté dans les jauges.
          </ThemedText>
          <Bouton libelle="Relancer l'analyse" onPress={relancer} enCours={relance} />
        </>
      ) : (
        <>
          <ThemedText type="smallBold">Total</ThemedText>
          <ValeursNutritionnelles valeurs={totauxDuRepas(repas.constituants)} />

          <ThemedText type="smallBold">Constituants</ThemedText>
          {repas.constituants.map((c, i) => (
            <View key={i} style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText>{c.nom}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {c.quantite} {c.unite} · {c.equivalent_cuisine}
              </ThemedText>
              <ValeursNutritionnelles valeurs={c} />
            </View>
          ))}

          {repas.commentaire && (
            <>
              <ThemedText type="smallBold">Commentaire du repas</ThemedText>
              <ThemedText>{repas.commentaire}</ThemedText>
            </>
          )}
        </>
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12 },
});
