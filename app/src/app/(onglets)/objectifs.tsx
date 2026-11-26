import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { Ecran } from "@/components/ecran";
import { SectionPesees } from "@/components/section-pesees";
import { SectionProfil } from "@/components/section-profil";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { chargerObjectifEau } from "@/donnees/hydratation";
import { chargerObjectifs, enregistrerObjectifs } from "@/donnees/objectifs";
import {
  chargerProfil,
  datesDeModification,
  estimerObjectifs,
  listerPesees,
  type Pesee,
  type Profil,
  type ResultatEstimation,
} from "@/donnees/profil";
import { lireNombre, versTexte } from "@/lib/saisie";
import {
  NUTRIMENTS,
  SEUIL_ECART_GARDE_FOU,
  TOLERANCE_PLAGE,
  libelleDuNutriment,
  reestimationAProposer,
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

const versSaisie = (o: ObjectifsJournaliers): Saisie =>
  Object.fromEntries(NUTRIMENTS.map((n) => [n, versTexte(o[n])])) as Saisie;

/** Champ vide : pas d'Objectif. Renvoie undefined si une valeur est invalide. */
function depuisSaisie(saisie: Saisie): ObjectifsJournaliers | undefined {
  const objectifs = {} as ObjectifsJournaliers;
  for (const n of NUTRIMENTS) {
    const valeur = lireNombre(saisie[n]);
    if (valeur === undefined || (valeur !== null && valeur <= 0)) return undefined;
    objectifs[n] = valeur;
  }
  return objectifs;
}

type Etat = {
  profil: Profil;
  pesees: Pesee[];
  /** Les Objectifs enregistrés, affichés à côté d'une proposition. */
  actuels: Saisie;
  /** Ce qui sera appliqué : les Objectifs actuels, ou la proposition de l'IA modifiée à la main. */
  saisie: Saisie;
  /** Objectif d'eau saisi en litres (fixé à la main, l'IA ne l'estime pas). */
  eauLitres: string;
  aReestimer: boolean;
  sansObjectifs: boolean;
};

export default function ObjectifsEtProfil() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [proposition, setProposition] = useState<ResultatEstimation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [estimationEnCours, setEstimationEnCours] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  // Recharger écarte toute proposition ouverte : on n'applique jamais autre chose que ce qui est affiché.
  const charger = useCallback(() => {
    Promise.all([chargerProfil(), listerPesees(), chargerObjectifs(), chargerObjectifEau(), datesDeModification()]).then(
      ([profil, pesees, objectifs, eauMl, dates]) => {
        setProposition(null);
        setEtat({
          profil,
          pesees,
          actuels: versSaisie(objectifs),
          saisie: versSaisie(objectifs),
          eauLitres: eauMl === null ? "" : String(eauMl / 1000),
          aReestimer: reestimationAProposer(dates.objectifs, dates.sources),
          sansObjectifs: dates.objectifs === null,
        });
      },
      () => setMessage("Impossible de charger tes données. Vérifie ta connexion."),
    );
  }, []);
  useFocusEffect(charger);

  async function estimer() {
    setEstimationEnCours(true);
    setMessage(null);
    const resultat = await estimerObjectifs();
    setEstimationEnCours(false);
    if ("erreur" in resultat) return setMessage(resultat.erreur);
    setProposition(resultat);
    const proposee = Object.fromEntries(NUTRIMENTS.map((n) => [n, String(resultat.estimation[n].valeur)])) as Saisie;
    setEtat((e) => e && { ...e, saisie: proposee });
  }

  async function appliquer() {
    if (!etat) return;
    const objectifs = depuisSaisie(etat.saisie);
    if (!objectifs) return setMessage("Chaque Objectif doit être un nombre positif, ou rester vide.");
    const eauLitres = lireNombre(etat.eauLitres);
    if (eauLitres === undefined || (eauLitres !== null && (eauLitres <= 0 || eauLitres > 10))) {
      return setMessage("L'objectif d'eau doit être entre 0 et 10 litres, ou rester vide.");
    }
    setEnvoi(true);
    try {
      await enregistrerObjectifs(objectifs, eauLitres === null ? null : Math.round(eauLitres * 1000));
      setMessage("Objectifs appliqués.");
      charger();
    } catch {
      setMessage("Enregistrement impossible. Vérifie ta connexion.");
    } finally {
      setEnvoi(false);
    }
  }

  if (!etat) {
    return (
      <Ecran titre="Objectifs & Profil">
        {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      </Ecran>
    );
  }

  const gardeFou = proposition?.garde_fou;

  return (
    <Ecran titre="Objectifs & Profil">
      <SectionProfil profil={etat.profil} onEnregistre={charger} />
      <SectionPesees pesees={etat.pesees} onChange={charger} />

      <ThemedText type="smallBold">Objectifs journaliers</ThemedText>
      {etat.sansObjectifs && !proposition && (
        <ThemedText themeColor="textSecondary">
          Complète ton Profil et ajoute une Pesée, puis demande une estimation à l'IA.
        </ThemedText>
      )}
      {etat.aReestimer && !proposition && (
        <ThemedText themeColor="textSecondary">
          Ton Profil, tes Objectifs personnels ou les Règles du médecin ont changé depuis tes Objectifs : demande une
          nouvelle estimation.
        </ThemedText>
      )}
      <Bouton
        libelle={etat.sansObjectifs ? "Estimer mes Objectifs avec l'IA" : "Réestimer avec l'IA"}
        variante="secondaire"
        onPress={estimer}
        enCours={estimationEnCours}
      />
      {gardeFou && (
        <ThemedText type="small" themeColor="textSecondary">
          Repère de la formule : {gardeFou.calories} kcal. Écart de la proposition : {gardeFou.ecart_pourcentage} %
          {gardeFou.alerte && ` — plus de ${SEUIL_ECART_GARDE_FOU} %, vérifie la justification avant d'appliquer`}.
        </ThemedText>
      )}

      {NUTRIMENTS.map((n) => (
        <View key={n} style={styles.objectif}>
          <View style={styles.ligne}>
            <View style={styles.libelle}>
              <ThemedText>{libelleDuNutriment(n)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {uniteDuNutriment(n)}, {AIDE_SENS[sensDuNutriment(n)]}
              </ThemedText>
            </View>
            <Champ
              style={styles.valeur}
              keyboardType="decimal-pad"
              placeholder="—"
              value={etat.saisie[n]}
              onChangeText={(texte) => {
                setEtat({ ...etat, saisie: { ...etat.saisie, [n]: texte } });
                setMessage(null);
              }}
            />
          </View>
          {proposition && (
            <ThemedText type="small" themeColor="textSecondary">
              Actuel : {etat.actuels[n] || "—"} · {proposition.estimation[n].justification}
            </ThemedText>
          )}
        </View>
      ))}

      <View style={styles.ligne}>
        <View style={styles.libelle}>
          <ThemedText>Eau</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            litres, {AIDE_SENS.cible}
          </ThemedText>
        </View>
        <Champ
          style={styles.valeur}
          keyboardType="decimal-pad"
          placeholder="—"
          value={etat.eauLitres}
          onChangeText={(eauLitres) => {
            setEtat({ ...etat, eauLitres });
            setMessage(null);
          }}
        />
      </View>

      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton libelle={proposition ? "Appliquer la proposition" : "Appliquer"} onPress={appliquer} enCours={envoi} />
      {proposition && (
        <Bouton
          libelle="Écarter la proposition"
          variante="secondaire"
          onPress={charger}
        />
      )}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  objectif: { gap: Spacing.one },
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  libelle: { flex: 1 },
  valeur: { width: 110, padding: Spacing.two, textAlign: "right" },
});
