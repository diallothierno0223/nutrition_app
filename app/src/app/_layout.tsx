import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { FournisseurSession, useSession } from "@/auth/session";

SplashScreen.preventAutoHideAsync();

function Navigation() {
  const { session, chargement } = useSession();

  useEffect(() => {
    if (!chargement) SplashScreen.hideAsync();
  }, [chargement]);

  if (chargement) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(onglets)" />
        <Stack.Screen name="repas/[id]" options={{ headerShown: true, title: "Repas" }} />
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
