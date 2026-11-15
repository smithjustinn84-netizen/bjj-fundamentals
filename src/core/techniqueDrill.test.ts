import { describe, expect, it } from 'vitest';
import { starterContent } from './seed';
import { techniqueDrill } from './techniqueDrill';
import { transition } from './testing/testFixtures';

describe('techniqueDrill', () => {
  it('uses the stored drill, including one the user cleared', () => {
    expect(techniqueDrill(transition({ id: 'scissor-sweep', drill: 'My own drill' }))).toBe('My own drill');
    expect(techniqueDrill(transition({ id: 'scissor-sweep', drill: '' }))).toBe('');
  });

  it('gives a starter technique stored without a drill the starter one, and any other technique none', () => {
    expect(techniqueDrill(transition({ id: 'scissor-sweep' }))).toMatch(/10 reps/);
    expect(techniqueDrill(transition({ id: 'my-own-move' }))).toBe('');
  });

  it('has a drill for every starter technique', () => {
    const missing = starterContent(0).transitions.filter((t) => !t.drill);
    expect(missing.map((t) => t.id)).toEqual([]);
  });
});
