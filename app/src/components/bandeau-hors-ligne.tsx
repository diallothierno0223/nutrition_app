import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useEtatDeSynchro } from "@/synchro/synchro";

const heureDe = (date: Date) => date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/**
 * Hors ligne, les chiffres viennent du cache : le bandeau dit de quand ils datent et combien d'actions attendent le
 * réseau (ticket 17). Rien ne s'affiche quand tout est synchronisé.
 */
export function BandeauHorsLigne() {
  const theme = useTheme();
  const { horsLigne, derniereSynchro, enAttente } = useEtatDeSynchro();
  if (!horsLigne && enAttente === 0) return null;

  const morceaux = [
    horsLigne
      ? `Hors ligne${derniereSynchro ? ` · dernière synchro à ${heureDe(derniereSynchro)}` : ""}`
      : "Envoi en cours",
    enAttente > 0 ? `${enAttente} action(s) en attente d'envoi` : null,
  ].filter(Boolean);

  return (
    <View style={[styles.bandeau, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="small">{morceaux.join(" · ")}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: { borderRadius: Rayons.petit, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
});
