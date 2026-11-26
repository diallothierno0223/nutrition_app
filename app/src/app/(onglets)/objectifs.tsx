import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { chargerObjectifs, enregistrerObjectifs } from "@/donnees/objectifs";
import { useTheme } from "@/hooks/use-theme";
import {
  NUTRIMENTS,
  TOLERANCE_PLAGE,
  libelleDuNutriment,
  sensDuNutriment,
  uniteDuNutriment,
  type Nutriment,
  type ObjectifsJournaliers,
  type Sens,
} from "@noyau";

type Saisie = Record<Nutriment, string>;

const AIDE_SENS: Record<Sens, string> = {
  plafond: "à ne pas dépasser",
  cible: "à atteindre",
  plage: `à ±${TOLERANCE_PLAGE} %`,
};

function versSaisie(objectifs: ObjectifsJournaliers): Saisie {
  return Object.fromEntries(NUTRIMENTS.map((n) => [n, objectifs[n]?.toString() ?? ""])) as Saisie;
}

/** Champ vide : pas d'Objectif. Virgule acceptée. Renvoie undefined si une valeur est invalide. */
function depuisSaisie(saisie: Saisie): ObjectifsJournaliers | undefined {
  const objectifs = {} as ObjectifsJournaliers;
  for (const n of NUTRIMENTS) {
    const texte = saisie[n].trim().replace(",", ".");
    if (texte === "") {
      objectifs[n] = null;
      continue;
    }
    const valeur = Number(texte);
    if (!Number.isFinite(valeur) || valeur <= 0) return undefined;
    objectifs[n] = valeur;
  }
  return objectifs;
}

export default function Objectifs() {
  const theme = useTheme();
  const [saisie, setSaisie] = useState<Saisie | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useFocusEffect(
    useCallback(() => {
      chargerObjectifs().then(
        (o) => setSaisie(versSaisie(o)),
        () => setMessage("Impossible de charger les Objectifs."),
      );
    }, []),
  );

  async function enregistrer() {
    if (!saisie) return;
    const objectifs = depuisSaisie(saisie);
    if (!objectifs) {
      setMessage("Chaque Objectif doit être un nombre positif, ou rester vide.");
      return;
    }
    setEnvoi(true);
    try {
      await enregistrerObjectifs(objectifs);
      setMessage("Objectifs enregistrés.");
    } catch {
      setMessage("Enregistrement impossible. Vérifie ta connexion.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Ecran titre="Objectifs journaliers">
      <ThemedText themeColor="textSecondary">
        Laisse un champ vide pour ne pas suivre ce nutriment.
      </ThemedText>
      {saisie &&
        NUTRIMENTS.map((n) => (
          <View key={n} style={styles.ligne}>
            <View style={styles.libelle}>
              <ThemedText>{libelleDuNutriment(n)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {uniteDuNutriment(n)}, {AIDE_SENS[sensDuNutriment(n)]}
              </ThemedText>
            </View>
            <TextInput
              style={[styles.champ, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor={theme.textSecondary}
              value={saisie[n]}
              onChangeText={(texte) => {
                setSaisie({ ...saisie, [n]: texte });
                setMessage(null);
              }}
            />
          </View>
        ))}
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton libelle="Enregistrer" onPress={enregistrer} enCours={envoi} desactive={!saisie} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  libelle: { flex: 1 },
  champ: { width: 110, borderRadius: 12, padding: Spacing.two, fontSize: 16, textAlign: "right" },
});
