import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Une puce de sélection : choisie = fond de la couleur principale, texte contrasté et gras ; sinon fond transparent
 * et contour fin. Les puces servent uniquement à choisir (ce qui ouvre un écran est une ligne de liste).
 */
function Puce({
  libelle,
  choisie,
  multiple = false,
  onPress,
}: {
  libelle: string;
  choisie: boolean;
  /** Choix multiple : case à cocher (« ✓ » quand cochée) plutôt que bouton sélectionné. */
  multiple?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiple ? "checkbox" : "button"}
      accessibilityState={multiple ? { checked: choisie } : { selected: choisie }}
      accessibilityLabel={libelle}
      style={({ pressed }) => [
        styles.puce,
        choisie
          ? { backgroundColor: theme.accent, borderColor: theme.accent }
          : { backgroundColor: "transparent", borderColor: theme.bordure },
        pressed && styles.appuyee,
      ]}>
      <ThemedText type={choisie ? "smallBold" : "small"} style={{ color: choisie ? theme.surAccent : theme.text }}>
        {multiple && choisie ? `✓ ${libelle}` : libelle}
      </ThemedText>
    </Pressable>
  );
}

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
  return (
    <View style={styles.puces}>
      {options.map((option) => (
        <Puce key={option} libelle={libelle(option)} choisie={option === valeur} onPress={() => onChange(option)} />
      ))}
    </View>
  );
}

/** Choix de plusieurs options (chacune s'active ou se désactive d'un appui). */
export function PucesMultiples<T extends string>({
  options,
  choisies,
  libelle,
  onBasculer,
}: {
  options: readonly T[];
  choisies: readonly T[];
  libelle: (option: T) => string;
  onBasculer: (option: T) => void;
}) {
  return (
    <View style={styles.puces}>
      {options.map((option) => {
        const choisie = choisies.includes(option);
        return (
          <Puce
            key={option}
            libelle={libelle(option)}
            choisie={choisie}
            multiple
            onPress={() => onBasculer(option)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  puces: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  puce: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: Rayons.puce,
    borderWidth: 1.5,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  appuyee: { opacity: 0.7 },
});
