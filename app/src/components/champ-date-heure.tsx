// Saisie d'une date (calendrier) ou d'une heure (horloge) avec le sélecteur natif d'Android : plus de format à taper.
// Les valeurs restent au format stocké : AAAA-MM-JJ pour une date, HH:MM pour une heure.
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  depuisJournee,
  estUneHeureValide,
  estUneJourneeValide,
  heureEtMinute,
  libelleDHeure,
  libelleDeJournee,
  versHeure,
  versJournee,
} from "@noyau";

type Commun = {
  /** Texte affiché tant qu'aucune valeur n'est choisie. */
  placeholder: string;
  desactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

function Declencheur({ texte, vide, desactive, style, onPress }: {
  texte: string;
  vide: boolean;
  desactive?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={desactive}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.champ,
        { backgroundColor: theme.backgroundElement },
        (pressed || desactive) && styles.attenue,
        style,
      ]}>
      <ThemedText themeColor={vide ? "textSecondary" : "text"}>
        {texte}
      </ThemedText>
    </Pressable>
  );
}

/** Une date (Journée AAAA-MM-JJ, ou "" si aucune) choisie dans un calendrier. */
export function ChampDate({ valeur, onChange, placeholder, desactive, style, min, max, effacable }: Commun & {
  valeur: string;
  onChange: (journee: string) => void;
  min?: string;
  max?: string;
  /** Date facultative : un bouton permet de la retirer (valeur ""). */
  effacable?: boolean;
}) {
  const vide = !estUneJourneeValide(valeur);
  function ouvrir() {
    DateTimePickerAndroid.open({
      mode: "date",
      value: vide ? new Date() : depuisJournee(valeur),
      minimumDate: min ? depuisJournee(min) : undefined,
      maximumDate: max ? depuisJournee(max) : undefined,
      onValueChange: (_evenement, date) => onChange(versJournee(date)),
    });
  }
  const champ = (
    <Declencheur
      texte={vide ? placeholder : libelleDeJournee(valeur)}
      vide={vide}
      desactive={desactive}
      style={effacable ? styles.extensible : style}
      onPress={ouvrir}
    />
  );
  if (!effacable) return champ;
  return (
    <View style={[styles.ligne, style]}>
      {champ}
      {!vide && !desactive && (
        <Pressable onPress={() => onChange("")} accessibilityRole="button" accessibilityLabel="Effacer la date" hitSlop={8}>
          <ThemedText themeColor="textSecondary">Effacer</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

/** Une heure (HH:MM) choisie sur une horloge 24 h. */
export function ChampHeure({ valeur, onChange, placeholder, desactive, style }: Commun & {
  valeur: string;
  onChange: (heure: string) => void;
}) {
  const vide = !estUneHeureValide(valeur);
  function ouvrir() {
    const depart = new Date();
    if (!vide) {
      const { heure, minute } = heureEtMinute(valeur);
      depart.setHours(heure, minute, 0, 0);
    }
    DateTimePickerAndroid.open({
      mode: "time",
      is24Hour: true,
      value: depart,
      onValueChange: (_evenement, date) => onChange(versHeure(date)),
    });
  }
  return (
    <Declencheur
      texte={vide ? placeholder : libelleDHeure(valeur)}
      vide={vide}
      desactive={desactive}
      style={style}
      onPress={ouvrir}
    />
  );
}

const styles = StyleSheet.create({
  champ: { borderRadius: 12, padding: Spacing.three, justifyContent: "center" },
  attenue: { opacity: 0.5 },
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  extensible: { flex: 1 },
});
