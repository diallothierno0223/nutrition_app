import { Ecran } from "@/components/ecran";
import { ReglagesDesNotifications } from "@/components/reglages-des-notifications";
import { ReglagesDuSamedi } from "@/components/reglages-du-samedi";
import { SanteConnectee } from "@/components/sante-connectee";

/** Réglages : notifications, Health Connect et nombres du Rendez-vous du samedi. */
export default function Reglages() {
  return (
    <Ecran>
      <ReglagesDesNotifications />
      <SanteConnectee />
      <ReglagesDuSamedi />
    </Ecran>
  );
}
