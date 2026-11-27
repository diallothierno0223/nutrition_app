import { Switch, type SwitchProps } from "react-native";

import { useTheme } from "@/hooks/use-theme";

/**
 * L'interrupteur de l'app : piste de la couleur principale quand il est actif ; éteint, une piste assez contrastée et
 * un curseur clair pour rester visible sur une carte, en clair comme en sombre.
 */
export function Interrupteur(props: SwitchProps) {
  const theme = useTheme();
  return (
    <Switch
      trackColor={{ true: theme.accent, false: theme.textSecondary }}
      thumbColor={props.value ? theme.surAccent : theme.text}
      {...props}
    />
  );
}
