import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

export default function Connexion() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function seConnecter() {
    setEnvoi(true);
    setErreur(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
    if (error) setErreur("Connexion impossible. Vérifie ton e-mail et ton mot de passe.");
    setEnvoi(false);
  }

  const champ = [styles.champ, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.ecran}>
      <SafeAreaView style={styles.contenu}>
        <ThemedText type="subtitle">Suivi nutritionnel</ThemedText>
        <TextInput
          style={champ}
          placeholder="E-mail"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={champ}
          placeholder="Mot de passe"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          autoComplete="password"
          value={motDePasse}
          onChangeText={setMotDePasse}
        />
        {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
        <Pressable
          style={[styles.bouton, { backgroundColor: theme.backgroundSelected }]}
          onPress={seConnecter}
          disabled={envoi || !email || !motDePasse}>
          {envoi ? <ActivityIndicator /> : <ThemedText type="smallBold">Se connecter</ThemedText>}
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  contenu: { flex: 1, justifyContent: "center", padding: Spacing.four, gap: Spacing.three },
  champ: { borderRadius: 12, padding: Spacing.three, fontSize: 16 },
  bouton: { borderRadius: 12, padding: Spacing.three, alignItems: "center" },
});
