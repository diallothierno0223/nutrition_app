import { StyleSheet, View } from "react-native";

import { Carte } from "@/components/carte";
import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import type { Pesee } from "@/donnees/profil";
import { useTheme } from "@/hooks/use-theme";
import { formaterNombre, libelleCourtDeJournee } from "@noyau";

const HAUTEUR = 56;

/** Une valeur mise en avant dans une tuile (« Poids · 71,8 kg »). */
function Tuile({ titre, valeur, detail }: { titre: string; valeur: string; detail: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tuile, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="detail">{titre}</ThemedText>
      <ThemedText type="section">{valeur}</ThemedText>
      <ThemedText type="detail">{detail}</ThemedText>
    </View>
  );
}

/**
 * Le poids (dernière Pesée et variation) et les pas du jour (Health Connect), puis une courbe simplifiée : une barre
 * par Pesée, de la plus ancienne à la plus récente.
 */
export function PoidsEtPas({ pesees, pas }: { pesees: Pesee[]; pas: number | null }) {
  const theme = useTheme();
  const chronologique = [...pesees].reverse();
  const premiere = chronologique[0];
  const derniere = chronologique[chronologique.length - 1];
  const poids = chronologique.map((p) => p.poids_kg);
  const min = Math.min(...poids);
  const etendue = Math.max(...poids) - min || 1;
  const variation = premiere && derniere ? derniere.poids_kg - premiere.poids_kg : 0;

  return (
    <Carte titre="Poids et pas">
      <View style={styles.tuiles}>
        {derniere ? (
          <Tuile
            titre="Poids"
            valeur={`${formaterNombre(derniere.poids_kg)} kg`}
            detail={
              pesees.length > 1
                ? `${variation > 0 ? "+" : ""}${formaterNombre(variation)} kg depuis le ${libelleCourtDeJournee(premiere!.pese_le)}`
                : `le ${libelleCourtDeJournee(derniere.pese_le)}`
            }
          />
        ) : (
          <Tuile titre="Poids" valeur="—" detail="Aucune Pesée (Réglages › Profil)" />
        )}
        {pas !== null && <Tuile titre="Pas du jour" valeur={formaterNombre(pas, 0)} detail="Health Connect" />}
      </View>
      {chronologique.length > 1 && (
        <View style={styles.barres} accessible accessibilityLabel="Évolution du poids sur les dernières Pesées">
          {chronologique.map((p) => (
            <View
              key={p.id}
              style={[
                styles.barre,
                // Au moins 15 % de hauteur pour que la plus basse reste visible.
                { height: HAUTEUR * (0.15 + (0.85 * (p.poids_kg - min)) / etendue), backgroundColor: theme.accent },
              ]}
            />
          ))}
        </View>
      )}
    </Carte>
  );
}

const styles = StyleSheet.create({
  tuiles: { flexDirection: "row", gap: Spacing.two + 2 },
  tuile: { flex: 1, borderRadius: Rayons.moyen, padding: Spacing.three - 4, gap: Spacing.half },
  barres: { height: HAUTEUR, flexDirection: "row", alignItems: "flex-end", gap: 3 },
  barre: { flex: 1, borderRadius: 3 },
});
