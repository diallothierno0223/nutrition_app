import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { Champ } from "@/components/champ";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

export default function Connexion() {
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

  return (
    <ThemedView style={styles.ecran}>
      <SafeAreaView style={styles.contenu}>
        <ThemedText type="ecran" accessibilityRole="header">
          Suivi nutritionnel
        </ThemedText>
        <Carte>
          <Champ
            libelle="E-mail"
            placeholder="toi@exemple.fr"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Champ libelle="Mot de passe" secureTextEntry autoComplete="password" value={motDePasse} onChangeText={setMotDePasse} />
          {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
          <Bouton libelle="Se connecter" onPress={seConnecter} enCours={envoi} desactive={!email || !motDePasse} />
        </Carte>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  contenu: { flex: 1, justifyContent: "center", padding: Spacing.four, gap: Spacing.three },
});
