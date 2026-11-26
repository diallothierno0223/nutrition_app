import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { AppState } from "react-native";

import { supabase } from "@/lib/supabase";

type EtatSession = { session: Session | null; chargement: boolean };

const ContexteSession = createContext<EtatSession>({ session: null, chargement: true });

export function FournisseurSession({ children }: PropsWithChildren) {
  const [etat, setEtat] = useState<EtatSession>({ session: null, chargement: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEtat({ session: data.session, chargement: false }));
    const { data: abonnement } = supabase.auth.onAuthStateChange((_evenement, session) =>
      setEtat({ session, chargement: false }),
    );

    // Le jeton ne se rafraîchit que lorsque l'app est au premier plan.
    const ecouteur = AppState.addEventListener("change", (etatApp) => {
      if (etatApp === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      abonnement.subscription.unsubscribe();
      ecouteur.remove();
    };
  }, []);

  return <ContexteSession.Provider value={etat}>{children}</ContexteSession.Provider>;
}

export function useSession() {
  return useContext(ContexteSession);
}
