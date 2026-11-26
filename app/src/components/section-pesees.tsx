import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { enregistrerPesee, supprimerPesee, type Pesee } from "@/donnees/profil";
import { fuseauDuTelephone } from "@/donnees/repas";
import { lireNombre } from "@/lib/saisie";
import { estUneJourneeValide, journeeDe } from "@noyau";

/** Ajout d'une Pesée (une par date) et liste des dernières, supprimables. */
export function SectionPesees({ pesees, onChange }: { pesees: Pesee[]; onChange: () => void }) {
  const [poids, setPoids] = useState("");
  const [date, setDate] = useState(() => journeeDe(new Date(), fuseauDuTelephone()));
  const [message, setMessage] = useState<string | null>(null);

  async function ajouter() {
    const valeur = lireNombre(poids);
    if (valeur == null || valeur < 20 || valeur > 400) return setMessage("Poids entre 20 et 400 kg.");
    if (!estUneJourneeValide(date)) return setMessage("Date au format AAAA-MM-JJ.");
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
        <Champ style={styles.moitie} placeholder="AAAA-MM-JJ" value={date} onChangeText={setDate} />
      </View>
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton libelle="Ajouter la Pesée" variante="secondaire" onPress={ajouter} desactive={!poids.trim()} />
      {pesees.slice(0, 5).map((p) => (
        <View key={p.id} style={styles.pesee}>
          <ThemedText>
            {p.pese_le} · {p.poids_kg} kg
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
