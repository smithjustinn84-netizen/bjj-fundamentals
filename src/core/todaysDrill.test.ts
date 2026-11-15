import { describe, expect, it } from 'vitest';
import { buildLibrary } from './library';
import type { ReviewState } from './models';
import { concept, position, review, trainingEntry, transition } from './testing/testFixtures';
import { pickDrill, positionProgress } from './todaysDrill';

const positions = [position({ id: 'mount', category: 'top', order: 1 }), position({ id: 'guard', order: 2 })];
const techniques = [
  transition({ id: 'upa', name: 'A', type: 'escape', fromId: 'mount', role: 'bottom', drill: 'Bridge ten times' }),
  transition({ id: 'shrimp', name: 'B', type: 'escape', fromId: 'mount', role: 'bottom', drill: 'Shrimp the mat' }),
  transition({ id: 'sweep', name: 'C', type: 'sweep', fromId: 'guard', role: 'bottom', drill: 'Ten sweeps' }),
  transition({ id: 'pass', name: 'D', type: 'pass', fromId: 'guard', role: 'top', drill: '' }),
];
const library = (reviews: ReviewState[] = []) => buildLibrary([], positions, techniques, reviews);
const learned = (id: string) => review('transition', id, { intervalDays: 8 });

describe('pickDrill', () => {
  it('starts with a way out of where the student last got stuck, skipping what is already learned', () => {
    const entries = [trainingEntry({ stuckIds: ['mount:bottom'], techniqueIds: ['sweep'] })];
    expect(pickDrill(library(), entries)).toMatchObject({ reason: 'stuck', drill: 'Bridge ten times' });
    expect(pickDrill(library([learned('upa')]), entries)).toMatchObject({ reason: 'stuck', drill: 'Shrimp the mat' });
  });

  it('then takes a technique that keeps slipping, then one practised in class, then the next unlearned one', () => {
    const slipping = review('transition', 'sweep', { lapses: 2, intervalDays: 0 });
    expect(pickDrill(library([slipping]), [])?.reason).toBe('slipping');
    expect(pickDrill(library(), [trainingEntry({ techniqueIds: ['shrimp'] })])).toMatchObject({
      reason: 'practised',
      drill: 'Shrimp the mat',
    });
    expect(pickDrill(library(), [])).toMatchObject({ reason: 'next', drill: 'Bridge ten times' });
  });

  it('picks the next unlearned technique in lesson order: an escape from a pin before an attack', () => {
    const guardFirst = [position({ id: 'guard', order: 1 }), position({ id: 'mount', category: 'top', order: 2 })];
    expect(pickDrill(buildLibrary([], guardFirst, techniques, []), [])).toMatchObject({
      reason: 'next',
      drill: 'Bridge ten times',
    });
  });

  it('finds a slipping technique behind any number of other slipping cards', () => {
    const concepts = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => review('concept', id, { lapses: 5, intervalDays: 0 }));
    const lib = buildLibrary(
      concepts.map((card) => concept({ id: card.itemId })),
      positions,
      techniques,
      [...concepts, review('transition', 'sweep', { lapses: 2, intervalDays: 0 })],
    );
    expect(pickDrill(lib, [])).toMatchObject({ reason: 'slipping', drill: 'Ten sweeps' });
  });

  it('ignores where the student got stuck once that class is no longer recent', () => {
    const entries = [
      trainingEntry({ id: 'old', day: '2026-10-01', stuckIds: ['guard:bottom'] }),
      ...['2026-11-01', '2026-11-02', '2026-11-03'].map((day) => trainingEntry({ id: day, day })),
    ];
    expect(pickDrill(library(), entries)?.reason).toBe('next');
  });

  it('passes over techniques with no drill and finds nothing once every drill is learned', () => {
    const entries = [trainingEntry({ techniqueIds: ['pass'] })];
    expect(pickDrill(library(), entries)?.reason).toBe('next');
    expect(pickDrill(library([learned('upa'), learned('shrimp'), learned('sweep')]), entries)).toBeNull();
  });
});

describe('positionProgress', () => {
  it('counts the learned techniques among those that start at a position', () => {
    const lib = library([learned('upa'), review('transition', 'shrimp', { intervalDays: 1 }), learned('sweep')]);
    expect(positionProgress(lib, 'mount')).toEqual({ total: 2, learned: 1 });
    expect(positionProgress(lib, 'nowhere')).toEqual({ total: 0, learned: 0 });
  });
});
