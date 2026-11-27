import type { ReactNode } from "react";

import { Carte } from "@/components/carte";
import { CarteRecette } from "@/components/carte-recette";
import { EnregistrerCommePlat } from "@/components/enregistrer-comme-plat";
import { ThemedText } from "@/components/themed-text";
import { formaterSamedi, type RendezVous } from "@/donnees/samedi";
import { CATEGORIES_DE_RECETTE, libelleDeCategorieDeRecette, platDUnePortion } from "@noyau";

/**
 * Le Rendez-vous du samedi : Bilan de la semaine (avec `sousLeBilan`, la Liste de courses par exemple), puis une carte
 * par catégorie de Recettes.
 */
export function ContenuRendezVous({ rendezVous, sousLeBilan }: { rendezVous: RendezVous; sousLeBilan?: ReactNode }) {
  return (
    <>
      <Carte titre="Bilan de la semaine" detail={`Rendez-vous du ${formaterSamedi(rendezVous.samedi)}`}>
        <ThemedText>{rendezVous.bilan}</ThemedText>
        {sousLeBilan}
      </Carte>

      {CATEGORIES_DE_RECETTE.map((categorie) => {
        const recettes = rendezVous.recettes.filter((r) => r.categorie === categorie);
        if (recettes.length === 0) return null;
        return (
          <Carte key={categorie} titre={libelleDeCategorieDeRecette(categorie)}>
            {recettes.map((recette) => (
              <CarteRecette
                key={recette.id}
                recette={recette}
                actions={
                  <EnregistrerCommePlat
                    nomPropose={recette.nom}
                    constituants={platDUnePortion(recette)}
                    libelle="Enregistrer comme Plat permanent"
                  />
                }
              />
            ))}
          </Carte>
        );
      })}
    </>
  );
}
