import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { useSession } from "@/auth/session";
import { Bouton } from "@/components/bouton";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

const SECTIONS: { titre: string; description: string; route: Href }[] = [
  { titre: "Profil et Pesées", description: "Taille, naissance, activité, Objectif de poids, Pesées", route: "/reglages/profil" },
  { titre: "Règles du médecin", description: "Consignes qui guident chaque analyse de l'IA", route: "/reglages/regles" },
  { titre: "Notifications", description: "Heures des rappels, activation, test", route: "/reglages/notifications" },
  { titre: "Santé connectée", description: "Health Connect : pas du jour et poids", route: "/reglages/sante" },
  { titre: "Rendez-vous du samedi", description: "Nombre de Recettes, de portions et de petits-déjeuners", route: "/reglages/samedi" },
  { titre: "Données", description: "Export de toutes tes données (ZIP de CSV)", route: "/reglages/donnees" },
];

/** Réglages : tout ce qui se configure dans l'app, rangé par section. */
export default function Reglages() {
  const theme = useTheme();
  const { session } = useSession();

  return (
    <Ecran titre="Réglages">
      {SECTIONS.map((s) => (
        <Pressable
          key={s.titre}
          onPress={() => router.push(s.route)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.section, { backgroundColor: theme.backgroundElement }, pressed && styles.appuye]}>
          <View style={styles.texte}>
            <ThemedText type="smallBold">{s.titre}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {s.description}
            </ThemedText>
          </View>
          <ThemedText themeColor="textSecondary">›</ThemedText>
        </Pressable>
      ))}

      <ThemedText type="smallBold">Compte</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Connecté : {session?.user.email}
      </ThemedText>
      <Bouton libelle="Se déconnecter" variante="secondaire" onPress={() => supabase.auth.signOut()} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    borderRadius: 12,
    padding: Spacing.three,
  },
  texte: { flex: 1, gap: Spacing.one },
  appuye: { opacity: 0.6 },
});
