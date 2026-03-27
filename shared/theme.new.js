import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Kiana: Herrscher of Finality Light Theme
export const light = {
  ...MD3LightTheme,
  roundness: 8, // Sleek but slightly rounded like her armor
  colors: {
    ...MD3LightTheme.colors,
    primary: 'rgb(103, 80, 164)',          // Radiant Lavender
    onPrimary: 'rgb(255, 255, 255)',
    primaryContainer: 'rgb(235, 221, 255)', 
    onPrimaryContainer: 'rgb(45, 0, 86)',

    secondary: 'rgb(98, 91, 107)',         // Silvery-Grey
    onSecondary: 'rgb(255, 255, 255)',
    secondaryContainer: 'rgb(232, 222, 243)',
    onSecondaryContainer: 'rgb(30, 25, 38)',

    tertiary: 'rgb(187, 33, 134)',          // Wing-tip Magenta
    onTertiary: 'rgb(255, 255, 255)',
    tertiaryContainer: 'rgb(255, 216, 233)',
    onTertiaryContainer: 'rgb(62, 0, 41)',

    background: 'rgb(254, 247, 255)',       // Pure "Saintly" White
    surface: 'rgb(254, 247, 255)',
    outline: 'rgb(124, 117, 129)',
  },
};

// Kiana: Herrscher of Finality Dark Theme
export const dark = {
  ...MD3DarkTheme,
  roundness: 8,
  colors: {
    ...MD3DarkTheme.colors,
    primary: 'rgb(211, 184, 255)',          // Glowing Lavender
    onPrimary: 'rgb(75, 0, 155)',
    primaryContainer: 'rgb(108, 38, 196)',
    onPrimaryContainer: 'rgb(235, 221, 255)',

    secondary: 'rgb(204, 194, 215)',        // Metallic Silver
    onSecondary: 'rgb(51, 44, 58)',
    secondaryContainer: 'rgb(74, 67, 82)',
    onSecondaryContainer: 'rgb(232, 222, 243)',

    tertiary: 'rgb(255, 178, 211)',         // Magenta Glow
    onTertiary: 'rgb(94, 0, 64)',
    tertiaryContainer: 'rgb(134, 0, 92)',
    onTertiaryContainer: 'rgb(255, 216, 233)',

    background: 'rgb(28, 27, 31)',          // Deep Space Purple/Black
    surface: 'rgb(35, 30, 41)',             // Elevated Surface with purple tint
    onSurface: 'rgb(230, 225, 233)',
    outline: 'rgb(150, 142, 154)',
  },
};