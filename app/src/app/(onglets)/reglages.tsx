import { router, type Href } from "expo-router";

import { useSession } from "@/auth/session";
import { Bouton } from "@/components/bouton";
import { Carte } from "@/components/carte";
import { Ecran } from "@/components/ecran";
import { LigneDeListe } from "@/components/ligne-de-liste";
import { supabase } from "@/lib/supabase";

const SECTIONS: { titre: string; description: string; route: Href }[] = [
  { titre: "Profil et Pesées", description: "Taille, naissance, activité, Objectif de poids, Pesées", route: "/reglages/profil" },
  { titre: "Règles du médecin", description: "Consignes qui guident chaque analyse de l'IA", route: "/reglages/regles" },
  { titre: "Notifications", description: "Heures des rappels, activation, test", route: "/reglages/notifications" },
  { titre: "Santé connectée", description: "Health Connect : pas du jour et poids", route: "/reglages/sante" },
  { titre: "Rendez-vous du samedi", description: "Nombre de Recettes, de portions et de petits-déjeuners", route: "/reglages/samedi" },
  { titre: "Données", description: "Export de toutes tes données (ZIP de CSV)", route: "/reglages/donnees" },
];

/** Réglages : tout ce qui se configure dans l'app, rangé par section. */
export default function Reglages() {
  const { session } = useSession();

  return (
    <Ecran titre="Réglages">
      <Carte>
        {SECTIONS.map((s) => (
          <LigneDeListe key={s.titre} titre={s.titre} detail={s.description} onPress={() => router.push(s.route)} />
        ))}
      </Carte>

      <Carte titre="Compte" detail={session?.user.email ? `Connecté : ${session.user.email}` : undefined}>
        <Bouton libelle="Se déconnecter" variante="secondaire" onPress={() => supabase.auth.signOut()} />
      </Carte>
    </Ecran>
  );
}
