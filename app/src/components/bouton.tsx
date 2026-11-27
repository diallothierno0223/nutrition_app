import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  libelle: string;
  onPress: () => void;
  desactive?: boolean;
  enCours?: boolean;
  /**
   * principal : l'action de l'écran (couleur principale pleine, pleine largeur) ; secondaire : contour et texte de la
   * couleur principale ; discret : un simple texte coloré (« Effacer », « Annuler »).
   */
  variante?: "principal" | "secondaire" | "discret";
};

/** Un bouton dont le texte n'est jamais coupé (il passe à la ligne) et reste lisible quand il est désactivé. */
export function Bouton({ libelle, onPress, desactive, enCours, variante = "principal" }: Props) {
  const theme = useTheme();
  const inactif = Boolean(desactive || enCours);

  const apparence = {
    principal: {
      conteneur: { backgroundColor: inactif ? theme.desactiveFond : theme.accent },
      texte: inactif ? theme.desactiveTexte : theme.surAccent,
    },
    secondaire: {
      conteneur: { borderColor: inactif ? theme.bordure : theme.accent },
      texte: inactif ? theme.desactiveTexte : theme.accent,
    },
    discret: { conteneur: {}, texte: inactif ? theme.desactiveTexte : theme.accent },
  }[variante];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactif}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactif, busy: enCours }}
      style={({ pressed }) => [styles.bouton, styles[variante], apparence.conteneur, pressed && styles.appuye]}>
      {enCours ? (
        <ActivityIndicator color={apparence.texte} />
      ) : (
        <ThemedText
          type={variante === "discret" ? "small" : "smallBold"}
          style={[styles.texte, variante === "principal" && styles.textePrincipal, { color: apparence.texte }]}>
          {libelle}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { alignItems: "center", justifyContent: "center" },
  principal: { minHeight: 52, borderRadius: Rayons.moyen, paddingVertical: 14, paddingHorizontal: 20 },
  secondaire: {
    alignSelf: "flex-start",
    flexShrink: 1,
    maxWidth: "100%",
    minHeight: 44,
    borderRadius: Rayons.petit,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
  },
  discret: { alignSelf: "flex-start", flexShrink: 1, maxWidth: "100%", minHeight: 44, paddingHorizontal: Spacing.one },
  texte: { textAlign: "center", fontSize: 15 },
  textePrincipal: { fontSize: 16, lineHeight: 22 },
  appuye: { opacity: 0.7 },
});
