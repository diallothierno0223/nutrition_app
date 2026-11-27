import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { Champ } from "@/components/champ";
import { ChampDate } from "@/components/champ-date-heure";
import { Ecran } from "@/components/ecran";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { Rayons, Spacing } from "@/constants/theme";
import { ajouterRegle, archiverRegle, listerRegles, modifierRegle, type Regle } from "@/donnees/regles";
import { fuseauDuTelephone } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";
import { messageDEchec } from "@/synchro/reseau";
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
    } catch (e) {
      setMessage(messageDEchec(e, "Enregistrement impossible. Vérifie ta connexion."));
    } finally {
      setEnvoi(false);
    }
  }

  async function basculerArchive(regle: Regle) {
    try {
      await archiverRegle(regle.id, regle.archivee_le === null);
      charger();
    } catch (e) {
      setMessage(messageDEchec(e, "Action impossible. Vérifie ta connexion."));
    }
  }

  const actives = regles?.filter((r) => r.archivee_le === null) ?? [];
  const archivees = regles?.filter((r) => r.archivee_le !== null) ?? [];

  return (
    <Ecran>
      <Carte
        titre={brouillon.id ? "Modifier la consigne" : "Nouvelle consigne"}
        detail="Les consignes actives guident chaque analyse de l'IA. Les chiffres (grammes, kcal) vont dans les Objectifs.">
        <Puces
          options={CATEGORIES_DE_REGLE}
          valeur={brouillon.categorie}
          libelle={libelleDeCategorie}
          onChange={(categorie) => setBrouillon({ ...brouillon, categorie })}
        />
        <Champ
          libelle="Consigne"
          placeholder="Ex. : éviter l'huile de palme et les fritures"
          multiline
          value={brouillon.texte}
          onChangeText={(texte) => setBrouillon({ ...brouillon, texte })}
        />
        {contientUnSeuilChiffre(brouillon.texte) && (
          <ThemedText type="detail">
            Cette consigne contient un seuil chiffré : pense à le reporter dans tes Objectifs, c'est là que les jauges le
            lisent.
          </ThemedText>
        )}
        <ChampDate
          libelle="Date de la consultation"
          placeholder="Choisir"
          valeur={brouillon.date_consultation}
          max={journeeDe(new Date(), fuseauDuTelephone())}
          onChange={(date_consultation) => setBrouillon({ ...brouillon, date_consultation })}
        />
        {message && <ThemedText themeColor="textSecondary">{message}</ThemedText>}
        <Bouton
          libelle={brouillon.id ? "Enregistrer la modification" : "Ajouter la consigne"}
          onPress={enregistrer}
          enCours={envoi}
          desactive={!brouillon.texte.trim()}
        />
        {brouillon.id && (
          <Bouton libelle="Annuler la modification" variante="discret" onPress={() => setBrouillon(nouveauBrouillon())} />
        )}
      </Carte>

      <Carte titre="Consignes actives">
        {regles && actives.length === 0 && <ThemedText themeColor="textSecondary">Aucune consigne active.</ThemedText>}
        {actives.map((r) => (
          <CarteRegle
            key={r.id}
            regle={r}
            onModifier={() =>
              setBrouillon({ id: r.id, categorie: r.categorie, texte: r.texte, date_consultation: r.date_consultation })
            }
            onArchiver={() => basculerArchive(r)}
          />
        ))}
      </Carte>

      {archivees.length > 0 && (
        <Carte titre="Consignes archivées" detail="Elles ne guident plus l'IA ; tu peux les réactiver.">
          <Bouton
            libelle={voirArchivees ? "Masquer" : `Voir les ${archivees.length} consigne${archivees.length > 1 ? "s" : ""}`}
            variante="discret"
            onPress={() => setVoirArchivees(!voirArchivees)}
          />
          {voirArchivees &&
            archivees.map((r) => <CarteRegle key={r.id} regle={r} onArchiver={() => basculerArchive(r)} />)}
        </Carte>
      )}
    </Ecran>
  );
}

function CarteRegle({ regle, onModifier, onArchiver }: { regle: Regle; onModifier?: () => void; onArchiver: () => void }) {
  const theme = useTheme();
  const archivee = regle.archivee_le !== null;
  return (
    <View style={[styles.regle, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="detail">
        {libelleDeCategorie(regle.categorie)} · consultation du {libelleDeJournee(regle.date_consultation)}
        {archivee ? " · archivée" : ""}
      </ThemedText>
      <ThemedText themeColor={archivee ? "textSecondary" : "text"}>{regle.texte}</ThemedText>
      <View style={styles.actions}>
        {onModifier && <Bouton libelle="Modifier" variante="secondaire" onPress={onModifier} />}
        <Bouton libelle={archivee ? "Réactiver" : "Archiver"} variante="discret" onPress={onArchiver} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  regle: { borderRadius: Rayons.moyen, padding: 14, gap: Spacing.two },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: Spacing.two },
});
