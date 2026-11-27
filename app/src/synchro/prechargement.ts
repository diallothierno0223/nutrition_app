// Préchargement du cache à l'ouverture (ADR 0002) : tout ce qui doit rester consultable hors ligne est lu une fois,
// même si l'écran correspondant n'a pas été ouvert (la Liste de courses au marché, par exemple).
import { PERIODES_DE_MOYENNE, ajouterJours, debutDePeriode, journeeDe, journeesDeLaSemaine, lundiDe } from "@noyau";

import { listerAjoutsManuels } from "@/donnees/courses";
import { chargerObjectifEau, eauDuJour } from "@/donnees/hydratation";
import { chargerObjectifs, totauxDeLaSemaine, totauxDesJournees, totauxDuJour } from "@/donnees/objectifs";
import { chargerPlat, listerPlats, listerPlatsDeLaSemaine } from "@/donnees/plats";
import { chargerProfil } from "@/donnees/profil";
import { chargerReglagesDesNotifications } from "@/donnees/reglages";
import { listerRegles } from "@/donnees/regles";
import { fuseauDuTelephone, repasDeLaJournee } from "@/donnees/repas";
import { chargerReglagesDuSamedi, chargerRendezVous, dernierRendezVous } from "@/donnees/samedi";

/** Les 7 derniers jours de Repas et d'Hydratation, comme le prévoit l'ADR 0002. */
const JOURS_EN_CACHE = 7;

export async function prechargerLeCache(): Promise<void> {
  const aujourdhui = journeeDe(new Date(), fuseauDuTelephone());
  const journees = Array.from({ length: JOURS_EN_CACHE }, (_, i) => ajouterJours(aujourdhui, -i));
  const semaine = journeesDeLaSemaine(aujourdhui);
  const [rendezVous, plats, platsDeLaSemaine] = await Promise.all([
    dernierRendezVous(),
    listerPlats(),
    listerPlatsDeLaSemaine(),
  ]);
  const lectures = await Promise.allSettled([
    chargerObjectifs(),
    chargerObjectifEau(),
    chargerProfil(),
    listerRegles(),
    chargerReglagesDesNotifications(),
    chargerReglagesDuSamedi(),
    ...journees.flatMap((j) => [repasDeLaJournee(j), eauDuJour(j), totauxDuJour(j)]),
    // Semaine et moyenne, avec les mêmes bornes que le Dashboard : leur dernière valeur reste affichable hors ligne.
    totauxDeLaSemaine(lundiDe(aujourdhui)),
    totauxDesJournees(semaine[0] ?? aujourdhui, semaine[6] ?? aujourdhui),
    ...PERIODES_DE_MOYENNE.map((p) => totauxDesJournees(debutDePeriode(aujourdhui, p), aujourdhui)),
    ...[...plats, ...platsDeLaSemaine].map((p) => chargerPlat(p.id)),
    ...(rendezVous ? [chargerRendezVous(rendezVous.id), listerAjoutsManuels(rendezVous.id)] : []),
  ]);
  const echecs = lectures.filter((l) => l.status === "rejected").length;
  if (echecs > 0) console.warn(`préchargement : ${echecs} lecture(s) non mises en cache`);
}
