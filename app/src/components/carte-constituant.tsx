import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { ThemedText } from "@/components/themed-text";
import { ValeursNutritionnelles } from "@/components/valeurs-nutritionnelles";
import { Spacing } from "@/constants/theme";
import { useEnvoi } from "@/hooks/use-envoi";
import { useTheme } from "@/hooks/use-theme";
import { lireNombre } from "@/lib/saisie";
import {
  changerEquivalentCuisine,
  changerQuantite,
  formaterNombre,
  lireEquivalentCuisine,
  type Constituant,
} from "@noyau";

/** La correction en cours : une quantité en g/ml, ou un nombre d'ustensiles (équivalent en cuisine). */
type Saisie = { en: "quantite" | "ustensiles"; texte: string };

/** Le Constituant corrigé d'après la saisie, null tant que la saisie n'est pas exploitable. */
function apercu(constituant: Constituant, saisie: Saisie): Constituant | null {
  const nombre = lireNombre(saisie.texte);
  if (!nombre || nombre <= 0) return null;
  try {
    return saisie.en === "quantite" ? changerQuantite(constituant, nombre) : changerEquivalentCuisine(constituant, nombre);
  } catch {
    return null;
  }
}

type Props = {
  constituant: Constituant;
  /** Enregistre le Constituant corrigé (dans un Repas ou dans un Plat). */
  corriger: (corrige: Constituant) => Promise<void>;
  supprimer: () => Promise<void>;
  /** Appelé après une correction ou une suppression réussie. */
  onChange: () => void;
};

/** Un Constituant (d'un Repas ou d'un Plat), corrigeable sans appel à l'IA (quantité ou ustensiles), ou supprimable. */
export function CarteConstituant({ constituant, corriger, supprimer, onChange }: Props) {
  const theme = useTheme();
  const [saisie, setSaisie] = useState<Saisie | null>(null);
  const { envoi, erreur, envoyer } = useEnvoi();

  const equivalent = lireEquivalentCuisine(constituant.equivalent_cuisine);
  const corrige = saisie && apercu(constituant, saisie);
  const affiche = corrige ?? constituant;

  async function agir(action: () => Promise<void>) {
    if (await envoyer(action)) {
      setSaisie(null);
      onChange();
    }
  }

  return (
    <View style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText>{constituant.nom}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {formaterNombre(affiche.quantite)} {affiche.unite}
        {affiche.equivalent_cuisine ? ` · ${affiche.equivalent_cuisine}` : ""}
      </ThemedText>
      <ValeursNutritionnelles valeurs={affiche} />

      {saisie ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Les nutriments sont recalculés en proportion, sans nouvelle analyse.
          </ThemedText>
          <Champ
            placeholder={`Quantité en ${constituant.unite}`}
            keyboardType="decimal-pad"
            value={saisie.en === "quantite" ? saisie.texte : ""}
            onChangeText={(texte) => setSaisie({ en: "quantite", texte })}
          />
          {equivalent && (
            <Champ
              placeholder={`Ou en nombre de « ${equivalent.ustensile} »`}
              keyboardType="decimal-pad"
              value={saisie.en === "ustensiles" ? saisie.texte : ""}
              onChangeText={(texte) => setSaisie({ en: "ustensiles", texte })}
            />
          )}
          {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
          <View style={styles.actions}>
            <Bouton
              libelle="Enregistrer"
              variante="secondaire"
              onPress={() => corrige && agir(() => corriger(corrige))}
              desactive={!corrige}
              enCours={envoi}
            />
            <Bouton libelle="Annuler" variante="discret" onPress={() => setSaisie(null)} desactive={envoi} />
            <Bouton
              libelle="Supprimer"
              variante="secondaire"
              onPress={() => agir(supprimer)}
              desactive={envoi}
            />
          </View>
        </>
      ) : (
        <Bouton
          libelle="Corriger ou supprimer"
          variante="secondaire"
          onPress={() => setSaisie({ en: "quantite", texte: "" })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});
