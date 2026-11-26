import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { deplacerRepas, fuseauDuTelephone, type Repas } from "@/donnees/repas";
import { useEnvoi } from "@/hooks/use-envoi";
import { TYPES_DE_REPAS, estUneJourneeValide, libelleDuTypeDeRepas, typeDeRepas, type TypeDeRepas } from "@noyau";

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

/** Date et heure locales (fuseau du téléphone) d'un instant : « 2026-11-26 » et « 12:30 ». */
function versChamps(instant: Date) {
  return {
    date: `${instant.getFullYear()}-${deuxChiffres(instant.getMonth() + 1)}-${deuxChiffres(instant.getDate())}`,
    heure: `${deuxChiffres(instant.getHours())}:${deuxChiffres(instant.getMinutes())}`,
  };
}

/** L'instant saisi en heure locale, null si la date ou l'heure est invalide. */
function lireMoment(date: string, heure: string): Date | null {
  const lue = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(heure.trim());
  if (!estUneJourneeValide(date.trim()) || !lue) return null;
  const [annee, mois, jour] = date.trim().split("-").map(Number);
  return new Date(annee, mois - 1, jour, Number(lue[1]), Number(lue[2]));
}

/** Changer la date, l'heure ou le Type de repas (un repas oublié saisi après coup, par exemple). */
export function MomentDuRepas({ repas, onChange }: { repas: Repas; onChange: () => void }) {
  const initial = versChamps(new Date(repas.mange_le));
  const [ouvert, setOuvert] = useState(false);
  const [date, setDate] = useState(initial.date);
  const [heure, setHeure] = useState(initial.heure);
  // Le Type suit l'heure saisie, jusqu'à ce qu'on le choisisse soi-même.
  const [typeChoisi, setTypeChoisi] = useState<TypeDeRepas | null>(null);
  const { envoi, erreur, envoyer } = useEnvoi();

  const moment = lireMoment(date, heure);
  const momentChange = date !== initial.date || heure !== initial.heure;
  const type = typeChoisi ?? (momentChange && moment ? typeDeRepas(moment, fuseauDuTelephone()) : repas.type_repas);

  async function enregistrer() {
    if (!moment) return;
    // Sans changement de date ni d'heure, seul le Type change : la Journée reste celle d'origine.
    if (await envoyer(() => deplacerRepas(repas.id, momentChange ? moment : null, type))) {
      setOuvert(false);
      onChange();
    }
  }

  if (!ouvert) {
    return <Bouton libelle="Changer la date, l'heure ou le type" variante="secondaire" onPress={() => setOuvert(true)} />;
  }

  return (
    <View style={styles.bloc}>
      <ThemedText type="smallBold">Moment du Repas</ThemedText>
      <View style={styles.ligne}>
        <Champ style={styles.champ} placeholder="AAAA-MM-JJ" value={date} onChangeText={setDate} />
        <Champ style={styles.champ} placeholder="HH:MM" value={heure} onChangeText={setHeure} />
      </View>
      <Puces options={TYPES_DE_REPAS} valeur={type} libelle={libelleDuTypeDeRepas} onChange={setTypeChoisi} />
      {!moment && <ThemedText themeColor="textSecondary">Date (AAAA-MM-JJ) ou heure (HH:MM) invalide.</ThemedText>}
      {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
      <View style={styles.ligne}>
        <Bouton libelle="Enregistrer" variante="secondaire" onPress={enregistrer} desactive={!moment} enCours={envoi} />
        <Bouton libelle="Annuler" variante="secondaire" onPress={() => setOuvert(false)} desactive={envoi} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  ligne: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  champ: { flexGrow: 1, flexBasis: "40%" },
});
