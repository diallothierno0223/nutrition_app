import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
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
import { useTheme } from "@/hooks/use-theme";
import { construireListeDeCourses, type AjoutManuel, type LigneDeCourses } from "@noyau";

/** La Liste de courses d'un Rendez-vous : sections par Recette, cases à cocher, ajouts manuels. */
export default function ListeDeCourses() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
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
      <ThemedText type="smallBold">Recettes incluses</ThemedText>
      <PucesMultiples
        options={ids}
        choisies={selectionnees}
        libelle={(rid) => rendezVous.recettes.find((r) => r.id === rid)?.nom ?? ""}
        onBasculer={basculerRecette}
      />
      {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}

      {sections.map((section) => (
        <View key={section.titre} style={styles.section}>
          <ThemedText type="smallBold">{section.titre}</ThemedText>
          {section.lignes.map((ligne) => (
            <View key={ligne.id} style={styles.ligne}>
              <Pressable onPress={() => basculerLigne(ligne)} style={styles.case}>
                <ThemedText style={ligne.coche ? styles.coche : undefined}>
                  {ligne.coche ? "☑" : "☐"} {ligne.nom}
                  {ligne.detail ? ` · ${ligne.detail}` : ""}
                </ThemedText>
                {ligne.total && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {ligne.nom} : {ligne.total}
                  </ThemedText>
                )}
              </Pressable>
              {ligne.manuel && (
                <Pressable
                  onPress={() => modifier(() => setAjouts((a) => a.filter((x) => x.id !== ligne.id)), () => retirerArticle(ligne.id))}
                  style={[styles.retirer, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small">✕</ThemedText>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      ))}

      <ThemedText type="smallBold">Ajouter un article</ThemedText>
      <View style={styles.ligne}>
        <Champ style={styles.champ} placeholder="Ex. : piment, sel, sacs congélation" value={nouvelArticle} onChangeText={setNouvelArticle} />
        <Bouton libelle="Ajouter" variante="secondaire" onPress={ajouter} desactive={!nouvelArticle.trim()} enCours={envoi} />
      </View>
    </Ecran>
  );
}


const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  case: { flex: 1, gap: 2, paddingVertical: Spacing.one },
  coche: { textDecorationLine: "line-through", opacity: 0.6 },
  retirer: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  champ: { flex: 1 },
});
