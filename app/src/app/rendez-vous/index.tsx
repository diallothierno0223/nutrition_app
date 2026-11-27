import { router } from "expo-router";
import { useEffect, useState } from "react";

import { Carte } from "@/components/carte";
import { Ecran } from "@/components/ecran";
import { LigneDeListe } from "@/components/ligne-de-liste";
import { ThemedText } from "@/components/themed-text";
import { formaterSamedi, listerRendezVous, type ResumeRendezVous } from "@/donnees/samedi";

/** Historique des Rendez-vous du samedi, du plus récent au plus ancien. */
export default function RendezVousPasses() {
  const [liste, setListe] = useState<ResumeRendezVous[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    listerRendezVous().then(setListe, () => setErreur(true));
  }, []);

  return (
    <Ecran>
      <Carte>
        {erreur && <ThemedText themeColor="textSecondary">La base ne répond pas.</ThemedText>}
        {liste?.length === 0 && <ThemedText themeColor="textSecondary">Aucun Rendez-vous pour l'instant.</ThemedText>}
        {liste?.map((rdv) => (
          <LigneDeListe
            key={rdv.id}
            titre={`Rendez-vous du ${formaterSamedi(rdv.samedi)}`}
            onPress={() => router.push({ pathname: "/rendez-vous/[id]", params: { id: rdv.id } })}
          />
        ))}
      </Carte>
    </Ecran>
  );
}
