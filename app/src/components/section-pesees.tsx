import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { Champ } from "@/components/champ";
import { ChampDate } from "@/components/champ-date-heure";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { enregistrerPesee, supprimerPesee, type Pesee } from "@/donnees/profil";
import { fuseauDuTelephone } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";
import { lireNombre } from "@/lib/saisie";
import { messageDEchec } from "@/synchro/reseau";
import { POIDS_MAX_KG, POIDS_MIN_KG, formaterNombre, journeeDe, libelleDeJournee } from "@noyau";

/** Ajout d'une Pesée (une par date) et liste des dernières, supprimables. */
export function SectionPesees({ pesees, onChange }: { pesees: Pesee[]; onChange: () => void }) {
  const theme = useTheme();
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
    } catch (e) {
      setMessage(messageDEchec(e, "Enregistrement impossible. Vérifie ta connexion."));
    }
  }

  async function supprimer(id: string) {
    try {
      await supprimerPesee(id);
      onChange();
    } catch (e) {
      setMessage(messageDEchec(e, "Suppression impossible. Vérifie ta connexion."));
    }
  }

  return (
    <Carte titre="Pesées" detail="Une par date ; Health Connect en ajoute aussi">
      <View style={styles.ligne}>
        <Champ
          style={styles.moitie}
          libelle="Poids (kg)"
          placeholder="ex. 71,8"
          keyboardType="decimal-pad"
          value={poids}
          onChangeText={setPoids}
        />
        <ChampDate style={styles.moitie} libelle="Date" placeholder="Choisir" valeur={date} onChange={setDate} max={aujourdhui} />
      </View>
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton libelle="Ajouter la Pesée" variante="secondaire" onPress={ajouter} desactive={!poids.trim()} />
      {pesees.slice(0, 5).map((p) => (
        <View key={p.id} style={[styles.pesee, { borderTopColor: theme.bordure }]}>
          <ThemedText style={styles.date}>{libelleDeJournee(p.pese_le)}</ThemedText>
          <ThemedText type="smallBold">{formaterNombre(p.poids_kg)} kg</ThemedText>
          <Bouton libelle="Supprimer" variante="discret" onPress={() => supprimer(p.id)} />
        </View>
      ))}
    </Carte>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: "row", gap: Spacing.three - 4 },
  moitie: { flex: 1 },
  pesee: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three - 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.one,
  },
  date: { flex: 1 },
});
