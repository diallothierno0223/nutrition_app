import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet } from "react-native";

import { useSession } from "@/auth/session";
import { Bouton } from "@/components/bouton";
import { CompteurEau } from "@/components/compteur-eau";
import { CourbeDePoids } from "@/components/courbe-de-poids";
import { Ecran } from "@/components/ecran";
import { ThemedText } from "@/components/themed-text";
import { Jauges } from "@/components/jauges";
import { MoyenneGlobale } from "@/components/moyenne-globale";
import { RecapSemaine } from "@/components/recap-semaine";
import { formaterValeur } from "@/components/valeurs-nutritionnelles";
import { Spacing } from "@/constants/theme";
import { chargerObjectifEau, eauDuJour } from "@/donnees/hydratation";
import {
  chargerObjectifs,
  totauxDeLaSemaine,
  totauxDesJournees,
  totauxDuJour,
  type TotauxDUneJournee,
} from "@/donnees/objectifs";
import { listerPesees, type Pesee } from "@/donnees/profil";
import { fuseauDuTelephone, repasDeLaJournee, type RepasDetaille } from "@/donnees/repas";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";
import { rafraichirNotifications } from "@/notifications/programmation";
import { importerPesees, pasDuJour } from "@/sante/health-connect";
import {
  journeeDe,
  journeesDeLaSemaine,
  libelleDuTypeDeRepas,
  lundiDe,
  totauxDuRepas,
  type ObjectifsJournaliers,
  type ValeursNutritionnelles,
} from "@noyau";

type DonneesDuJour = {
  journee: string;
  repas: RepasDetaille[];
  totaux: ValeursNutritionnelles;
  objectifs: ObjectifsJournaliers;
  pesees: Pesee[];
  eauMl: number;
  objectifEauMl: number | null;
  totauxSemaine: ValeursNutritionnelles;
  journeesSemaine: TotauxDUneJournee[];
  /** Pas du jour lus dans Health Connect ; null sans autorisation (ou sans Health Connect). */
  pas: number | null;
  /** Incrémenté à chaque chargement, pour que la moyenne globale se recalcule aussi. */
  chargement: number;
};

export default function Dashboard() {
  const { session } = useSession();
  const theme = useTheme();
  const [donnees, setDonnees] = useState<DonneesDuJour | null>(null);
  const [erreur, setErreur] = useState(false);

  // Rechargé à chaque retour sur l'onglet (et après un ajout d'eau) : les jauges suivent la Journée.
  const charger = useCallback(() => {
    const journee = journeeDe(new Date(), fuseauDuTelephone());
    const semaine = journeesDeLaSemaine(journee);
    Promise.all([
      repasDeLaJournee(journee),
      totauxDuJour(journee),
      chargerObjectifs(),
      // Les nouvelles mesures de poids de Health Connect deviennent des Pesées avant d'afficher la courbe.
      importerPesees()
        .catch(() => 0)
        .then(() => listerPesees(14)),
      eauDuJour(journee),
      chargerObjectifEau(),
      totauxDeLaSemaine(lundiDe(journee)),
      totauxDesJournees(semaine[0] ?? journee, semaine[6] ?? journee),
      pasDuJour().catch(() => null),
    ]).then(
      ([repas, totaux, objectifs, pesees, eauMl, objectifEauMl, totauxSemaine, journeesSemaine, pas]) => {
        setDonnees((avant) => ({
          journee,
          repas,
          totaux,
          objectifs,
          pesees,
          eauMl,
          objectifEauMl,
          totauxSemaine,
          journeesSemaine,
          pas,
          chargement: (avant?.chargement ?? 0) + 1,
        }));
        setErreur(false);
        // Chiffres à jour pour la notification du soir (après un Repas, un ajout d'eau ou au retour dans l'app).
        rafraichirNotifications({ totaux, objectifs, eauMl, objectifEauMl });
      },
      () => setErreur(true),
    );
  }, []);
  useFocusEffect(charger);

  const journal = donnees?.repas;

  return (
    <Ecran titre="Aujourd'hui">
      {erreur && <ThemedText themeColor="textSecondary">La base ne répond pas.</ThemedText>}

      {donnees && <Jauges totaux={donnees.totaux} objectifs={donnees.objectifs} />}

      {donnees && (
        <CompteurEau
          totalMl={donnees.eauMl}
          objectifMl={donnees.objectifEauMl}
          onChange={charger}
        />
      )}

      {donnees && (
        <RecapSemaine
          aujourdhui={donnees.journee}
          totauxSemaine={donnees.totauxSemaine}
          journees={donnees.journeesSemaine}
          objectifs={donnees.objectifs}
        />
      )}
      {donnees && (
        <MoyenneGlobale aujourdhui={donnees.journee} objectifs={donnees.objectifs} rafraichissement={donnees.chargement} />
      )}

      {donnees?.pas != null && (
        <ThemedText type="smallBold">
          Pas du jour : {donnees.pas.toLocaleString("fr-FR")}
        </ThemedText>
      )}

      <ThemedText type="smallBold">Poids</ThemedText>
      {donnees && <CourbeDePoids pesees={donnees.pesees} />}

      <ThemedText type="smallBold">Repas du jour</ThemedText>
      {journal?.length === 0 && <ThemedText themeColor="textSecondary">Aucun Repas enregistré aujourd'hui.</ThemedText>}
      {journal?.map((repas) => (
        <Pressable
          key={repas.id}
          onPress={() => router.push({ pathname: "/repas/[id]", params: { id: repas.id } })}
          style={[styles.carte, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">
            {libelleDuTypeDeRepas(repas.type_repas)} ·{" "}
            {repas.statut === "analyse"
              ? formaterValeur("calories", totauxDuRepas(repas.constituants).calories)
              : "en attente"}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {repas.description || "Repas en photo"}
          </ThemedText>
        </Pressable>
      ))}

      <ThemedText type="small" themeColor="textSecondary">
        Connecté : {session?.user.email}
      </ThemedText>
      <Bouton libelle="Réglages" variante="secondaire" onPress={() => router.push("/reglages")} />
      <Bouton libelle="Se déconnecter" variante="secondaire" onPress={() => supabase.auth.signOut()} />
    </Ecran>
  );
}

const styles = StyleSheet.create({
  carte: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
});
