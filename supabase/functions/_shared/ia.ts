// Port IA : la seule porte vers le modèle de langage. Deux implémentations :
// - factice : réponses prédéfinies, pour les tests et le développement sans clé ;
// - gemini : l'API Gemini (clé uniquement dans les secrets des Edge Functions).
// Toute réponse passe par la lecture défensive du noyau métier avant d'être utilisée.
import {
  NUTRIMENTS,
  libelleDeCategorie,
  libelleDuNutriment,
  libelleDuNiveauDActivite,
  libelleDuTypeDeRepas,
  uniteDuNutriment,
  lireAnalyseRepas,
  lireEstimationObjectifs,
  type AnalyseRepas,
  type Constituant,
  type EstimationObjectifs,
  type ObjectifsJournaliers,
  type ProfilCorporel,
  type RegleDuMedecin,
  type TypeDeRepas,
} from "../../../noyau/index.ts";

/** Une photo de l'assiette, relue dans le stockage côté serveur. */
export type PhotoDuRepas = { typeMime: string; octets: Uint8Array };

export type DemandeAnalyseRepas = {
  /** La description saisie, ou la note qui accompagne la photo (éventuellement vide). */
  description: string;
  photo: PhotoDuRepas | null;
  /** Une précision ajoutée après coup pour corriger l'analyse (« j'ai ajouté une cuillère d'huile »). */
  precision: string | null;
  /** Les Constituants actuels quand on relance un Repas déjà analysé (base à corriger) ; vide sinon. */
  constituantsActuels: Constituant[];
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

export type DemandeEstimationObjectifs = {
  profil: ProfilCorporel;
  poidsKg: number;
  age: number;
  objectifsPersonnels: string;
  objectifDePoids: { variationKg: number; echeance: string } | null;
  /** Les calories de la formule garde-fou (Mifflin-St Jeor × activité). */
  caloriesGardeFou: number;
  reglesDuMedecin: RegleDuMedecin[];
};

export interface IA {
  analyserRepas(demande: DemandeAnalyseRepas): Promise<AnalyseRepas>;
  estimerObjectifs(demande: DemandeEstimationObjectifs): Promise<EstimationObjectifs>;
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
  async analyserRepas({ description, photo, precision, constituantsActuels, objectifsRestants, reglesDuMedecin }) {
    const recue = photo ? `\nPhoto reçue (${photo.octets.length} octets).` : "";
    const precisee = precision ? `\nPrécision : ${precision}` : "";
    const base = constituantsActuels.length > 0 ? `\nBase : ${constituantsActuels.map((c) => c.nom).join(", ")}` : "";
    const restants = objectifsRestants ? `\n${decrireObjectifsRestants(objectifsRestants)}` : "";
    const regles = reglesDuMedecin.length > 0 ? `\n${decrireRegles(reglesDuMedecin)}` : "";
    return lireAnalyseRepas({
      constituants: [
        { nom: "Riz blanc cuit", quantite: 150, unite: "g", equivalent_cuisine: "1 bol",
          calories: 195, proteines: 4, glucides: 42, sucres: 0.1, lipides: 0.5, ags: 0.1, fibres: 0.6, sel: 0 },
        { nom: "Sauce arachide", quantite: 200, unite: "ml", equivalent_cuisine: "1 louche",
          calories: 320, proteines: 12, glucides: 10, sucres: 4, lipides: 26, ags: 6.5, fibres: 3, sel: 1.8 },
      ],
      commentaire: `Analyse factice de « ${description} ».\nPoint fort : des glucides pour l'énergie.\nPoint faible : sauce riche en AGS.\nAmélioration : moins de pâte d'arachide.${recue}${precisee}${base}${restants}${regles}`,
    });
  },

  // Calories = formule garde-fou + 100 kcal ; les autres valeurs sont fixes.
  async estimerObjectifs({ caloriesGardeFou, objectifsPersonnels, reglesDuMedecin }) {
    const valeurs = { calories: caloriesGardeFou + 100, proteines: 90, glucides: 330, sucres: 40, lipides: 85, ags: 18, fibres: 30, sel: 5 };
    const contexte = `Objectifs personnels : ${objectifsPersonnels || "aucun"}. Règles du médecin : ${reglesDuMedecin.length}.`;
    return lireEstimationObjectifs({
      objectifs: Object.fromEntries(
        NUTRIMENTS.map((n) => [n, { valeur: valeurs[n], justification: `Estimation factice. ${contexte}` }]),
      ),
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
À partir de la description d'un repas, ou de sa photo accompagnée d'une note (huile, cuisson, sauce…), décompose-le en Constituants (un aliment par Constituant) et estime pour chacun :
- la quantité en grammes (g) ou millilitres (ml), et son équivalent en mesure de cuisine (« 1 louche », « 2 c. à soupe ») ;
- calories (kcal), protéines, glucides, dont sucres (sucres), lipides, acides gras saturés (ags), fibres et sel, tous en grammes, pour la quantité estimée.
Compte les huiles et matières grasses de cuisson comme des Constituants à part quand elles sont probables.
Rédige un Commentaire du repas en français, 10 lignes au maximum : un point fort, un point faible, une amélioration possible, en pensant d'abord aux acides gras saturés et aux fibres.
Tiens compte de ce qui restait dans les Objectifs du jour avant ce repas (une valeur négative signifie que l'Objectif était déjà dépassé), et conseille la suite de la journée.
Les Règles du médecin fournies priment sur tes repères généraux : signale explicitement tout aliment du repas qu'elles demandent d'éviter.
Réponds uniquement avec le JSON demandé.`;

const SCHEMA_ESTIMATION = {
  type: "object",
  properties: {
    objectifs: {
      type: "object",
      properties: Object.fromEntries(
        NUTRIMENTS.map((n) => [
          n,
          {
            type: "object",
            properties: { valeur: { type: "number", exclusiveMinimum: 0 }, justification: { type: "string" } },
            required: ["valeur", "justification"],
          },
        ]),
      ),
      required: [...NUTRIMENTS],
    },
  },
  required: ["objectifs"],
};

const CONSIGNES_ESTIMATION = `Tu es nutritionniste. Tu fixes les Objectifs journaliers d'une personne atteinte d'hypercholestérolémie génétique, qui mange souvent de la cuisine africaine.
Pour chaque nutriment, donne une valeur et une justification courte (une phrase) :
- calories (kcal) ; protéines, glucides, sucres, lipides, acides gras saturés (ags), fibres et sel, en grammes par jour.
- Sucres, AGS et sel sont des plafonds à ne pas dépasser ; protéines et fibres des cibles à atteindre ; calories, glucides et lipides des valeurs autour desquelles rester à ±10 %.
Pars de la formule de référence fournie (Mifflin-St Jeor × activité) pour les calories, puis ajuste-la selon l'Objectif de poids et les Objectifs personnels. Si tu t'en écartes de plus de 20 %, explique pourquoi.
Les Règles du médecin priment sur tes repères généraux.
Réponds uniquement avec le JSON demandé.`;

function decrireDemandeEstimation(demande: DemandeEstimationObjectifs): string {
  const { profil, poidsKg, age, objectifsPersonnels, objectifDePoids, caloriesGardeFou, reglesDuMedecin } = demande;
  return [
    `Profil : ${profil.sexe}, ${age} ans, ${profil.taille_cm} cm, ${poidsKg} kg, ${libelleDuNiveauDActivite(profil.niveau_activite)}.`,
    `Formule de référence : ${caloriesGardeFou} kcal par jour.`,
    `Objectif de poids : ${
      objectifDePoids ? `${objectifDePoids.variationKg > 0 ? "+" : ""}${objectifDePoids.variationKg} kg d'ici le ${objectifDePoids.echeance}` : "aucun"
    }.`,
    `Objectifs personnels : ${objectifsPersonnels || "aucun"}`,
    `Règles du médecin (elles priment) :\n${decrireRegles(reglesDuMedecin)}`,
  ].join("\n");
}

/** Les octets en base64, par morceaux pour ne pas dépasser la pile avec une photo de plusieurs centaines de Ko. */
function enBase64(octets: Uint8Array): string {
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

/** Appelle Gemini avec une sortie JSON à schéma imposé et renvoie le JSON brut (à valider par le noyau). */
async function appelerGemini(
  cle: string,
  modele: string,
  consignes: string,
  demande: string,
  schema: unknown,
  photo: PhotoDuRepas | null = null,
) {
  const parties: unknown[] = [{ text: demande }];
  if (photo) parties.push({ inlineData: { mimeType: photo.typeMime, data: enBase64(photo.octets) } });
  const reponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": cle },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: consignes }] },
      contents: [{ role: "user", parts: parties }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema },
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
  return JSON.parse(texte) as unknown;
}

function iaGemini(cle: string, modele: string): IA {
  return {
    async analyserRepas({ description, photo, precision, constituantsActuels, typeDeRepas, objectifsRestants, reglesDuMedecin }) {
      const demande = [
        `Type de repas : ${libelleDuTypeDeRepas(typeDeRepas)}`,
        photo ? `Photo du repas jointe. Note : ${description || "aucune"}` : `Description : ${description}`,
        ...(constituantsActuels.length > 0
          ? [`Constituants actuels, à corriger selon la précision :\n${JSON.stringify(constituantsActuels)}`]
          : []),
        ...(precision ? [`Précision de l'utilisateur (elle corrige la description) : ${precision}`] : []),
        `Objectifs restants avant ce repas :\n${decrireObjectifsRestants(objectifsRestants)}`,
        `Règles du médecin (elles priment) :\n${decrireRegles(reglesDuMedecin)}`,
      ].join("\n");
      return lireAnalyseRepas(await appelerGemini(cle, modele, CONSIGNES_ANALYSE, demande, SCHEMA_ANALYSE, photo));
    },

    async estimerObjectifs(demande) {
      const brut = await appelerGemini(cle, modele, CONSIGNES_ESTIMATION, decrireDemandeEstimation(demande), SCHEMA_ESTIMATION);
      return lireEstimationObjectifs(brut);
    },
  };
}
