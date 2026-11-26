import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import type { PhotoChoisie } from "@/donnees/photos";
import { saisirRepas } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";

const SOURCES = {
  camera: {
    demanderPermission: ImagePicker.requestCameraPermissionsAsync,
    lancer: ImagePicker.launchCameraAsync,
    refus: "Accès à la caméra refusé.",
  },
  galerie: {
    demanderPermission: ImagePicker.requestMediaLibraryPermissionsAsync,
    lancer: ImagePicker.launchImageLibraryAsync,
    refus: "Accès à la galerie refusé.",
  },
};
type SourcePhoto = keyof typeof SOURCES;

export default function Saisie() {
  const theme = useTheme();
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<PhotoChoisie | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function choisirPhoto(source: SourcePhoto) {
    setErreur(null);
    const { demanderPermission, lancer, refus } = SOURCES[source];
    if (!(await demanderPermission()).granted) {
      setErreur(refus);
      return;
    }
    const resultat = await lancer({ mediaTypes: ["images"], quality: 1 });
    const image = resultat.canceled ? undefined : resultat.assets[0];
    if (image) setPhoto({ uri: image.uri, largeur: image.width, hauteur: image.height });
  }

  async function enregistrer() {
    setEnvoi(true);
    setErreur(null);
    try {
      const repasId = await saisirRepas(description, photo);
      setDescription("");
      setPhoto(null);
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
        {photo
          ? "Ajoute une note si tu veux : huile, cuisson, sauce, quantité."
          : "Décris ton repas (plats, quantités approximatives, huile ou sauce), ou prends-le en photo."}
      </ThemedText>

      {photo ? (
        <View style={styles.photo}>
          <Image source={{ uri: photo.uri }} style={styles.apercu} contentFit="cover" />
          <Bouton libelle="Retirer la photo" variante="secondaire" onPress={() => setPhoto(null)} desactive={envoi} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Bouton libelle="Prendre une photo" variante="secondaire" onPress={() => choisirPhoto("camera")} />
          <Bouton libelle="Galerie" variante="secondaire" onPress={() => choisirPhoto("galerie")} />
        </View>
      )}

      <TextInput
        style={[styles.champ, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        placeholder={
          photo ? "Ex. : cuit à l'huile de palme, sauce à part" : "Ex. : une louche de mafé au poulet avec un bol de riz, une banane"
        }
        placeholderTextColor={theme.textSecondary}
        multiline
        value={description}
        onChangeText={setDescription}
      />
      {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
      <Bouton
        libelle="Analyser et enregistrer"
        onPress={enregistrer}
        desactive={!photo && !description.trim()}
        enCours={envoi}
      />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  champ: { borderRadius: 12, padding: Spacing.three, fontSize: 16, minHeight: 120, textAlignVertical: "top" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  photo: { gap: Spacing.two },
  apercu: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12 },
});
