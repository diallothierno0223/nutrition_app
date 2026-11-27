import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Champ } from "@/components/champ";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { ajouterConstituant } from "@/donnees/repas";
import { useEnvoi } from "@/hooks/use-envoi";
import { lireNombre } from "@/lib/saisie";
import { NUTRIMENTS, libelleDuNutriment, uniteDuNutriment, type Constituant, type Nutriment, type Unite } from "@noyau";

const UNITES: readonly Unite[] = ["g", "ml"];
const VIDE = Object.fromEntries(NUTRIMENTS.map((n) => [n, ""])) as Record<Nutriment, string>;

/** Le Constituant saisi, null si un champ manque ou n'est pas un nombre positif (nutriments vides = 0). */
function lireConstituant(nom: string, quantite: string, unite: Unite, equivalent: string, valeurs: Record<Nutriment, string>) {
  const q = lireNombre(quantite);
  if (!nom.trim() || !q || q <= 0) return null;
  const constituant = { nom: nom.trim(), quantite: q, unite, equivalent_cuisine: equivalent.trim() } as Constituant;
  for (const n of NUTRIMENTS) {
    const v = lireNombre(valeurs[n]);
    if (v === undefined || (v !== null && v < 0)) return null;
    constituant[n] = v ?? 0;
  }
  return constituant;
}

/** Ajout à la main d'un Constituant oublié par l'IA, avec ses nutriments pour la quantité saisie. */
export function AjoutConstituant({ repasId, onChange }: { repasId: string; onChange: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [quantite, setQuantite] = useState("");
  const [unite, setUnite] = useState<Unite>("g");
  const [equivalent, setEquivalent] = useState("");
  const [valeurs, setValeurs] = useState(VIDE);
  const { envoi, erreur, envoyer } = useEnvoi("Ajout impossible. Vérifie ta connexion.");

  const constituant = lireConstituant(nom, quantite, unite, equivalent, valeurs);

  function fermer() {
    setOuvert(false);
    setNom("");
    setQuantite("");
    setEquivalent("");
    setValeurs(VIDE);
  }

  async function ajouter() {
    const nouveau = constituant;
    if (nouveau && (await envoyer(() => ajouterConstituant(repasId, nouveau)))) {
      fermer();
      onChange();
    }
  }

  if (!ouvert) return <Bouton libelle="Ajouter un Constituant" variante="secondaire" onPress={() => setOuvert(true)} />;

  return (
    <View style={styles.bloc}>
      <ThemedText type="smallBold">Nouveau Constituant</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Pour laisser l'IA l'estimer, utilise plutôt une précision et relance l'analyse.
      </ThemedText>
      <Champ placeholder="Nom (ex. : huile d'arachide)" value={nom} onChangeText={setNom} />
      <Champ placeholder="Quantité" keyboardType="decimal-pad" value={quantite} onChangeText={setQuantite} />
      <Puces options={UNITES} valeur={unite} libelle={(u) => u} onChange={setUnite} />
      <Champ placeholder="Équivalent en cuisine (ex. : 1 c. à soupe)" value={equivalent} onChangeText={setEquivalent} />
      <View style={styles.grille}>
        {NUTRIMENTS.map((n) => (
          <Champ
            key={n}
            style={styles.nutriment}
            placeholder={`${libelleDuNutriment(n)} (${uniteDuNutriment(n)})`}
            keyboardType="decimal-pad"
            value={valeurs[n]}
            onChangeText={(texte) => setValeurs((v) => ({ ...v, [n]: texte }))}
          />
        ))}
      </View>
      {erreur && <ThemedText themeColor="textSecondary">{erreur}</ThemedText>}
      <View style={styles.actions}>
        <Bouton libelle="Ajouter" variante="secondaire" onPress={ajouter} desactive={!constituant} enCours={envoi} />
        <Bouton libelle="Annuler" variante="discret" onPress={fermer} desactive={envoi} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { gap: Spacing.two },
  grille: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  nutriment: { flexBasis: "47%", flexGrow: 1 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});
