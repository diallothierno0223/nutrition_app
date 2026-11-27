// Saisie d'une date (calendrier) ou d'une heure (horloge) avec le sélecteur natif d'Android : plus de format à taper.
// Les valeurs restent au format stocké : AAAA-MM-JJ pour une date, HH:MM pour une heure.
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Bouton } from "@/components/bouton";
import { CadreDeChamp, HAUTEUR_DE_CHAMP } from "@/components/champ";
import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  depuisJournee,
  estUneHeureValide,
  estUneJourneeValide,
  heureEtMinute,
  libelleDHeure,
  libelleCourtDeJournee,
  versHeure,
  versJournee,
} from "@noyau";

type Commun = {
  /** Texte affiché tant qu'aucune valeur n'est choisie. */
  placeholder: string;
  /** Libellé posé au-dessus du champ (« Date de naissance »). */
  libelle?: string;
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
        { backgroundColor: theme.carte, borderColor: theme.bordure },
        (pressed || desactive) && styles.attenue,
        style,
      ]}>
      <ThemedText themeColor={vide ? "textSecondary" : "text"} numberOfLines={1}>
        {texte}
      </ThemedText>
    </Pressable>
  );
}

/** Une date (Journée AAAA-MM-JJ, ou "" si aucune) choisie dans un calendrier. */
export function ChampDate({ valeur, onChange, placeholder, libelle, desactive, style, min, max, effacable }: Commun & {
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
  const declencheur = (
    <Declencheur
      texte={vide ? placeholder : libelleCourtDeJournee(valeur)}
      vide={vide}
      desactive={desactive}
      style={effacable ? styles.extensible : undefined}
      onPress={ouvrir}
    />
  );
  return (
    <CadreDeChamp libelle={libelle} style={style}>
      {effacable ? (
        <View style={styles.ligne}>
          {declencheur}
          {!vide && !desactive && <Bouton libelle="Effacer" variante="discret" onPress={() => onChange("")} />}
        </View>
      ) : (
        declencheur
      )}
    </CadreDeChamp>
  );
}

/** Une heure (HH:MM) choisie sur une horloge 24 h. */
export function ChampHeure({ valeur, onChange, placeholder, libelle, desactive, style }: Commun & {
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
    <CadreDeChamp libelle={libelle} style={style}>
      <Declencheur texte={vide ? placeholder : libelleDHeure(valeur)} vide={vide} desactive={desactive} onPress={ouvrir} />
    </CadreDeChamp>
  );
}

const styles = StyleSheet.create({
  champ: {
    minHeight: HAUTEUR_DE_CHAMP,
    borderRadius: Rayons.petit,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  attenue: { opacity: 0.5 },
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  extensible: { flex: 1 },
});
