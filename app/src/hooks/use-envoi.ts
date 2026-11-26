import { useState } from "react";

/**
 * Une action envoyée au serveur depuis un formulaire : indicateur d'envoi et message d'erreur.
 * `envoyer` renvoie true si l'action a réussi.
 */
export function useEnvoi(messageDErreur = "Modification impossible. Vérifie ta connexion.") {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer(action: () => Promise<unknown>): Promise<boolean> {
    setEnvoi(true);
    setErreur(null);
    try {
      await action();
      return true;
    } catch {
      setErreur(messageDErreur);
      return false;
    } finally {
      setEnvoi(false);
    }
  }

  return { envoi, erreur, envoyer };
}
