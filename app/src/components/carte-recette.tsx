import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { ThemedText } from "@/components/themed-text";
import { ValeursNutritionnelles } from "@/components/valeurs-nutritionnelles";
import { Spacing } from "@/constants/theme";
import { marquerARefaire, type RecetteEnregistree } from "@/donnees/samedi";
import { useEnvoi } from "@/hooks/use-envoi";
import { useTheme } from "@/hooks/use-theme";
import { formaterNombre, nutrimentsParPortion } from "@noyau";

/** Une Recette du Rendez-vous : repliée (nom, portions), dépliée (ingrédients, étapes, conservation, nutriments). */
export function CarteRecette({ recette, actions }: { recette: RecetteEnregistree; actions?: ReactNode }) {
  const theme = useTheme();
  const [ouverte, setOuverte] = useState(false);
  const [aRefaire, setARefaire] = useState(recette.a_refaire);
  const { envoi, erreur, envoyer } = useEnvoi();

  async function basculer() {
    const voulu = !aRefaire;
    if (await envoyer(() => marquerARefaire(recette.id, voulu))) setARefaire(voulu);
  }

  return (
    <View style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
      <Pressable onPress={() => setOuverte((o) => !o)} style={styles.entete}>
        <ThemedText type="smallBold" style={styles.nom}>
          {recette.nom}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {recette.portions} portion{recette.portions > 1 ? "s" : ""} {ouverte ? "▲" : "▼"}
        </ThemedText>
      </Pressable>

      {ouverte && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Par portion
          </ThemedText>
          <ValeursNutritionnelles valeurs={nutrimentsParPortion(recette)} />

          <ThemedText type="smallBold">Ingrédients</ThemedText>
          {recette.ingredients.map((i) => (
            <ThemedText key={i.id} type="small">
              • {i.nom} : {formaterNombre(i.quantite)} {i.unite}
              {i.equivalent_cuisine ? ` (${i.equivalent_cuisine})` : ""}
            </ThemedText>
          ))}

          <ThemedText type="smallBold">Étapes</ThemedText>
          {recette.etapes.map((etape, i) => (
            <ThemedText key={i} type="small">
              {i + 1}. {etape}
            </ThemedText>
          ))}

          <ThemedText type="small">
            <ThemedText type="smallBold">Conservation : </ThemedText>
            {recette.conservation}
          </ThemedText>
          <ThemedText type="small">
            <ThemedText type="smallBold">Ordre conseillé : </ThemedText>
            {recette.ordre_conseille}
          </ThemedText>

          <View style={styles.actions}>
            {recette.categorie === "repas" && (
              <Bouton
                libelle={aRefaire ? "★ À refaire" : "☆ Marquer à refaire"}
                variante="secondaire"
                onPress={basculer}
                enCours={envoi}
              />
            )}
            {actions}
          </View>
          {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  entete: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: Spacing.two },
  nom: { flex: 1 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});
