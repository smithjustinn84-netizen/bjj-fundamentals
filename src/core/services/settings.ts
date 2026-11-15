import type { CoreEnv } from '../core';
import type { ThemeChoice } from '../models';

export function createSettingsService({ storage, now }: CoreEnv) {
  return {
    setTheme: (choice: ThemeChoice) => storage.settings.put({ id: 'theme', value: choice, updatedAt: now() }),
  };
}
