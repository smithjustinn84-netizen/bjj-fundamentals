import { describe, expect, it } from 'vitest';
import { beltRank, MAX_STRIPES } from './rank';

describe('beltRank', () => {
  it('starts as a plain white belt', () => {
    expect(beltRank(0)).toEqual({ belt: 'white', stripes: 0, nextBelt: 'blue', percentToNextBelt: 25 });
  });

  it('adds a stripe every 5 points and never more than the maximum', () => {
    expect(beltRank(4).stripes).toBe(0);
    expect(beltRank(5).stripes).toBe(1);
    expect(beltRank(24)).toEqual({ belt: 'white', stripes: MAX_STRIPES, nextBelt: 'blue', percentToNextBelt: 1 });
  });

  it('moves up a belt every 25 points', () => {
    expect(beltRank(25)).toMatchObject({ belt: 'blue', stripes: 0 });
    expect(beltRank(50).belt).toBe('purple');
    expect(beltRank(75).belt).toBe('brown');
    expect(beltRank(99)).toMatchObject({ belt: 'brown', stripes: MAX_STRIPES, nextBelt: 'black' });
  });

  it('gives the black belt only when everything is learned', () => {
    expect(beltRank(100)).toEqual({ belt: 'black', stripes: 0, nextBelt: null, percentToNextBelt: 0 });
  });

  it('clamps out-of-range input', () => {
    expect(beltRank(-10).belt).toBe('white');
    expect(beltRank(250).belt).toBe('black');
  });
});
