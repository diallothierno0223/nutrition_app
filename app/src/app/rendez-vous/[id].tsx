import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { ContenuRendezVous } from "@/components/contenu-rendez-vous";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { chargerRendezVous, type RendezVous } from "@/donnees/samedi";

/** Un Rendez-vous passé, consultable pour retrouver une Recette. */
export default function RendezVousPasse() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rendezVous, setRendezVous] = useState<RendezVous | null | undefined>(undefined);

  useEffect(() => {
    chargerRendezVous(id).then(setRendezVous, () => setRendezVous(null));
  }, [id]);

  return (
    <Ecran>
      {rendezVous === null && <ThemedText>Ce Rendez-vous est introuvable.</ThemedText>}
      {rendezVous && <ContenuRendezVous rendezVous={rendezVous} />}
    </Ecran>
  );
}
