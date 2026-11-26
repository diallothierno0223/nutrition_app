// Vérification de bout en bout : la fonction répond et utilise le noyau métier.
// La session est exigée par la passerelle Supabase (verify_jwt, activé par défaut), pas par ce code.
import { NUTRIMENTS, sensDuNutriment } from "../../../noyau/index.ts";

Deno.serve(() => {
  const sens = Object.fromEntries(NUTRIMENTS.map((n) => [n, sensDuNutriment(n)]));
  return Response.json({ statut: "ok", sens });
});
