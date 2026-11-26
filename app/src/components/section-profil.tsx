import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { enregistrerProfil, type Profil } from "@/donnees/profil";
import { fuseauDuTelephone } from "@/donnees/repas";
import { lireNombre, versTexte } from "@/lib/saisie";
import { NIVEAUX_D_ACTIVITE, SEXES, estUneJourneeValide, libelleDuNiveauDActivite, libelleDuSexe } from "@noyau";


type Saisie = {
  taille: string;
  date_naissance: string;
  sexe: Profil["sexe"];
  niveau_activite: Profil["niveau_activite"];
  objectifs_personnels: string;
  variation: string;
  echeance: string;
};

const versSaisie = (p: Profil): Saisie => ({
  taille: versTexte(p.taille_cm),
  date_naissance: p.date_naissance ?? "",
  sexe: p.sexe,
  niveau_activite: p.niveau_activite,
  objectifs_personnels: p.objectifs_personnels,
  variation: versTexte(p.objectif_poids_variation_kg),
  echeance: p.objectif_poids_echeance ?? "",
});

/** Renvoie le Profil, ou un message expliquant ce qui ne va pas. */
function depuisSaisie(s: Saisie): Profil | string {
  const taille = lireNombre(s.taille);
  const variation = lireNombre(s.variation);
  if (taille === undefined || (taille !== null && (taille < 100 || taille > 250))) return "Taille entre 100 et 250 cm.";
  if (s.date_naissance && !estUneJourneeValide(s.date_naissance)) return "Date de naissance au format AAAA-MM-JJ.";
  if (variation === undefined) return "La variation de poids doit être un nombre (ex. 2 ou -3).";
  if (s.echeance && !estUneJourneeValide(s.echeance)) return "Échéance au format AAAA-MM-JJ.";
  if ((variation === null) !== (s.echeance === "")) return "Indique à la fois la variation de poids et son échéance.";
  return {
    taille_cm: taille,
    date_naissance: s.date_naissance || null,
    sexe: s.sexe,
    niveau_activite: s.niveau_activite,
    objectifs_personnels: s.objectifs_personnels.trim(),
    objectif_poids_variation_kg: variation,
    objectif_poids_echeance: s.echeance || null,
  };
}

/** Profil, Objectifs personnels et Objectif de poids. */
export function SectionProfil({ profil, onEnregistre }: { profil: Profil; onEnregistre: () => void }) {
  const [saisie, setSaisie] = useState(() => versSaisie(profil));
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const modifier = (changement: Partial<Saisie>) => {
    setSaisie({ ...saisie, ...changement });
    setMessage(null);
  };

  async function enregistrer() {
    const resultat = depuisSaisie(saisie);
    if (typeof resultat === "string") return setMessage(resultat);
    setEnvoi(true);
    try {
      await enregistrerProfil(resultat, fuseauDuTelephone());
      setMessage("Profil enregistré.");
      onEnregistre();
    } catch {
      setMessage("Enregistrement impossible. Vérifie ta connexion.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">Profil</ThemedText>
      <View style={styles.ligne}>
        <Champ style={styles.moitie} placeholder="Taille (cm)" keyboardType="decimal-pad" value={saisie.taille}
          onChangeText={(taille) => modifier({ taille })} />
        <Champ style={styles.moitie} placeholder="Naissance AAAA-MM-JJ" value={saisie.date_naissance}
          onChangeText={(date_naissance) => modifier({ date_naissance })} />
      </View>
      <Puces options={SEXES} valeur={saisie.sexe} libelle={libelleDuSexe} onChange={(sexe) => modifier({ sexe })} />
      <Puces options={NIVEAUX_D_ACTIVITE} valeur={saisie.niveau_activite} libelle={libelleDuNiveauDActivite}
        onChange={(niveau_activite) => modifier({ niveau_activite })} />
      <ThemedText type="small" themeColor="textSecondary">
        Fuseau horaire : {fuseauDuTelephone()} (celui du téléphone, enregistré avec le Profil)
      </ThemedText>

      <ThemedText type="smallBold">Objectifs personnels</ThemedText>
      <Champ multiline placeholder="Ex. : prendre 2 kg en 6 mois, réduire le sucre, manger plus de fibres"
        value={saisie.objectifs_personnels} onChangeText={(objectifs_personnels) => modifier({ objectifs_personnels })} />

      <ThemedText type="smallBold">Objectif de poids</ThemedText>
      <View style={styles.ligne}>
        <Champ style={styles.moitie} placeholder="Variation (kg, ex. 2)" keyboardType="numbers-and-punctuation"
          value={saisie.variation} onChangeText={(variation) => modifier({ variation })} />
        <Champ style={styles.moitie} placeholder="Échéance AAAA-MM-JJ" value={saisie.echeance}
          onChangeText={(echeance) => modifier({ echeance })} />
      </View>

      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton libelle="Enregistrer le Profil" onPress={enregistrer} enCours={envoi} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  ligne: { flexDirection: "row", gap: Spacing.two },
  moitie: { flex: 1 },
});
