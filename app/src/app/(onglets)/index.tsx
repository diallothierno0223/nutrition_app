import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { useSession } from "@/auth/session";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";
import { NUTRIMENTS, libelleDuNutriment } from "@noyau";

type EtatBase = "verification" | "ok" | "erreur";

export default function Dashboard() {
  const { session } = useSession();
  const theme = useTheme();
  const [etatBase, setEtatBase] = useState<EtatBase>("verification");

  // Les Réglages sont créés avec le compte : les lire prouve que la base répond et que la RLS laisse passer.
  useEffect(() => {
    supabase
      .from("reglages")
      .select("user_id")
      .single()
      .then(({ error }) => setEtatBase(error ? "erreur" : "ok"));
  }, []);

  return (
    <Ecran titre="Aujourd'hui">
      <ThemedText>Aucun Repas enregistré aujourd'hui.</ThemedText>
      {NUTRIMENTS.map((n) => (
        <ThemedText key={n} type="small" themeColor="textSecondary">
          {libelleDuNutriment(n)} : —
        </ThemedText>
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        {etatBase === "verification" && "Connexion à la base…"}
        {etatBase === "ok" && `Connecté : ${session?.user.email}`}
        {etatBase === "erreur" && "La base ne répond pas."}
      </ThemedText>
      <Pressable
        style={[styles.bouton, { backgroundColor: theme.backgroundElement }]}
        onPress={() => supabase.auth.signOut()}>
        <ThemedText type="small">Se déconnecter</ThemedText>
      </Pressable>
    </Ecran>
  );
}

const styles = StyleSheet.create({
  bouton: { alignSelf: "flex-start", borderRadius: 12, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
});
