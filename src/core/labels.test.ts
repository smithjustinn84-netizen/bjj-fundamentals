import { describe, expect, it } from 'vitest';
import { plural } from './labels';

describe('plural', () => {
  it('adds an "s" for anything but one', () => {
    expect(plural(0, 'card')).toBe('0 cards');
    expect(plural(1, 'card')).toBe('1 card');
    expect(plural(2, 'day')).toBe('2 days');
  });
});
