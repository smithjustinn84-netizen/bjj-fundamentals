import { describe, expect, it } from 'vitest';
import { roundSvg } from './svgNumber';

describe('roundSvg', () => {
  it('keeps one decimal place', () => {
    expect(roundSvg(12.345)).toBe(12.3);
    expect(roundSvg(-0.06)).toBe(-0.1);
    expect(roundSvg(7)).toBe(7);
  });
});
