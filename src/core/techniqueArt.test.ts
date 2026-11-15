import { describe, expect, it } from 'vitest';
import { starterContent } from './seed';
import { reversesRoles } from './techniqueArt';

describe('reversesRoles', () => {
  it('is true for every sweep', () => {
    expect(reversesRoles({ id: 'my-own-sweep', type: 'sweep' })).toBe(true);
  });

  it('is false for techniques that keep the same person on top', () => {
    expect(reversesRoles({ id: 'my-own-pass', type: 'pass' })).toBe(false);
    expect(reversesRoles({ id: 'my-own-escape', type: 'escape' })).toBe(false);
  });

  it('is true for the built-in escapes that come up on top', () => {
    const reversing = starterContent(0)
      .transitions.filter((t) => t.type !== 'sweep' && reversesRoles(t))
      .map((t) => t.name);
    expect(reversing).toEqual(['Bridge and roll (upa) escape', 'Back escape']);
  });
});
