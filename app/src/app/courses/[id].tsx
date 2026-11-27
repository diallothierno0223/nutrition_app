import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { CaseACocher } from "@/components/case-a-cocher";
import { Champ } from "@/components/champ";
import { Ecran } from "@/components/ecran";
import { PucesMultiples } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import {
  ajouterArticle,
  cocherArticle,
  cocherIngredient,
  inclureRecette,
  listerAjoutsManuels,
  retirerArticle,
} from "@/donnees/courses";
import { chargerRendezVous, type RendezVous } from "@/donnees/samedi";
import { useEnvoi } from "@/hooks/use-envoi";
import { construireListeDeCourses, type AjoutManuel, type LigneDeCourses } from "@noyau";

/** La Liste de courses d'un Rendez-vous : sections par Recette, cases à cocher, ajouts manuels. */
export default function ListeDeCourses() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rendezVous, setRendezVous] = useState<RendezVous | null | undefined>(undefined);
  const [ajouts, setAjouts] = useState<AjoutManuel[]>([]);
  const [nouvelArticle, setNouvelArticle] = useState("");
  const { envoi, erreur, envoyer } = useEnvoi();

  const charger = useCallback(async () => {
    try {
      const [rdv, manuels] = await Promise.all([chargerRendezVous(id), listerAjoutsManuels(id)]);
      setRendezVous(rdv);
      setAjouts(manuels);
    } catch {
      setRendezVous((actuel) => actuel ?? null);
    }
  }, [id]);
  useEffect(() => {
    charger();
  }, [charger]);

  if (rendezVous === undefined) return <Ecran />;
  if (rendezVous === null) {
    return (
      <Ecran>
        <ThemedText>Cette Liste de courses est introuvable.</ThemedText>
      </Ecran>
    );
  }

  /** Change l'état tout de suite à l'écran, puis l'enregistre ; en cas d'échec, recharge l'état réel. */
  async function modifier(local: () => void, distant: () => Promise<void>) {
    local();
    if (!(await envoyer(distant))) charger();
  }

  const avecRendezVous = (maj: (rdv: RendezVous) => RendezVous) => setRendezVous((rdv) => (rdv ? maj(rdv) : rdv));

  function basculerRecette(recetteId: string) {
    const incluse = !rendezVous?.recettes.find((r) => r.id === recetteId)?.dans_la_liste;
    modifier(
      () => avecRendezVous((rdv) => ({ ...rdv, recettes: rdv.recettes.map((r) => (r.id === recetteId ? { ...r, dans_la_liste: incluse } : r)) })),
      () => inclureRecette(recetteId, incluse),
    );
  }

  function basculerLigne(ligne: LigneDeCourses) {
    const coche = !ligne.coche;
    if (ligne.manuel) {
      modifier(
        () => setAjouts((a) => a.map((x) => (x.id === ligne.id ? { ...x, coche } : x))),
        () => cocherArticle(ligne.id, coche),
      );
    } else {
      modifier(
        () =>
          avecRendezVous((rdv) => ({
            ...rdv,
            recettes: rdv.recettes.map((r) => ({
              ...r,
              ingredients: r.ingredients.map((i) => (i.id === ligne.id ? { ...i, coche } : i)),
            })),
          })),
        () => cocherIngredient(ligne.id, coche),
      );
    }
  }

  async function ajouter() {
    const nom = nouvelArticle.trim();
    const ajoute = await envoyer(async () => {
      await ajouterArticle(id, nom);
      setAjouts(await listerAjoutsManuels(id));
    });
    if (ajoute) setNouvelArticle("");
  }

  const sections = construireListeDeCourses(rendezVous.recettes, ajouts);
  const ids = rendezVous.recettes.map((r) => r.id);
  const selectionnees = rendezVous.recettes.filter((r) => r.dans_la_liste).map((r) => r.id);

  return (
    <Ecran>
      <Carte titre="Recettes incluses" detail="Seules les Recettes choisies remplissent la liste">
        <PucesMultiples
          options={ids}
          choisies={selectionnees}
          libelle={(rid) => rendezVous.recettes.find((r) => r.id === rid)?.nom ?? ""}
          onBasculer={basculerRecette}
        />
        {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
      </Carte>

      {sections.map((section) => (
        <Carte key={section.titre} titre={section.titre}>
          {section.lignes.map((ligne) => (
            <View key={ligne.id} style={styles.ligne}>
              <CaseACocher
                libelle={ligne.nom}
                coche={ligne.coche}
                onPress={() => basculerLigne(ligne)}
                detail={
                  (ligne.detail || ligne.total) && (
                    <>
                      {ligne.detail && <ThemedText type="detail">{ligne.detail}</ThemedText>}
                      {ligne.total && <ThemedText type="detail">Total : {ligne.total}</ThemedText>}
                    </>
                  )
                }
              />
              {ligne.manuel && (
                <Bouton
                  libelle="Retirer"
                  variante="discret"
                  onPress={() =>
                    modifier(() => setAjouts((a) => a.filter((x) => x.id !== ligne.id)), () => retirerArticle(ligne.id))
                  }
                />
              )}
            </View>
          ))}
        </Carte>
      ))}

      <Carte titre="Ajouter un article">
        <Champ placeholder="Ex. : piment, sel, sacs congélation" value={nouvelArticle} onChangeText={setNouvelArticle} />
        <Bouton libelle="Ajouter" variante="secondaire" onPress={ajouter} desactive={!nouvelArticle.trim()} enCours={envoi} />
      </Carte>
    </Ecran>
  );
}


const styles = StyleSheet.create({
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
});
