import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  libelle: string;
  onPress: () => void;
  desactive?: boolean;
  enCours?: boolean;
  /** Bouton principal (pleine largeur, mis en avant) ou secondaire (discret). */
  variante?: "principal" | "secondaire";
};

export function Bouton({ libelle, onPress, desactive, enCours, variante = "principal" }: Props) {
  const theme = useTheme();
  const principal = variante === "principal";
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive || enCours}
      style={({ pressed }) => [
        styles.bouton,
        principal ? styles.principal : styles.secondaire,
        { backgroundColor: principal ? theme.backgroundSelected : theme.backgroundElement },
        (desactive || pressed) && styles.attenue,
      ]}>
      {enCours ? <ActivityIndicator /> : <ThemedText type={principal ? "smallBold" : "small"}>{libelle}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { borderRadius: 12, alignItems: "center" },
  principal: { padding: Spacing.three },
  secondaire: { alignSelf: "flex-start", paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  attenue: { opacity: 0.6 },
});
