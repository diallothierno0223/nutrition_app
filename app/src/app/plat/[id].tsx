import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { Bouton } from "@/components/bouton";
import { CarteConstituant } from "@/components/carte-constituant";
import { Champ } from "@/components/champ";
import { Ecran } from "@/components/ecran";
import { Puces } from "@/components/puces";
import { ThemedText } from "@/components/themed-text";
import { ValeursNutritionnelles } from "@/components/valeurs-nutritionnelles";
import { Spacing } from "@/constants/theme";
import {
  chargerPlat,
  corrigerConstituantDePlat,
  libelleDuCoefficient,
  renommerPlat,
  reutiliserPlat,
  supprimerConstituantDePlat,
  supprimerPlat,
  type PlatDetaille,
} from "@/donnees/plats";
import { useEnvoi } from "@/hooks/use-envoi";
import { rafraichirNotifications } from "@/notifications/programmation";
import { appliquerCoefficient, totauxDuRepas } from "@noyau";

const COEFFICIENTS = ["0.5", "1", "1.5", "2"] as const;
type CoefficientPropose = (typeof COEFFICIENTS)[number];

export default function DetailPlat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plat, setPlat] = useState<PlatDetaille | null | undefined>(undefined);
  const [coefficient, setCoefficient] = useState<CoefficientPropose>("1");
  const [precision, setPrecision] = useState("");
  const [nom, setNom] = useState<string | null>(null);
  const reutilisation = useEnvoi("Le Repas n'a pas pu être enregistré. Vérifie ta connexion.");
  const gestion = useEnvoi();

  const charger = useCallback(() => chargerPlat(id).then(setPlat, () => setPlat((actuel) => actuel ?? null)), [id]);
  useEffect(() => {
    charger();
  }, [charger]);

  if (plat === undefined) return <Ecran />;
  if (plat === null) {
    return (
      <Ecran>
        <ThemedText>Ce Plat est introuvable.</ThemedText>
      </Ecran>
    );
  }
  const courant = plat;

  async function enregistrerLeRepas() {
    let repasId = "";
    if (await reutilisation.envoyer(async () => (repasId = await reutiliserPlat(courant, Number(coefficient), precision)))) {
      rafraichirNotifications();
      router.replace({ pathname: "/repas/[id]", params: { id: repasId } });
    }
  }

  async function renommer() {
    const choisi = nom?.trim();
    if (choisi && (await gestion.envoyer(() => renommerPlat(courant.id, choisi)))) {
      setNom(null);
      charger();
    }
  }

  function confirmerSuppression() {
    Alert.alert("Supprimer ce Plat ?", "Les Repas déjà enregistrés à partir de ce Plat ne changent pas.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          if (await gestion.envoyer(() => supprimerPlat(courant.id))) router.back();
        },
      },
    ]);
  }

  const portion = totauxDuRepas(appliquerCoefficient(plat.constituants, Number(coefficient)));

  return (
    <Ecran>
      <Stack.Screen options={{ title: plat.nom }} />

      <ThemedText type="smallBold">Coefficient de portion</ThemedText>
      <Puces
        options={COEFFICIENTS}
        valeur={coefficient}
        libelle={(c) => libelleDuCoefficient(Number(c))}
        onChange={setCoefficient}
      />
      <ValeursNutritionnelles valeurs={portion} />
      <Champ
        multiline
        placeholder="Précision facultative (ex. : j'ai ajouté une cuillère d'huile) : l'IA réajuste alors ce Repas"
        value={precision}
        onChangeText={setPrecision}
      />
      {reutilisation.erreur && <ThemedText themeColor="textSecondary">{reutilisation.erreur}</ThemedText>}
      <Bouton libelle="Enregistrer ce Repas" onPress={enregistrerLeRepas} enCours={reutilisation.envoi} />

      <ThemedText type="smallBold">Constituants pour une portion</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Modifier le Plat ne change pas les Repas déjà enregistrés.
      </ThemedText>
      {plat.constituants.map((c) => (
        <CarteConstituant
          key={c.id}
          constituant={c}
          corriger={(corrige) => corrigerConstituantDePlat(c.id, corrige)}
          supprimer={() => supprimerConstituantDePlat(c.id)}
          onChange={charger}
        />
      ))}

      {nom === null ? (
        <View style={styles.actions}>
          <Bouton libelle="Renommer" variante="secondaire" onPress={() => setNom(courant.nom)} />
          <Bouton libelle="Supprimer le Plat" variante="secondaire" onPress={confirmerSuppression} />
        </View>
      ) : (
        <>
          <Champ placeholder="Nom du Plat" value={nom} onChangeText={setNom} />
          <View style={styles.actions}>
            <Bouton libelle="Enregistrer" variante="secondaire" onPress={renommer} desactive={!nom.trim()} enCours={gestion.envoi} />
            <Bouton libelle="Annuler" variante="secondaire" onPress={() => setNom(null)} />
          </View>
        </>
      )}
      {gestion.erreur && <ThemedText themeColor="textSecondary">{gestion.erreur}</ThemedText>}
    </Ecran>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
});
