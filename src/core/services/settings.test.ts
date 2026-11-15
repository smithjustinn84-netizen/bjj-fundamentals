import { describe, expect, it } from 'vitest';
import { validateBackup } from '../backup';
import { testCore } from '../testing/testCore';

describe('the theme setting', () => {
  it('follows the device until one is chosen, then remembers the latest choice', async () => {
    const { core } = testCore();
    expect(await core.queries.themeChoice()).toBe('device');
    await core.settings.setTheme('dark');
    await core.settings.setTheme('light');
    expect(await core.queries.themeChoice()).toBe('light');
  });

  it('travels in a backup and goes back to the default when everything is erased', async () => {
    const { core } = testCore();
    await core.settings.setTheme('dark');
    const backup = validateBackup(JSON.parse(JSON.stringify(await core.backups.exportBackup())));
    await core.backups.eraseAll();
    expect(await core.queries.themeChoice()).toBe('device');
    await core.backups.importBackup(backup);
    expect(await core.queries.themeChoice()).toBe('dark');
  });
});
