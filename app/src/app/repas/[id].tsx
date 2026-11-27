import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";

import { AjoutConstituant } from "@/components/ajout-constituant";
import { Bouton } from "@/components/bouton";
import { CarteConstituant } from "@/components/carte-constituant";
import { Champ } from "@/components/champ";
import { Ecran } from "@/components/ecran";
import { EnregistrerCommePlat } from "@/components/enregistrer-comme-plat";
import { MomentDuRepas } from "@/components/moment-du-repas";
import { ThemedText } from "@/components/themed-text";
import { ValeursNutritionnelles } from "@/components/valeurs-nutritionnelles";
import { adresseDePhoto } from "@/donnees/photos";
import {
  chargerRepas,
  corrigerConstituant,
  relancerAvecPrecision,
  supprimerConstituant,
  supprimerRepas,
  type RepasDetaille,
} from "@/donnees/repas";
import { libelleDuTypeDeRepas, totauxDuRepas } from "@noyau";

export default function DetailRepas() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [repas, setRepas] = useState<RepasDetaille | null | undefined>(undefined);
  const [precision, setPrecision] = useState("");
  const [relance, setRelance] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [adressePhoto, setAdressePhoto] = useState<string | null>(null);

  // Un échec de rechargement (réseau) garde le Repas affiché au lieu de le dire introuvable.
  const charger = useCallback(
    () =>
      chargerRepas(id).then(setRepas, () => {
        setRepas((actuel) => actuel ?? null);
        setMessage("Impossible de recharger le Repas. Vérifie ta connexion.");
      }),
    [id],
  );
  useEffect(() => {
    charger();
  }, [charger]);

  // La précision déjà enregistrée sert de point de départ ; on la reprend quand le Repas change.
  const precisionEnregistree = repas?.precision ?? "";
  useEffect(() => setPrecision(precisionEnregistree), [precisionEnregistree]);

  const photoChemin = repas?.photo_chemin;
  useEffect(() => {
    setAdressePhoto(null);
    if (photoChemin) adresseDePhoto(photoChemin).then(setAdressePhoto, () => setAdressePhoto(null));
  }, [photoChemin]);

  async function relancer() {
    setRelance(true);
    setMessage(null);
    try {
      const { reussie } = await relancerAvecPrecision(id, precision);
      if (!reussie) setMessage("L'analyse a échoué, réessaie plus tard.");
      await charger();
    } catch {
      setMessage("Relance impossible. Vérifie ta connexion.");
    } finally {
      setRelance(false);
    }
  }

  function confirmerSuppression(aSupprimer: RepasDetaille) {
    Alert.alert("Supprimer ce Repas ?", "Il sera retiré de tes jauges et de ton historique.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () =>
          supprimerRepas(aSupprimer).then(
            () => router.back(),
            () => setMessage("Suppression impossible. Vérifie ta connexion."),
          ),
      },
    ]);
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
        <ThemedText themeColor="textSecondary">
          {repas.erreur_analyse ? "L'analyse a échoué." : "Analyse en attente."} Ce Repas n'est pas compté dans les jauges.
        </ThemedText>
      ) : (
        <>
          <ThemedText type="smallBold">Total</ThemedText>
          <ValeursNutritionnelles valeurs={totauxDuRepas(repas.constituants)} />

          <ThemedText type="smallBold">Constituants</ThemedText>
          {repas.constituants.map((c) => (
            <CarteConstituant
              key={c.id}
              constituant={c}
              corriger={(corrige) => corrigerConstituant(c.id, corrige)}
              supprimer={() => supprimerConstituant(c.id)}
              onChange={charger}
            />
          ))}
          <AjoutConstituant repasId={repas.id} onChange={charger} />
          <EnregistrerCommePlat
            nomPropose={repas.description || repas.constituants.map((c) => c.nom).join(", ")}
            constituants={repas.constituants}
          />

          {repas.commentaire && (
            <>
              <ThemedText type="smallBold">Commentaire du repas</ThemedText>
              <ThemedText>{repas.commentaire}</ThemedText>
            </>
          )}
        </>
      )}

      <ThemedText type="smallBold">Précision</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Relancer l'analyse remplace les Constituants (y compris tes corrections à la main) et le Commentaire.
      </ThemedText>
      <Champ
        multiline
        placeholder="Ex. : j'ai ajouté une cuillère d'huile, la sauce était à part"
        value={precision}
        onChangeText={setPrecision}
      />
      <Bouton
        libelle={precision.trim() ? "Relancer l'analyse avec cette précision" : "Relancer l'analyse"}
        onPress={relancer}
        enCours={relance}
      />
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}

      <MomentDuRepas key={repas.mange_le + repas.type_repas} repas={repas} onChange={charger} />
      <Bouton libelle="Supprimer le Repas" variante="secondaire" onPress={() => confirmerSuppression(repas)} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12 },
});
