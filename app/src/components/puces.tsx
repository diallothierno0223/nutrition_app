import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Choix d'une valeur parmi quelques options, sous forme de puces. */
export function Puces<T extends string>({
  options,
  valeur,
  libelle,
  onChange,
}: {
  options: readonly T[];
  valeur: T | null;
  libelle: (option: T) => string;
  onChange: (option: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.puces}>
      {options.map((option) => {
        const choisie = option === valeur;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.puce, { backgroundColor: choisie ? theme.backgroundSelected : theme.backgroundElement }]}>
            <ThemedText type={choisie ? "smallBold" : "small"}>{libelle(option)}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  puce: { borderRadius: 999, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
});
