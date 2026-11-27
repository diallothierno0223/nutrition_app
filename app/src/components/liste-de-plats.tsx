import { router } from "expo-router";
import { useState } from "react";

import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { LigneDeListe } from "@/components/ligne-de-liste";
import type { Plat } from "@/donnees/plats";

/** Au-delà, la liste se replie derrière « Voir tout ». */
const PLATS_VISIBLES = 5;

/**
 * Des Plats en lignes de liste : un appui ouvre le Plat pour l'enregistrer comme Repas. Cinq au plus, puis
 * « Voir tout (N) » déplie le reste.
 */
export function ListeDePlats({ titre, detail, plats }: { titre: string; detail?: string; plats: readonly Plat[] }) {
  const [depliee, setDepliee] = useState(false);
  if (plats.length === 0) return null;
  const visibles = depliee ? plats : plats.slice(0, PLATS_VISIBLES);

  return (
    <Carte titre={titre} detail={detail}>
      {visibles.map((plat) => (
        <LigneDeListe
          key={plat.id}
          titre={plat.nom}
          onPress={() => router.push({ pathname: "/plat/[id]", params: { id: plat.id } })}
        />
      ))}
      {plats.length > PLATS_VISIBLES && (
        <Bouton
          libelle={depliee ? "Voir moins" : `Voir tout (${plats.length})`}
          variante="discret"
          onPress={() => setDepliee(!depliee)}
        />
      )}
    </Carte>
  );
}
