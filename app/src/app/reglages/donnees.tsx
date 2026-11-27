import { useState } from "react";

import { Bouton } from "@/components/bouton";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { PartageIndisponible, exporterMesDonnees } from "@/donnees/export";

/** Réglages › Données : export de toutes les données dans un ZIP de CSV, à enregistrer hors de l'app. */
export default function ReglagesDonnees() {
  const [exportEnCours, setExportEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exporter() {
    setExportEnCours(true);
    setMessage(null);
    try {
      await exporterMesDonnees();
    } catch (e) {
      setMessage(e instanceof PartageIndisponible ? e.message : "Export impossible. Vérifie ta connexion.");
    } finally {
      setExportEnCours(false);
    }
  }

  return (
    <Ecran>
      <ThemedText>
        L'export rassemble toutes tes données (Repas, Pesées, Objectifs, Règles, Plats, Rendez-vous…) dans un fichier
        ZIP de tableaux CSV. Choisis ensuite où l'enregistrer : sur le téléphone, dans Drive…
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        La base gratuite de Supabase n'est pas sauvegardée automatiquement : cet export est ta copie de secours. Un
        rappel arrive le 1er de chaque mois (réglable dans Notifications).
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Les photos ne sont pas dans le ZIP : le fichier photos.csv donne un lien de téléchargement valable 7 jours pour
        chacune.
      </ThemedText>
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton libelle="Exporter mes données" onPress={exporter} enCours={exportEnCours} />
    </Ecran>
  );
}
