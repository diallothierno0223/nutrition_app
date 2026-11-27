import { NativeTabs } from "expo-router/native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function Onglets() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gauge.with.needle" md="dashboard" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="saisie">
        <NativeTabs.Trigger.Label>Saisie</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus.circle" md="add_circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="objectifs">
        <NativeTabs.Trigger.Label>Objectifs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="target" md="target" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="samedi">
        <NativeTabs.Trigger.Label>Samedi</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart" md="shopping_cart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reglages">
        <NativeTabs.Trigger.Label>Réglages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
