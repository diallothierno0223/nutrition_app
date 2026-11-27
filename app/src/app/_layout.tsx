import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { FournisseurSession, useSession } from "@/auth/session";
import {
  configurerNotifications,
  rafraichirNotifications,
  useOuvertureDesNotifications,
} from "@/notifications/programmation";
import { prechargerLeCache } from "@/synchro/prechargement";
import { demarrerSynchro, surRejeu } from "@/synchro/synchro";

SplashScreen.preventAutoHideAsync();
configurerNotifications();

function Navigation() {
  const { session, chargement } = useSession();
  useOuvertureDesNotifications(!chargement && !!session);
  const connecte = !!session;

  // Rejeu de la file d'envoi et préchargement du cache, tant qu'un compte est connecté (ticket 17).
  useEffect(() => {
    if (!connecte) return;
    const arreter = demarrerSynchro(prechargerLeCache);
    // Une fois la file envoyée (Repas en attente analysé…), la notification du soir reprend les vrais chiffres.
    const desabonner = surRejeu(() => rafraichirNotifications());
    return () => {
      arreter();
      desabonner();
    };
  }, [connecte]);

  useEffect(() => {
    if (!chargement) SplashScreen.hideAsync();
  }, [chargement]);

  if (chargement) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(onglets)" />
        <Stack.Screen name="repas/[id]" options={{ headerShown: true, title: "Repas" }} />
        <Stack.Screen name="plat/[id]" options={{ headerShown: true, title: "Plat" }} />
        <Stack.Screen name="rendez-vous/index" options={{ headerShown: true, title: "Rendez-vous passés" }} />
        <Stack.Screen name="rendez-vous/[id]" options={{ headerShown: true, title: "Rendez-vous" }} />
        <Stack.Screen name="courses/[id]" options={{ headerShown: true, title: "Liste de courses" }} />
        <Stack.Screen name="reglages/profil" options={{ headerShown: true, title: "Profil et Pesées" }} />
        <Stack.Screen name="reglages/regles" options={{ headerShown: true, title: "Règles du médecin" }} />
        <Stack.Screen name="reglages/notifications" options={{ headerShown: true, title: "Notifications" }} />
        <Stack.Screen name="reglages/sante" options={{ headerShown: true, title: "Santé connectée" }} />
        <Stack.Screen name="reglages/samedi" options={{ headerShown: true, title: "Rendez-vous du samedi" }} />
        <Stack.Screen name="reglages/donnees" options={{ headerShown: true, title: "Données" }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="connexion" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <FournisseurSession>
        <Navigation />
      </FournisseurSession>
    </ThemeProvider>
  );
}
