import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { ChampDate } from "@/components/champ-date-heure";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { ajouterRegle, archiverRegle, listerRegles, modifierRegle, type Regle } from "@/donnees/regles";
import { fuseauDuTelephone } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";
import {
  CATEGORIES_DE_REGLE,
  contientUnSeuilChiffre,
  journeeDe,
  libelleDeCategorie,
  libelleDeJournee,
  type CategorieDeRegle,
} from "@noyau";

type Brouillon = { id: string | null; categorie: CategorieDeRegle; texte: string; date_consultation: string };

const nouveauBrouillon = (): Brouillon => ({
  id: null,
  categorie: "a_privilegier",
  texte: "",
  date_consultation: journeeDe(new Date(), fuseauDuTelephone()),
});

export default function Regles() {
  const theme = useTheme();
  const [regles, setRegles] = useState<Regle[] | null>(null);
  const [brouillon, setBrouillon] = useState<Brouillon>(nouveauBrouillon);
  const [voirArchivees, setVoirArchivees] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(() => {
    listerRegles().then(setRegles, () => setMessage("Impossible de charger les Règles du médecin."));
  }, []);
  useFocusEffect(charger);

  async function enregistrer() {
    setEnvoi(true);
    try {
      const { id, ...regle } = brouillon;
      if (id) await modifierRegle(id, regle);
      else await ajouterRegle(regle);
      setBrouillon(nouveauBrouillon());
      setMessage(null);
      charger();
    } catch {
      setMessage("Enregistrement impossible. Vérifie ta connexion.");
    } finally {
      setEnvoi(false);
    }
  }

  async function basculerArchive(regle: Regle) {
    try {
      await archiverRegle(regle.id, regle.archivee_le === null);
      charger();
    } catch {
      setMessage("Action impossible. Vérifie ta connexion.");
    }
  }

  const champ = [styles.champ, { color: theme.text, backgroundColor: theme.backgroundElement }];
  const actives = regles?.filter((r) => r.archivee_le === null) ?? [];
  const archivees = regles?.filter((r) => r.archivee_le !== null) ?? [];

  return (
    <Ecran>
      <ThemedText themeColor="textSecondary">
        Les consignes actives guident chaque analyse de l'IA. Les chiffres (grammes, kcal) vont dans les Objectifs.
      </ThemedText>

      <View style={styles.categories}>
        {CATEGORIES_DE_REGLE.map((c) => (
          <Pressable
            key={c}
            onPress={() => setBrouillon({ ...brouillon, categorie: c })}
            style={[
              styles.puce,
              { backgroundColor: brouillon.categorie === c ? theme.backgroundSelected : theme.backgroundElement },
            ]}>
            <ThemedText type={brouillon.categorie === c ? "smallBold" : "small"}>{libelleDeCategorie(c)}</ThemedText>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={[champ, styles.texte]}
        placeholder="Ex. : éviter l'huile de palme et les fritures"
        placeholderTextColor={theme.textSecondary}
        multiline
        value={brouillon.texte}
        onChangeText={(texte) => setBrouillon({ ...brouillon, texte })}
      />
      {contientUnSeuilChiffre(brouillon.texte) && (
        <ThemedText type="small" themeColor="textSecondary">
          Cette consigne contient un seuil chiffré : pense à le reporter dans tes Objectifs, c'est là que les jauges le
          lisent.
        </ThemedText>
      )}
      <View style={styles.ligne}>
        <ThemedText type="small" themeColor="textSecondary">
          Consultation du
        </ThemedText>
        <ChampDate
          style={styles.date}
          placeholder="Date"
          valeur={brouillon.date_consultation}
          max={journeeDe(new Date(), fuseauDuTelephone())}
          onChange={(date_consultation) => setBrouillon({ ...brouillon, date_consultation })}
        />
      </View>
      {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
      <Bouton
        libelle={brouillon.id ? "Enregistrer la modification" : "Ajouter la consigne"}
        onPress={enregistrer}
        enCours={envoi}
        desactive={!brouillon.texte.trim()}
      />
      {brouillon.id && (
        <Bouton libelle="Annuler la modification" variante="secondaire" onPress={() => setBrouillon(nouveauBrouillon())} />
      )}

      <ThemedText type="smallBold">Consignes actives</ThemedText>
      {regles && actives.length === 0 && <ThemedText themeColor="textSecondary">Aucune consigne active.</ThemedText>}
      {actives.map((r) => (
        <CarteRegle key={r.id} regle={r} onModifier={() =>
            setBrouillon({ id: r.id, categorie: r.categorie, texte: r.texte, date_consultation: r.date_consultation })
          } onArchiver={() => basculerArchive(r)} />
      ))}

      {archivees.length > 0 && (
        <Bouton
          libelle={voirArchivees ? "Masquer les consignes archivées" : `Voir les consignes archivées (${archivees.length})`}
          variante="secondaire"
          onPress={() => setVoirArchivees(!voirArchivees)}
        />
      )}
      {voirArchivees &&
        archivees.map((r) => <CarteRegle key={r.id} regle={r} onArchiver={() => basculerArchive(r)} />)}
    </Ecran>
  );
}

function CarteRegle({ regle, onModifier, onArchiver }: { regle: Regle; onModifier?: () => void; onArchiver: () => void }) {
  const theme = useTheme();
  const archivee = regle.archivee_le !== null;
  return (
    <View style={[styles.carte, { backgroundColor: theme.backgroundElement }, archivee && styles.attenue]}>
      <ThemedText type="small" themeColor="textSecondary">
        {libelleDeCategorie(regle.categorie)} · consultation du {libelleDeJournee(regle.date_consultation)}
      </ThemedText>
      <ThemedText>{regle.texte}</ThemedText>
      <View style={styles.actions}>
        {onModifier && <Bouton libelle="Modifier" variante="secondaire" onPress={onModifier} />}
        <Bouton libelle={archivee ? "Réactiver" : "Archiver"} variante="secondaire" onPress={onArchiver} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  categories: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  puce: { borderRadius: 999, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  champ: { borderRadius: 12, padding: Spacing.three, fontSize: 16 },
  texte: { minHeight: 90, textAlignVertical: "top" },
  ligne: { flexDirection: "row", alignItems: "center", gap: Spacing.three },
  date: { flex: 1 },
  carte: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  actions: { flexDirection: "row", gap: Spacing.two },
  attenue: { opacity: 0.6 },
});
