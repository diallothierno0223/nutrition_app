import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { ChampDate, ChampHeure } from "@/components/champ-date-heure";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { deplacerRepas, fuseauDuTelephone, type Repas } from "@/donnees/repas";
import { useEnvoi } from "@/hooks/use-envoi";
import {
  TYPES_DE_REPAS,
  depuisJournee,
  estUneHeureValide,
  estUneJourneeValide,
  heureEtMinute,
  journeeDe,
  libelleDuTypeDeRepas,
  typeDeRepas,
  versHeure,
  versJournee,
  type TypeDeRepas,
} from "@noyau";

/** Date et heure locales (fuseau du téléphone) d'un instant : « 2026-11-26 » et « 12:30 ». */
const versChamps = (instant: Date) => ({ date: versJournee(instant), heure: versHeure(instant) });

/** L'instant choisi, en heure locale. */
function lireMoment(date: string, heure: string): Date | null {
  if (!estUneJourneeValide(date) || !estUneHeureValide(heure)) return null;
  const moment = depuisJournee(date);
  const { heure: h, minute } = heureEtMinute(heure);
  moment.setHours(h, minute, 0, 0);
  return moment;
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

  const aujourdhui = journeeDe(new Date(), fuseauDuTelephone());
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
        <ChampDate style={styles.champ} placeholder="Date" valeur={date} onChange={setDate} max={aujourdhui} />
        <ChampHeure style={styles.champ} placeholder="Heure" valeur={heure} onChange={setHeure} />
      </View>
      <Puces options={TYPES_DE_REPAS} valeur={type} libelle={libelleDuTypeDeRepas} onChange={setTypeChoisi} />
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
