/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import { Platform } from 'react-native';

/**
 * Palette de l'app (ticket 21) : couleur principale terracotta, fond chaud, déclinée en clair et en sombre.
 * Le texte garde un contraste d'au moins 4,5:1 sur les fonds où il est posé (couleurs de jauge comprises, y compris
 * sur leurs fonds « doux »). En sombre, le texte posé sur la couleur principale est foncé : le blanc n'y atteint pas 4,5:1.
 * - text / textSecondary : texte courant et secondaire.
 * - background : fond des écrans ; carte : fond des sections ; backgroundElement : lignes et éléments posés dans
 *   une carte ; backgroundSelected : fond doux de l'élément actif (onglet, résumé du jour).
 * - bordure : contour des champs et des puces non choisies.
 * - accent / surAccent : couleur principale et texte posé dessus (bouton principal, puce choisie).
 * - piste : fond d'une jauge ; desactiveFond / desactiveTexte : bouton désactivé, toujours lisible.
 */
export const Colors = {
  light: {
    text: '#1F1A17',
    textSecondary: '#6B625C',
    background: '#FAF7F4',
    carte: '#FFFFFF',
    backgroundElement: '#F3EDE8',
    backgroundSelected: '#F6E3DA',
    bordure: '#DCD2CA',
    accent: '#A84A29',
    surAccent: '#FFFFFF',
    piste: '#ECE5DF',
    desactiveFond: '#E4DDD7',
    desactiveTexte: '#5E5650',
  },
  dark: {
    text: '#F4EEE9',
    textSecondary: '#B5AAA2',
    background: '#141110',
    carte: '#1F1B19',
    backgroundElement: '#2A2522',
    backgroundSelected: '#3A2419',
    bordure: '#3E3632',
    accent: '#E2805A',
    surAccent: '#1B0E08',
    piste: '#332D2A',
    desactiveFond: '#2E2926',
    desactiveTexte: '#A39890',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * Couleurs des jauges selon leur état : vert dans l'objectif, orange près du plafond, rouge dépassé, gris-bleu en
 * dessous d'une Plage. `doux` : fond des pastilles d'alerte du résumé du jour.
 */
export const CouleursJauge = {
  light: {
    normal: '#1E6E44',
    approche: '#9A5A0A',
    depasse: '#B02E24',
    en_dessous: '#5A6880',
    sans_objectif: '#6B625C',
    approcheDoux: '#FBEBD3',
    depasseDoux: '#F8DEDB',
  },
  dark: {
    normal: '#4CC384',
    approche: '#F0A63E',
    depasse: '#F0675B',
    en_dessous: '#93A3BA',
    sans_objectif: '#A39890',
    approcheDoux: '#3A2A12',
    depasseDoux: '#3B1D1A',
  },
} as const;

export const Rayons = { petit: 12, moyen: 14, carte: 20, puce: 999 } as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
