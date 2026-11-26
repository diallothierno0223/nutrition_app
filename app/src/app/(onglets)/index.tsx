import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { useSession } from "@/auth/session";
import { Bouton } from "@/components/bouton";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { formaterValeur, ValeursNutritionnelles } from "@/components/valeurs-nutritionnelles";
import { Spacing } from "@/constants/theme";
import { fuseauDuTelephone, repasDeLaJournee, type RepasDetaille } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";
import { journeeDe, libelleDuTypeDeRepas, totauxDuRepas } from "@noyau";

export default function Dashboard() {
  const { session } = useSession();
  const theme = useTheme();
  const [journal, setJournal] = useState<RepasDetaille[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useFocusEffect(
    useCallback(() => {
      repasDeLaJournee(journeeDe(new Date(), fuseauDuTelephone())).then(
        (repas) => {
          setJournal(repas);
          setErreur(false);
        },
        () => setErreur(true),
      );
    }, []),
  );

  // Seuls les Repas analysés comptent ; les Repas en attente sont listés mais pas comptés.
  const analyses = journal?.filter((r) => r.statut === "analyse") ?? [];
  const totauxDuJour = totauxDuRepas(analyses.flatMap((r) => r.constituants));

  return (
    <Ecran titre="Aujourd'hui">
      {erreur && <ThemedText themeColor="textSecondary">La base ne répond pas.</ThemedText>}

      <ValeursNutritionnelles valeurs={totauxDuJour} />

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
            {repas.description}
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
