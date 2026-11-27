import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { Ecran } from "@/components/ecran";
import { SectionPesees } from "@/components/section-pesees";
import { SectionProfil } from "@/components/section-profil";
import { ThemedText } from "@/components/themed-text";
import { chargerProfil, listerPesees, type Pesee, type Profil } from "@/donnees/profil";

/** Réglages › Profil : données personnelles, Objectifs personnels, Objectif de poids et Pesées. */
export default function ReglagesProfil() {
  const [donnees, setDonnees] = useState<{ profil: Profil; pesees: Pesee[] } | null>(null);
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    Promise.all([chargerProfil(), listerPesees()]).then(
      ([profil, pesees]) => {
        setDonnees({ profil, pesees });
        setErreur(false);
      },
      () => setErreur(true),
    );
  }, []);
  useFocusEffect(charger);

  return (
    <Ecran>
      {erreur && <ThemedText themeColor="textSecondary">Impossible de charger ton Profil. Vérifie ta connexion.</ThemedText>}
      {donnees && (
        <>
          <SectionProfil profil={donnees.profil} onEnregistre={charger} />
          <SectionPesees pesees={donnees.pesees} onChange={charger} />
        </>
      )}
    </Ecran>
  );
}
