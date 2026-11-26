import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";

import { Bouton } from "@/components/bouton";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { saisirRepas } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";

export default function Saisie() {
  const theme = useTheme();
  const [description, setDescription] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      const repasId = await saisirRepas(description);
      setDescription("");
      router.push({ pathname: "/repas/[id]", params: { id: repasId } });
    } catch {
      setErreur("Le Repas n'a pas pu être enregistré. Vérifie ta connexion.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Ecran titre="Saisie rapide">
      <ThemedText themeColor="textSecondary">
        Décris ton repas : plats, quantités approximatives, huile ou sauce si tu les connais.
      </ThemedText>
      <TextInput
        style={[styles.champ, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        placeholder="Ex. : une louche de mafé au poulet avec un bol de riz, une banane"
        placeholderTextColor={theme.textSecondary}
        multiline
        value={description}
        onChangeText={setDescription}
      />
      {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
      <Bouton libelle="Analyser et enregistrer" onPress={enregistrer} desactive={!description.trim()} enCours={envoi} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  champ: { borderRadius: 12, padding: Spacing.three, fontSize: 16, minHeight: 140, textAlignVertical: "top" },
});
