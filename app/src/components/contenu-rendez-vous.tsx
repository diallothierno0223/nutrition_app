import { StyleSheet, View } from "react-native";

import { CarteRecette } from "@/components/carte-recette";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { formaterSamedi, type RendezVous } from "@/donnees/samedi";
import { CATEGORIES_DE_RECETTE, libelleDeCategorieDeRecette } from "@noyau";

/** Le Rendez-vous du samedi : Bilan de la semaine, puis Recettes et petits-déjeuners par catégorie. */
export function ContenuRendezVous({ rendezVous }: { rendezVous: RendezVous }) {
  return (
    <View style={styles.bloc}>
      <ThemedText type="small" themeColor="textSecondary">
        Semaine du {formaterSamedi(rendezVous.samedi)}
      </ThemedText>
      <ThemedText type="smallBold">Bilan de la semaine</ThemedText>
      <ThemedText>{rendezVous.bilan}</ThemedText>

      {CATEGORIES_DE_RECETTE.map((categorie) => {
        const recettes = rendezVous.recettes.filter((r) => r.categorie === categorie);
        if (recettes.length === 0) return null;
        return (
          <View key={categorie} style={styles.bloc}>
            <ThemedText type="smallBold">{libelleDeCategorieDeRecette(categorie)}</ThemedText>
            {recettes.map((recette) => (
              <CarteRecette key={recette.id} recette={recette} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
});
