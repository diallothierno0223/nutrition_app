// Exécution d'un envoi de la file sur Supabase. Chaque étape est rejouable sans doublon : identifiants choisis par le
// téléphone, insertions « ignorer si déjà là », photo déposée à un chemin fixe.
import { File } from "expo-file-system";

import { BUCKET_PHOTOS } from "@/donnees/photos";
import { supabase } from "@/lib/supabase";
import type { Envoi } from "@/synchro/envois";

/**
 * L'analyse a échoué côté serveur (IA indisponible…) alors que le Repas est déjà enregistré : il reste en attente,
 * réessayé plus tard ; abandonné au bout de nombreux échecs (`limiteDeTentatives`), il garde sa fiche et sa relance.
 */
class AnalyseEchouee extends Error {
  readonly repasEnregistre = true;
}

async function verifier<T extends { error: unknown }>(requete: PromiseLike<T>): Promise<T> {
  const resultat = await requete;
  if (resultat.error) throw resultat.error;
  return resultat;
}

async function utilisateurConnecte(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Session requise");
  return id;
}

/** Repas en attente (ticket 18) : photo, puis Repas, puis analyse. Chaque étape déjà faite est simplement refaite. */
async function envoyerRepasEnAttente(envoi: Extract<Envoi, { type: "repas_en_attente" }>): Promise<void> {
  // La photo locale n'est supprimée qu'une fois tout réussi : si elle manque, le Repas part sans photo.
  let photoChemin: string | null = null;
  const photo = envoi.photoLocale ? new File(envoi.photoLocale) : null;
  if (photo?.exists) {
    photoChemin = `${await utilisateurConnecte()}/${envoi.id}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET_PHOTOS)
      .upload(photoChemin, await photo.bytes(), { contentType: "image/jpeg" });
    // Déjà déposée lors d'un essai précédent : rien à refaire (le bucket n'autorise pas le remplacement).
    if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  }

  await verifier(
    supabase.from("repas").upsert(
      {
        id: envoi.id,
        description: envoi.description,
        photo_chemin: photoChemin,
        mange_le: envoi.mangeLe,
        journee: envoi.journee,
        type_repas: envoi.typeRepas,
      },
      { onConflict: "id", ignoreDuplicates: true },
    ),
  );

  const { data } = await verifier(supabase.from("repas").select("statut").eq("id", envoi.id).maybeSingle());
  if (data?.statut === "en_attente") await analyser(envoi.id);

  if (photo?.exists) photo.delete();
}

/** Lance l'analyse ; sans réseau, l'erreur remonte telle quelle (le rejeu s'arrête). */
async function analyser(repasId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("analyser-repas", { body: { repas_id: repasId } });
  if (!error) return;
  if ((error as { name?: string }).name === "FunctionsFetchError") throw error;
  throw new AnalyseEchouee(`analyse : ${(error as Error).message}`);
}

export async function executerEnvoi(envoi: Envoi): Promise<void> {
  switch (envoi.type) {
    case "cocher_ingredient":
      await verifier(supabase.from("ingredients_de_recette").update({ coche: envoi.coche }).eq("id", envoi.ingredientId));
      return;
    case "cocher_article":
      await verifier(supabase.from("articles_manuels").update({ coche: envoi.coche }).eq("id", envoi.articleId));
      return;
    case "ajouter_article":
      await verifier(
        supabase
          .from("articles_manuels")
          .upsert(
            { id: envoi.id, rendez_vous_id: envoi.rendezVousId, nom: envoi.nom },
            { onConflict: "id", ignoreDuplicates: true },
          ),
      );
      return;
    case "ajouter_eau":
      await verifier(
        supabase
          .from("hydratation")
          .upsert(
            { id: envoi.id, quantite_ml: envoi.quantiteMl, bu_le: envoi.buLe, journee: envoi.journee },
            { onConflict: "id", ignoreDuplicates: true },
          ),
      );
      return;
    case "repas_depuis_plat":
      await verifier(
        supabase.rpc("enregistrer_repas_depuis_plat", {
          p_id: envoi.id,
          p_description: envoi.description,
          p_mange_le: envoi.mangeLe,
          p_journee: envoi.journee,
          p_type_repas: envoi.typeRepas,
          p_constituants: envoi.constituants,
        }),
      );
      if (envoi.precision) {
        await verifier(supabase.from("repas").update({ precision: envoi.precision }).eq("id", envoi.id));
        // Le Repas est enregistré avec ses Constituants : une analyse ratée ne doit pas tout renvoyer. Sa fiche montre
        // la précision et permet de relancer l'analyse.
        await analyser(envoi.id).catch((e) => {
          if (!(e instanceof AnalyseEchouee)) throw e;
          console.warn("précision non analysée :", e.message);
        });
      }
      return;
    case "repas_en_attente":
      await envoyerRepasEnAttente(envoi);
      return;
  }
}
