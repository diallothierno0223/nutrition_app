import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { creerPlat } from "@/donnees/plats";
import { useEnvoi } from "@/hooks/use-envoi";
import type { Constituant } from "@noyau";

/**
 * « Enregistrer comme Plat » : garde des Constituants (ceux d'un Repas, ou d'une Recette pour une portion)
 * comme Plat réutilisable, sous un nom choisi.
 */
export function EnregistrerCommePlat({
  nomPropose,
  constituants,
  libelle = "Enregistrer comme Plat",
}: {
  nomPropose: string;
  constituants: readonly Constituant[];
  libelle?: string;
}) {
  const [nom, setNom] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const { envoi, erreur, envoyer } = useEnvoi("Enregistrement impossible. Vérifie ta connexion.");

  async function enregistrer() {
    const choisi = nom?.trim();
    if (choisi && (await envoyer(() => creerPlat(choisi, constituants)))) {
      setNom(null);
      setEnregistre(true);
    }
  }

  if (constituants.length === 0) return null;
  if (enregistre) return <ThemedText themeColor="textSecondary">Enregistré dans tes Plats.</ThemedText>;
  if (nom === null) return <Bouton libelle={libelle} variante="secondaire" onPress={() => setNom(nomPropose)} />;

  return (
    <View style={styles.bloc}>
      <Champ placeholder="Nom du Plat" value={nom} onChangeText={setNom} />
      {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
      <View style={styles.actions}>
        <Bouton libelle="Enregistrer" variante="secondaire" onPress={enregistrer} desactive={!nom.trim()} enCours={envoi} />
        <Bouton libelle="Annuler" variante="discret" onPress={() => setNom(null)} desactive={envoi} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});
