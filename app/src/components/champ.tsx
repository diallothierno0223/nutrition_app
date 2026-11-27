import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Hauteur commune des champs d'une ligne (texte, date, heure). */
export const HAUTEUR_DE_CHAMP = 52;

/** Un champ et son libellé posé au-dessus (« Taille (cm) »), dans le bloc que l'écran place avec `style`. */
export function CadreDeChamp({
  libelle,
  style,
  children,
}: {
  libelle?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.cadre, style]}>
      {libelle && (
        <ThemedText type="detail" style={styles.libelle}>
          {libelle}
        </ThemedText>
      )}
      {children}
    </View>
  );
}

/** Champ de saisie aux couleurs du thème, avec un libellé au-dessus quand `libelle` est donné. */
export function Champ({ style, multiline, libelle, ...props }: TextInputProps & { libelle?: string }) {
  const theme = useTheme();
  const champ = (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      multiline={multiline}
      accessibilityLabel={libelle ?? props.accessibilityLabel}
      style={[
        styles.champ,
        multiline && styles.multiligne,
        { color: theme.text, backgroundColor: theme.carte, borderColor: theme.bordure },
        libelle ? null : style,
      ]}
      {...props}
    />
  );
  // Sans libellé, `style` reste sur le champ lui-même (largeur, alignement du texte).
  return libelle ? (
    <CadreDeChamp libelle={libelle} style={style as StyleProp<ViewStyle>}>
      {champ}
    </CadreDeChamp>
  ) : (
    champ
  );
}

const styles = StyleSheet.create({
  cadre: { gap: Spacing.one + 2 },
  libelle: { fontWeight: 500 },
  champ: {
    minHeight: HAUTEUR_DE_CHAMP,
    borderRadius: Rayons.petit,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  multiligne: { minHeight: 96, paddingVertical: Spacing.three - 4, textAlignVertical: "top" },
});
