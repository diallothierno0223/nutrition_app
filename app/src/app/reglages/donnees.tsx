import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { ConnexionPerdue, PartageIndisponible, exporterMesDonnees } from "@/donnees/export";

/** Réglages › Données : export de toutes les données dans un ZIP de CSV, à enregistrer hors de l'app. */
export default function ReglagesDonnees() {
  const [avecPhotos, setAvecPhotos] = useState(true);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [progression, setProgression] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function exporter() {
    setExportEnCours(true);
    setMessage(null);
    try {
      const { photosManquantes } = await exporterMesDonnees({
        avecPhotos,
        onProgression: (faites, total) => setProgression(`Photos : ${faites} sur ${total}`),
      });
      if (photosManquantes > 0) {
        setMessage(
          `${photosManquantes} photo(s) n'ont pas pu être copiées dans le ZIP (colonne « fichier » vide dans photos.csv). Relance l'export pour les récupérer.`,
        );
      }
    } catch (e) {
      const clair = e instanceof PartageIndisponible || e instanceof ConnexionPerdue;
      setMessage(clair ? e.message : "Export impossible. Vérifie ta connexion.");
    } finally {
      setExportEnCours(false);
      setProgression(null);
    }
  }

  return (
    <Ecran>
      <ThemedText>
        L'export rassemble toutes tes données (Repas, Pesées, Objectifs, Règles, Plats, Rendez-vous…) dans un fichier
        ZIP de tableaux CSV. Choisis ensuite où l'enregistrer : sur le téléphone, dans Drive…
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        La base gratuite de Supabase n'est pas sauvegardée automatiquement, photos comprises : cet export est ta copie
        de secours. Un rappel arrive le 1er de chaque mois (réglable dans Notifications).
      </ThemedText>

      <View style={styles.ligne}>
        <View style={styles.libelle}>
          <ThemedText>Inclure les photos</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Plus long et plus lourd (quelques centaines de Ko par photo). Sans elles, photos.csv donne un lien valable
            7 jours pour chacune.
          </ThemedText>
        </View>
        <Switch
          value={avecPhotos}
          onValueChange={setAvecPhotos}
          disabled={exportEnCours}
          accessibilityLabel="Inclure les photos"
        />
      </View>

      {progression && <ThemedText themeColor="textSecondary">{progression}</ThemedText>}
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton libelle="Exporter mes données" onPress={exporter} enCours={exportEnCours} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  libelle: { flex: 1, gap: Spacing.one },
});
