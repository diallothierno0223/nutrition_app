import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Champ de saisie aux couleurs du thème. */
export function Champ({ style, multiline, ...props }: TextInputProps) {
  const theme = useTheme();
  return (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      multiline={multiline}
      style={[
        styles.champ,
        multiline && styles.multiligne,
        { color: theme.text, backgroundColor: theme.backgroundElement },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  champ: { borderRadius: 12, padding: Spacing.three, fontSize: 16 },
  multiligne: { minHeight: 90, textAlignVertical: "top" },
});
