import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { BandeauHorsLigne } from "@/components/bandeau-hors-ligne";
import { Carte } from "@/components/carte";
import { CompteurEau } from "@/components/compteur-eau";
import { Ecran } from "@/components/ecran";
import { Jauges } from "@/components/jauges";
import { LigneDeListe } from "@/components/ligne-de-liste";
import { MoyenneGlobale } from "@/components/moyenne-globale";
import { PoidsEtPas } from "@/components/poids-et-pas";
import { RecapSemaine } from "@/components/recap-semaine";
import { ResumeDuJour } from "@/components/resume-du-jour";
import { ThemedText } from "@/components/themed-text";
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
import { useCouleursJauge } from "@/hooks/use-theme";
import { rafraichirNotifications } from "@/notifications/programmation";
import { synchroniserSante } from "@/sante/health-connect";
import { surRejeu } from "@/synchro/synchro";
import {
  formaterQuantite,
  journeeDe,
  journeesDeLaSemaine,
  libelleDHeure,
  libelleDuTypeDeRepas,
  lundiDe,
  totauxDuRepas,
  versHeure,
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
  const [donnees, setDonnees] = useState<DonneesDuJour | null>(null);
  const [erreur, setErreur] = useState(false);

  // Rechargé à chaque retour sur l'onglet (et après un ajout d'eau) : les jauges suivent la Journée.
  const charger = useCallback(() => {
    const journee = journeeDe(new Date(), fuseauDuTelephone());
    const semaine = journeesDeLaSemaine(journee);
    // Health Connect d'abord (pas du jour, et nouvelles mesures de poids importées en Pesées au plus une fois par
    // heure), pour que la courbe de poids les montre ; une panne de Health Connect n'empêche rien d'afficher.
    const sante = synchroniserSante().catch(() => ({ pas: null }));
    Promise.all([
      repasDeLaJournee(journee),
      totauxDuJour(journee),
      chargerObjectifs(),
      sante.then(() => listerPesees(14)),
      eauDuJour(journee),
      chargerObjectifEau(),
      totauxDeLaSemaine(lundiDe(journee)),
      totauxDesJournees(semaine[0] ?? journee, semaine[6] ?? journee),
      sante,
    ]).then(
      ([repas, totaux, objectifs, pesees, eauMl, objectifEauMl, totauxSemaine, journeesSemaine, { pas }]) => {
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
  // Au retour du réseau, la file d'envoi part : on relit les vraies valeurs du serveur.
  useEffect(() => surRejeu(charger), [charger]);

  const journal = donnees?.repas;
  const couleurs = useCouleursJauge();

  return (
    <Ecran titre="Aujourd'hui">
      <BandeauHorsLigne />
      {erreur && <ThemedText themeColor="textSecondary">La base ne répond pas.</ThemedText>}

      {donnees && <ResumeDuJour totaux={donnees.totaux} objectifs={donnees.objectifs} />}

      {donnees && (
        <Carte titre="Nutriments" detail="Repas analysés du jour">
          <Jauges totaux={donnees.totaux} objectifs={donnees.objectifs} />
        </Carte>
      )}

      {donnees && <CompteurEau totalMl={donnees.eauMl} objectifMl={donnees.objectifEauMl} onChange={charger} />}

      {journal && (
        <Carte titre="Repas du jour">
          {journal.length === 0 && <ThemedText themeColor="textSecondary">Aucun Repas enregistré aujourd'hui.</ThemedText>}
          {journal.map((repas) => (
            <LigneDeListe
              key={repas.id}
              surtitre={`${libelleDuTypeDeRepas(repas.type_repas)} · ${heureDuRepas(repas.mange_le)}`}
              titre={repas.description || "Repas en photo"}
              detail={repas.enFile && repas.statut === "analyse" ? "Envoi en attente" : undefined}
              valeur={
                repas.statut === "analyse"
                  ? formaterQuantite("calories", totauxDuRepas(repas.constituants).calories)
                  : repas.enFile
                    ? "en attente de réseau"
                    : "en attente"
              }
              couleurValeur={repas.statut === "analyse" ? undefined : couleurs.en_dessous}
              onPress={() => router.push({ pathname: "/repas/[id]", params: { id: repas.id } })}
            />
          ))}
        </Carte>
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

      {donnees && <PoidsEtPas pesees={donnees.pesees} pas={donnees.pas} />}
    </Ecran>
  );
}

/** « 13 h 05 » : l'heure du Repas, dans le fuseau du téléphone. */
const heureDuRepas = (mangeLe: string) => libelleDHeure(versHeure(new Date(mangeLe)));
