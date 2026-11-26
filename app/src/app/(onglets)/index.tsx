import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { useSession } from "@/auth/session";
import { Bouton } from "@/components/bouton";
import { CompteurEau } from "@/components/compteur-eau";
import { CourbeDePoids } from "@/components/courbe-de-poids";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Jauges } from "@/components/jauges";
import { formaterValeur } from "@/components/valeurs-nutritionnelles";
import { Spacing } from "@/constants/theme";
import { chargerObjectifEau, eauDuJour } from "@/donnees/hydratation";
import { chargerObjectifs, totauxDuJour } from "@/donnees/objectifs";
import { listerPesees, type Pesee } from "@/donnees/profil";
import { fuseauDuTelephone, repasDeLaJournee, type RepasDetaille } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";
import {
  journeeDe,
  libelleDuTypeDeRepas,
  totauxDuRepas,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "@noyau";

type DonneesDuJour = {
  repas: RepasDetaille[];
  totaux: ValeursNutritionnelles;
  objectifs: ObjectifsJournaliers;
  pesees: Pesee[];
  eauMl: number;
  objectifEauMl: number | null;
};

export default function Dashboard() {
  const { session } = useSession();
  const theme = useTheme();
  const [donnees, setDonnees] = useState<DonneesDuJour | null>(null);
  const [erreur, setErreur] = useState(false);

  // Rechargé à chaque retour sur l'onglet (et après un ajout d'eau) : les jauges suivent la Journée.
  const charger = useCallback(() => {
    const journee = journeeDe(new Date(), fuseauDuTelephone());
    Promise.all([
      repasDeLaJournee(journee),
      totauxDuJour(journee),
      chargerObjectifs(),
      listerPesees(14),
      eauDuJour(journee),
      chargerObjectifEau(),
    ]).then(
      ([repas, totaux, objectifs, pesees, eauMl, objectifEauMl]) => {
        setDonnees({ repas, totaux, objectifs, pesees, eauMl, objectifEauMl });
        setErreur(false);
      },
      () => setErreur(true),
    );
  }, []);
  useFocusEffect(charger);

  const journal = donnees?.repas;

  return (
    <Ecran titre="Aujourd'hui">
      {erreur && <ThemedText themeColor="textSecondary">La base ne répond pas.</ThemedText>}

      {donnees && <Jauges totaux={donnees.totaux} objectifs={donnees.objectifs} />}

      {donnees && (
        <CompteurEau
          totalMl={donnees.eauMl}
          objectifMl={donnees.objectifEauMl}
          onChange={charger}
        />
      )}

      <ThemedText type="smallBold">Poids</ThemedText>
      {donnees && <CourbeDePoids pesees={donnees.pesees} />}

      <ThemedText type="smallBold">Repas du jour</ThemedText>
      {journal?.length === 0 && <ThemedText themeColor="textSecondary">Aucun Repas enregistré aujourd'hui.</ThemedText>}
      {journal?.map((repas) => (
        <Pressable
          key={repas.id}
          onPress={() => router.push({ pathname: "/repas/[id]", params: { id: repas.id } })}
          style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">
            {libelleDuTypeDeRepas(repas.type_repas)} ·{" "}
            {repas.statut === "analyse"
              ? formaterValeur("calories", totauxDuRepas(repas.constituants).calories)
              : "en attente"}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {repas.description || "Repas en photo"}
          </ThemedText>
        </Pressable>
      ))}

      <ThemedText type="small" themeColor="textSecondary">
        Connecté : {session?.user.email}
      </ThemedText>
      <Bouton libelle="Se déconnecter" variante="secondaire" onPress={() => supabase.auth.signOut()} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
});
