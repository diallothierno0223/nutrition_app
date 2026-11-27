import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { ContenuRendezVous } from "@/components/contenu-rendez-vous";
import { Ecran } from "@/components/ecran";
import { ReglagesDuSamedi } from "@/components/reglages-du-samedi";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { fuseauDuTelephone } from "@/donnees/repas";
import { dernierRendezVous, genererRendezVous, type RendezVous } from "@/donnees/samedi";
import { rendezVousManquant } from "@noyau";

export default function Samedi() {
  const [rendezVous, setRendezVous] = useState<RendezVous | null | undefined>(undefined);
  const [generation, setGeneration] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      const dernier = await dernierRendezVous();
      setRendezVous(dernier);
      return dernier;
    } catch {
      setMessage("La base ne répond pas.");
      return undefined;
    }
  }, []);

  // Si le samedi est passé 6 h et que rien n'est prêt (traitement automatique en échec), on génère tout de suite.
  useFocusEffect(
    useCallback(() => {
      charger().then((dernier) => {
        if (dernier !== undefined && rendezVousManquant(new Date(), fuseauDuTelephone(), dernier?.samedi ?? null)) {
          generer(false);
        }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [charger]),
  );

  async function generer(force: boolean) {
    setGeneration(true);
    setMessage(null);
    try {
      await genererRendezVous(force);
      await charger();
    } catch {
      setMessage("La génération a échoué. Vérifie ta connexion et réessaie.");
    } finally {
      setGeneration(false);
    }
  }

  function confirmerNouvelleGeneration() {
    Alert.alert(
      "Nouvelle génération ?",
      "Les Recettes de la semaine seront remplacées par de nouvelles (celles marquées « à refaire » peuvent revenir).",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Regénérer", onPress: () => generer(true) },
      ],
    );
  }

  return (
    <Ecran titre="Rendez-vous du samedi">
      {generation && (
        <View style={styles.progression}>
          <ActivityIndicator />
          <ThemedText themeColor="textSecondary">Préparation de ton Rendez-vous… (jusqu'à une minute)</ThemedText>
        </View>
      )}
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}

      {rendezVous === null && !generation && (
        <>
          <ThemedText themeColor="textSecondary">
            Aucun Rendez-vous pour l'instant. Il est préparé chaque samedi à partir de 6 h ; tu peux aussi le lancer
            maintenant.
          </ThemedText>
          <Bouton libelle="Préparer mon Rendez-vous" onPress={() => generer(false)} />
        </>
      )}

      {rendezVous && (
        <>
          <Bouton
            libelle="Liste de courses"
            onPress={() => router.push({ pathname: "/courses/[id]", params: { id: rendezVous.id } })}
          />
          <ContenuRendezVous rendezVous={rendezVous} />
          <View style={styles.actions}>
            <Bouton
              libelle="Nouvelle génération"
              variante="secondaire"
              onPress={confirmerNouvelleGeneration}
              desactive={generation}
            />
            <Bouton libelle="Rendez-vous passés" variante="secondaire" onPress={() => router.push("/rendez-vous")} />
          </View>
        </>
      )}

      <ReglagesDuSamedi />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  progression: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});
