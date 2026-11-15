import { useEffect } from 'react';
import { useThemeChoice } from '../bindings';
import { resolveTheme } from '../core/theme';
import { useMediaQuery } from './useMediaQuery';

const DEVICE_IS_DARK = '(prefers-color-scheme: dark)';

/**
 * Keep the page in the theme the user chose. The styles read `data-theme` on the root element; the script in
 * index.html sets it from the device before the first paint, and this takes over once the stored choice is read.
 */
export function useAppliedTheme(): void {
  const choice = useThemeChoice();
  const deviceIsDark = useMediaQuery(DEVICE_IS_DARK);

  useEffect(() => {
    // Still reading the stored choice: leave what index.html set.
    if (choice === undefined) return;
    const root = document.documentElement;
    root.dataset.theme = resolveTheme(choice, deviceIsDark);
    // The browser's own bars take the colour of the app's bars, which are drawn on the surface colour.
    const barColour = getComputedStyle(root).getPropertyValue('--surface').trim();
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = barColour;
    }
  }, [choice, deviceIsDark]);
}
