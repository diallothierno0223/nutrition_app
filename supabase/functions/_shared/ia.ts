// Port IA : la seule porte vers le modèle de langage. Deux implémentations :
// - factice : réponses prédéfinies, pour les tests et le développement sans clé ;
// - gemini : l'API Gemini (clé uniquement dans les secrets des Edge Functions).
// Toute réponse passe par la lecture défensive du noyau métier avant d'être utilisée.
import {
  NUTRIMENTS,
  libelleDeCategorie,
  libelleDuNutriment,
  libelleDuTypeDeRepas,
  uniteDuNutriment,
  lireAnalyseRepas,
  type AnalyseRepas,
  type ObjectifsJournaliers,
  type RegleDuMedecin,
  type TypeDeRepas,
} from "../../../noyau/index.ts";

export type DemandeAnalyseRepas = {
  description: string;
  typeDeRepas: TypeDeRepas;
  /** Ce qui reste dans les Objectifs du jour avant ce Repas ; null si aucun Objectif n'est défini. */
  objectifsRestants: ObjectifsJournaliers | null;
  /** Les Règles du médecin actives (jamais les archivées). Elles priment sur les repères par défaut. */
  reglesDuMedecin: RegleDuMedecin[];
};

/** « À éviter : Huile de palme », une ligne par Règle active. */
export function decrireRegles(regles: RegleDuMedecin[]): string {
  if (regles.length === 0) return "Aucune Règle du médecin enregistrée.";
  return regles.map((r) => `${libelleDeCategorie(r.categorie)} : ${r.texte}`).join("\n");
}

/** « Calories : reste 1985 kcal », une ligne par nutriment qui a un Objectif. */
export function decrireObjectifsRestants(restants: ObjectifsJournaliers | null): string {
  if (!restants) return "Aucun Objectif journalier défini.";
  return NUTRIMENTS.flatMap((n) => {
    const reste = restants[n];
    if (reste === null) return [];
    // Tournure sans accord : « Sucres : reste 45.9 g ».
    return [`${libelleDuNutriment(n)} : reste ${reste} ${uniteDuNutriment(n)}`];
  }).join("\n");
}

export interface IA {
  analyserRepas(demande: DemandeAnalyseRepas): Promise<AnalyseRepas>;
}

export function iaDepuisEnvironnement(): IA {
  const mode = Deno.env.get("IA_MODE");
  if (mode === "factice") return iaFactice;
  if (mode === "gemini") {
    const cle = Deno.env.get("GEMINI_API_KEY");
    if (!cle) throw new Error("GEMINI_API_KEY manquante");
    return iaGemini(cle, Deno.env.get("GEMINI_MODELE") || "gemini-3.8-flash");
  }
  throw new Error("IA_MODE doit valoir « factice » ou « gemini »");
}

const iaFactice: IA = {
  async analyserRepas({ description, objectifsRestants, reglesDuMedecin }) {
    const restants = objectifsRestants ? `\n${decrireObjectifsRestants(objectifsRestants)}` : "";
    const regles = reglesDuMedecin.length > 0 ? `\n${decrireRegles(reglesDuMedecin)}` : "";
    return lireAnalyseRepas({
      constituants: [
        { nom: "Riz blanc cuit", quantite: 150, unite: "g", equivalent_cuisine: "1 bol",
          calories: 195, proteines: 4, glucides: 42, sucres: 0.1, lipides: 0.5, ags: 0.1, fibres: 0.6, sel: 0 },
        { nom: "Sauce arachide", quantite: 200, unite: "ml", equivalent_cuisine: "1 louche",
          calories: 320, proteines: 12, glucides: 10, sucres: 4, lipides: 26, ags: 6.5, fibres: 3, sel: 1.8 },
      ],
      commentaire: `Analyse factice de « ${description} ».\nPoint fort : des glucides pour l'énergie.\nPoint faible : sauce riche en AGS.\nAmélioration : moins de pâte d'arachide.${restants}${regles}`,
    });
  },
};

const SCHEMA_CONSTITUANT = {
  type: "object",
  properties: {
    nom: { type: "string" },
    quantite: { type: "number", minimum: 0 },
    unite: { type: "string", enum: ["g", "ml"] },
    equivalent_cuisine: { type: "string" },
    ...Object.fromEntries(NUTRIMENTS.map((n) => [n, { type: "number", minimum: 0 }])),
  },
  required: ["nom", "quantite", "unite", "equivalent_cuisine", ...NUTRIMENTS],
};

const SCHEMA_ANALYSE = {
  type: "object",
  properties: {
    constituants: { type: "array", minItems: 1, items: SCHEMA_CONSTITUANT },
    commentaire: { type: "string" },
  },
  required: ["constituants", "commentaire"],
};

const CONSIGNES_ANALYSE = `Tu es nutritionniste. Tu aides une personne atteinte d'hypercholestérolémie génétique, qui mange souvent de la cuisine africaine (mafé, fonio, attiéké, poisson braisé…), à suivre son alimentation.
À partir de la description d'un repas, décompose-le en Constituants (un aliment par Constituant) et estime pour chacun :
- la quantité en grammes (g) ou millilitres (ml), et son équivalent en mesure de cuisine (« 1 louche », « 2 c. à soupe ») ;
- calories (kcal), protéines, glucides, dont sucres (sucres), lipides, acides gras saturés (ags), fibres et sel, tous en grammes, pour la quantité estimée.
Compte les huiles et matières grasses de cuisson comme des Constituants à part quand elles sont probables.
Rédige un Commentaire du repas en français, 10 lignes au maximum : un point fort, un point faible, une amélioration possible, en pensant d'abord aux acides gras saturés et aux fibres.
Tiens compte de ce qui restait dans les Objectifs du jour avant ce repas (une valeur négative signifie que l'Objectif était déjà dépassé), et conseille la suite de la journée.
Les Règles du médecin fournies priment sur tes repères généraux : signale explicitement tout aliment du repas qu'elles demandent d'éviter.
Réponds uniquement avec le JSON demandé.`;

function iaGemini(cle: string, modele: string): IA {
  return {
    async analyserRepas({ description, typeDeRepas, objectifsRestants, reglesDuMedecin }) {
      const demande = [
        `Type de repas : ${libelleDuTypeDeRepas(typeDeRepas)}`,
        `Description : ${description}`,
        `Objectifs restants avant ce repas :\n${decrireObjectifsRestants(objectifsRestants)}`,
        `Règles du médecin (elles priment) :\n${decrireRegles(reglesDuMedecin)}`,
      ].join("\n");
      const reponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": cle },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: CONSIGNES_ANALYSE }] },
          contents: [{ role: "user", parts: [{ text: demande }] }],
          generationConfig: { responseMimeType: "application/json", responseJsonSchema: SCHEMA_ANALYSE },
        }),
      });
      if (!reponse.ok) {
        console.error("Gemini :", reponse.status, await reponse.text());
        throw new Error(`Gemini a répondu ${reponse.status}`);
      }

      // Les parties « thought » (raisonnement du modèle) ne font pas partie de la réponse JSON.
      const corps = await reponse.json();
      const texte = (corps?.candidates?.[0]?.content?.parts ?? [])
        .filter((p: { thought?: boolean }) => !p.thought)
        .map((p: { text?: string }) => p.text ?? "")
        .join("");
      return lireAnalyseRepas(JSON.parse(texte));
    },
  };
}
