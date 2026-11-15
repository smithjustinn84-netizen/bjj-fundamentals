import { type Setting, THEME_CHOICES, type Theme, type ThemeChoice } from './models';

/** What a library that has never chosen gets. */
export const DEFAULT_THEME_CHOICE: ThemeChoice = 'device';

function isThemeChoice(value: string): value is ThemeChoice {
  return THEME_CHOICES.some((choice) => choice === value);
}

/** The stored theme choice. A missing row, or a value this version does not know, reads as the default. */
export function themeChoice(settings: Setting[]): ThemeChoice {
  const stored = settings.find((setting) => setting.id === 'theme')?.value;
  return stored !== undefined && isThemeChoice(stored) ? stored : DEFAULT_THEME_CHOICE;
}

/** The theme to draw: the choice itself, or the device's when the choice is to follow it. */
export function resolveTheme(choice: ThemeChoice, deviceIsDark: boolean): Theme {
  if (choice === 'device') return deviceIsDark ? 'dark' : 'light';
  return choice;
}
