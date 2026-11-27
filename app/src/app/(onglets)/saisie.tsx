import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { Champ } from "@/components/champ";
import { Ecran } from "@/components/ecran";
import { ListeDePlats } from "@/components/liste-de-plats";
import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import type { PhotoChoisie } from "@/donnees/photos";
import { listerPlats, listerPlatsDeLaSemaine, type Plat } from "@/donnees/plats";
import { saisirRepas } from "@/donnees/repas";
import { rafraichirNotifications } from "@/notifications/programmation";

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
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<PhotoChoisie | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [plats, setPlats] = useState<Plat[]>([]);
  const [platsDeLaSemaine, setPlatsDeLaSemaine] = useState<Plat[]>([]);

  // Rechargés à chaque retour sur l'onglet : un Plat créé ou supprimé ailleurs apparaît ou disparaît.
  useFocusEffect(
    useCallback(() => {
      listerPlatsDeLaSemaine().then(setPlatsDeLaSemaine, () => undefined);
      listerPlats().then(setPlats, () => undefined);
    }, []),
  );

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
      rafraichirNotifications();
      router.push({ pathname: "/repas/[id]", params: { id: repasId } });
    } catch {
      setErreur("Le Repas n'a pas pu être enregistré. Vérifie ta connexion.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Ecran titre="Saisie">
      <Carte
        titre="Nouveau Repas"
        detail={
          photo
            ? "Ajoute une note si tu veux : huile, cuisson, sauce, quantité."
            : "Décris-le (plats, quantités, huile ou sauce), ou prends-le en photo : l'IA l'analyse."
        }>
        {photo ? (
          <View style={styles.photo}>
            <Image source={{ uri: photo.uri }} style={styles.apercu} contentFit="cover" />
            <Bouton libelle="Retirer la photo" variante="discret" onPress={() => setPhoto(null)} desactive={envoi} />
          </View>
        ) : (
          <View style={styles.actions}>
            <Bouton libelle="Prendre une photo" variante="secondaire" onPress={() => choisirPhoto("camera")} />
            <Bouton libelle="Choisir dans la galerie" variante="secondaire" onPress={() => choisirPhoto("galerie")} />
          </View>
        )}

        <Champ
          libelle={photo ? "Note" : "Description"}
          placeholder={
            photo ? "Ex. : cuit à l'huile de palme, sauce à part" : "Ex. : une louche de mafé au poulet avec un bol de riz, une banane"
          }
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
      </Carte>

      <ListeDePlats titre="Plats de la semaine" detail="Du Rendez-vous du samedi, pour une portion" plats={platsDeLaSemaine} />
      <ListeDePlats titre="Mes Plats" plats={plats} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  photo: { gap: Spacing.two },
  apercu: { width: "100%", aspectRatio: 4 / 3, borderRadius: Rayons.petit },
});
