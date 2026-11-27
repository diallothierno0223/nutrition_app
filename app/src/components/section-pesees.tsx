import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { ChampDate } from "@/components/champ-date-heure";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { enregistrerPesee, supprimerPesee, type Pesee } from "@/donnees/profil";
import { fuseauDuTelephone } from "@/donnees/repas";
import { lireNombre } from "@/lib/saisie";
import { POIDS_MAX_KG, POIDS_MIN_KG, journeeDe, libelleDeJournee } from "@noyau";

/** Ajout d'une Pesée (une par date) et liste des dernières, supprimables. */
export function SectionPesees({ pesees, onChange }: { pesees: Pesee[]; onChange: () => void }) {
  const [poids, setPoids] = useState("");
  const aujourdhui = journeeDe(new Date(), fuseauDuTelephone());
  const [date, setDate] = useState(aujourdhui);
  const [message, setMessage] = useState<string | null>(null);

  async function ajouter() {
    const valeur = lireNombre(poids);
    if (valeur == null || valeur < POIDS_MIN_KG || valeur > POIDS_MAX_KG) {
      return setMessage(`Poids entre ${POIDS_MIN_KG} et ${POIDS_MAX_KG} kg.`);
    }
    try {
      await enregistrerPesee(date, valeur);
      setPoids("");
      setMessage(null);
      onChange();
    } catch {
      setMessage("Enregistrement impossible. Vérifie ta connexion.");
    }
  }

  async function supprimer(id: string) {
    try {
      await supprimerPesee(id);
      onChange();
    } catch {
      setMessage("Suppression impossible. Vérifie ta connexion.");
    }
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">Pesées</ThemedText>
      <View style={styles.ligne}>
        <Champ style={styles.moitie} placeholder="Poids (kg)" keyboardType="decimal-pad" value={poids}
          onChangeText={setPoids} />
        <ChampDate style={styles.moitie} placeholder="Date" valeur={date} onChange={setDate} max={aujourdhui} />
      </View>
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton libelle="Ajouter la Pesée" variante="secondaire" onPress={ajouter} desactive={!poids.trim()} />
      {pesees.slice(0, 5).map((p) => (
        <View key={p.id} style={styles.pesee}>
          <ThemedText>
            {libelleDeJournee(p.pese_le)} · {p.poids_kg} kg
          </ThemedText>
          <Bouton libelle="Supprimer" variante="secondaire" onPress={() => supprimer(p.id)} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  ligne: { flexDirection: "row", gap: Spacing.two },
  moitie: { flex: 1 },
  pesee: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
