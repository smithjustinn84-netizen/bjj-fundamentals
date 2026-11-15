import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_CHOICE, resolveTheme, themeChoice } from './theme';

describe('themeChoice', () => {
  it('is the default until one is stored', () => {
    expect(themeChoice([])).toBe(DEFAULT_THEME_CHOICE);
  });

  it('reads the stored choice', () => {
    expect(themeChoice([{ id: 'theme', value: 'dark', updatedAt: 1 }])).toBe('dark');
  });

  it('reads a value it does not know as the default', () => {
    expect(themeChoice([{ id: 'theme', value: 'sepia', updatedAt: 1 }])).toBe(DEFAULT_THEME_CHOICE);
  });
});

describe('resolveTheme', () => {
  it('follows the device only when asked to', () => {
    expect(resolveTheme('device', true)).toBe('dark');
    expect(resolveTheme('device', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
