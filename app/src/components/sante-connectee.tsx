import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useEnvoi } from "@/hooks/use-envoi";
import {
  autoriserSante,
  etatDeSante,
  importerPesees,
  ouvrirReglagesHealthConnect,
  type EtatDeSante,
} from "@/sante/health-connect";

const EXPLICATIONS: Record<EtatDeSante, string> = {
  indisponible: "Health Connect n'est pas disponible sur ce téléphone (installe ou mets à jour l'app Health Connect).",
  a_autoriser: "Autorise la lecture de tes pas et de ton poids : tes pas s'affichent sur le Dashboard et tes pesées deviennent des Pesées.",
  autorise: "Pas et poids lus depuis Health Connect (lecture seule). L'activité n'ajuste pas tes Objectifs.",
};

/** Connexion à Health Connect : état, autorisation, import des Pesées à la demande. */
export function SanteConnectee() {
  const [etat, setEtat] = useState<EtatDeSante | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { envoi, erreur, envoyer } = useEnvoi("Health Connect ne répond pas.");

  useEffect(() => {
    etatDeSante().then(setEtat);
  }, []);

  if (!etat) return null;

  return (
    <Carte titre="Health Connect">
      <ThemedText themeColor="textSecondary">{EXPLICATIONS[etat]}</ThemedText>
      <View style={styles.actions}>
        {etat === "a_autoriser" && (
          <Bouton
            libelle="Autoriser"
            variante="secondaire"
            onPress={() => envoyer(async () => setEtat(await autoriserSante()))}
            enCours={envoi}
          />
        )}
        {etat === "autorise" && (
          <Bouton
            libelle="Importer mes pesées"
            variante="secondaire"
            onPress={() =>
              envoyer(async () => {
                const nombre = await importerPesees();
                setMessage(nombre === 0 ? "Aucune nouvelle Pesée." : `${nombre} Pesée${nombre > 1 ? "s" : ""} ajoutée${nombre > 1 ? "s" : ""}.`);
              })
            }
            enCours={envoi}
          />
        )}
        {etat !== "indisponible" && (
          <Bouton libelle="Réglages Health Connect" variante="secondaire" onPress={ouvrirReglagesHealthConnect} />
        )}
      </View>
      {(erreur ?? message) && <ThemedText themeColor="textSecondary">{erreur ?? message}</ThemedText>}
    </Carte>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});
