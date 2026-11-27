import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { chargerReglagesDuSamedi, enregistrerReglagesDuSamedi } from "@/donnees/samedi";
import { useEnvoi } from "@/hooks/use-envoi";
import { lireNombre } from "@/lib/saisie";
import type { ReglagesDuSamedi as Reglages } from "@noyau";

const CHAMPS: { cle: keyof Reglages; libelle: string; min: number; max: number }[] = [
  { cle: "recettes", libelle: "Recettes de déjeuners et dîners", min: 1, max: 6 },
  { cle: "portions", libelle: "Portions au total", min: 1, max: 30 },
  { cle: "portionsNomade", libelle: "Portions de Petit-déjeuner nomade", min: 1, max: 7 },
  { cle: "matinsRapides", libelle: "Matins de petit-déjeuner rapide", min: 0, max: 7 },
];

type Saisie = Record<keyof Reglages, string>;

function lire(saisie: Saisie): Reglages | null {
  const reglages = {} as Reglages;
  for (const { cle, min, max } of CHAMPS) {
    const n = lireNombre(saisie[cle]);
    if (n == null || !Number.isInteger(n) || n < min || n > max) return null;
    reglages[cle] = n;
  }
  return reglages.portions >= reglages.recettes ? reglages : null;
}

/** Les nombres du Rendez-vous du samedi, appliqués à la prochaine génération. */
export function ReglagesDuSamedi() {
  const [saisie, setSaisie] = useState<Saisie | null>(null);
  const { envoi, erreur, envoyer } = useEnvoi();
  const [message, setMessage] = useState<string | null>(null);

  async function ouvrir() {
    setMessage(null);
    await envoyer(async () => {
      const r = await chargerReglagesDuSamedi();
      setSaisie(Object.fromEntries(CHAMPS.map(({ cle }) => [cle, String(r[cle])])) as Saisie);
    });
  }

  const reglages = saisie && lire(saisie);

  async function enregistrer() {
    if (reglages && (await envoyer(() => enregistrerReglagesDuSamedi(reglages)))) {
      setSaisie(null);
      setMessage("Réglages enregistrés : ils serviront au prochain Rendez-vous.");
    }
  }

  if (!saisie) {
    return (
      <View style={styles.bloc}>
        <Bouton libelle="Réglages du samedi" variante="secondaire" onPress={ouvrir} enCours={envoi} />
        {(message ?? erreur) && <ThemedText themeColor="textSecondary">{message ?? erreur}</ThemedText>}
      </View>
    );
  }

  return (
    <View style={styles.bloc}>
      <ThemedText type="smallBold">Réglages du samedi</ThemedText>
      {CHAMPS.map(({ cle, libelle, min, max }) => (
        <View key={cle} style={styles.ligne}>
          <ThemedText type="small" style={styles.libelle}>
            {libelle} ({min}–{max})
          </ThemedText>
          <Champ
            style={styles.champ}
            keyboardType="number-pad"
            value={saisie[cle]}
            onChangeText={(texte) => setSaisie({ ...saisie, [cle]: texte })}
          />
        </View>
      ))}
      {!reglages && <ThemedText themeColor="textSecondary">Valeurs hors limites (au moins une portion par Recette).</ThemedText>}
      {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
      <View style={styles.ligne}>
        <Bouton libelle="Enregistrer" variante="secondaire" onPress={enregistrer} desactive={!reglages} enCours={envoi} />
        <Bouton libelle="Annuler" variante="secondaire" onPress={() => setSaisie(null)} desactive={envoi} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  libelle: { flex: 1 },
  champ: { width: 72, textAlign: "center" },
});
