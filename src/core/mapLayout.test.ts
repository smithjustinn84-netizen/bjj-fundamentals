import { describe, expect, it } from 'vitest';
import { layoutPositionMap, type MapNode } from './mapLayout';
import { MAP_ORIENTATIONS } from './models';
import { position, transition } from './testing/testFixtures';

const positions = [
  position({ id: 'stand', category: 'standing' }),
  position({ id: 'closed', category: 'guard' }),
  position({ id: 'half', category: 'guard' }),
  position({ id: 'mount', category: 'top' }),
  position({ id: 'back', category: 'back' }),
];

function overlaps(a: MapNode, b: MapNode): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

describe('layoutPositionMap', () => {
  it.each(MAP_ORIENTATIONS)('gives every position its own slot inside the map (%s)', (orientation) => {
    const { nodes, width, height } = layoutPositionMap(positions, [], orientation);
    expect(nodes.map((n) => n.id).sort()).toEqual(positions.map((p) => p.id).sort());
    for (const node of nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.x + node.width).toBeLessThanOrEqual(width);
      expect(node.y + node.height).toBeLessThanOrEqual(height);
      for (const other of nodes) if (other !== node) expect(overlaps(node, other)).toBe(false);
    }
  });

  it('orders lanes from standing to the back, whatever order positions arrive in', () => {
    const { lanes, nodes } = layoutPositionMap([...positions].reverse(), [], 'horizontal');
    expect(lanes.map((l) => l.category)).toEqual(['standing', 'guard', 'top', 'back']);
    const x = (id: string) => nodes.find((n) => n.id === id)?.x ?? Number.NaN;
    expect(x('stand')).toBeLessThan(x('closed'));
    expect(x('closed')).toBe(x('half'));
    expect(x('half')).toBeLessThan(x('mount'));
    expect(x('mount')).toBeLessThan(x('back'));
  });

  it('runs lanes down the page when vertical', () => {
    const { nodes } = layoutPositionMap(positions, [], 'vertical');
    const y = (id: string) => nodes.find((n) => n.id === id)?.y ?? Number.NaN;
    expect(y('stand')).toBeLessThan(y('closed'));
    expect(y('closed')).toBe(y('half'));
    expect(y('half')).toBeLessThan(y('mount'));
  });

  it('gives parallel techniques and return trips their own curves', () => {
    const { edges } = layoutPositionMap(
      positions,
      [
        transition({ id: 'a', fromId: 'closed', toId: 'mount' }),
        transition({ id: 'b', fromId: 'closed', toId: 'mount' }),
        transition({ id: 'c', fromId: 'mount', toId: 'closed', type: 'escape' }),
        transition({ id: 'd', fromId: 'mount', toId: 'closed', type: 'escape' }),
      ],
      'horizontal',
    );
    expect(edges.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd']);
    const [a, b] = edges;
    expect(a?.bow).not.toBe(b?.bow);
    expect(new Set(edges.map((e) => e.path)).size).toBe(4);
    // A return trip bowing right by the same amount would retrace the outward arrow's curve.
    const curves = edges.map((e) => (e.fromId === 'closed' ? e.bow : -e.bow));
    expect(new Set(curves).size).toBe(4);
  });

  it.each(MAP_ORIENTATIONS)('steers arrows around positions that lie in between (%s)', (orientation) => {
    const inLine = [
      position({ id: 'a', category: 'standing' }),
      position({ id: 'b', category: 'guard' }),
      position({ id: 'c', category: 'top' }),
    ];
    const { nodes, edges } = layoutPositionMap(
      inLine,
      [transition({ id: 'skip', fromId: 'a', toId: 'c' })],
      orientation,
    );
    const blocker = nodes.find((n) => n.id === 'b');
    const [x0, y0, cx, cy, x1, y1] = (edges[0]?.path.match(/-?[\d.]+/g) ?? []).map(Number);
    if (!blocker || [x0, y0, cx, cy, x1, y1].some((n) => n === undefined)) throw new Error('layout is missing parts');
    for (let step = 0; step <= 50; step++) {
      const t = step / 50;
      const x = (1 - t) ** 2 * (x0 ?? 0) + 2 * (1 - t) * t * (cx ?? 0) + t ** 2 * (x1 ?? 0);
      const y = (1 - t) ** 2 * (y0 ?? 0) + 2 * (1 - t) * t * (cy ?? 0) + t ** 2 * (y1 ?? 0);
      const inside = x > blocker.x && x < blocker.x + blocker.width && y > blocker.y && y < blocker.y + blocker.height;
      expect(inside).toBe(false);
    }
  });

  it('counts submissions on their starting position instead of drawing them', () => {
    const { nodes, edges } = layoutPositionMap(
      positions,
      [
        transition({ id: 's1', type: 'submission', fromId: 'mount', toId: '' }),
        transition({ id: 's2', type: 'submission', fromId: 'mount', toId: '' }),
        transition({ id: 's3', type: 'submission', fromId: 'back', toId: '' }),
      ],
      'horizontal',
    );
    expect(edges).toEqual([]);
    expect(nodes.find((n) => n.id === 'mount')?.submissions).toBe(2);
    expect(nodes.find((n) => n.id === 'back')?.submissions).toBe(1);
    expect(nodes.find((n) => n.id === 'stand')?.submissions).toBe(0);
  });

  it('skips techniques with a missing end and techniques that stay in the same position', () => {
    const { edges } = layoutPositionMap(
      positions,
      [
        transition({ id: 'no-from', fromId: 'gone', toId: 'mount' }),
        transition({ id: 'no-to', fromId: 'mount', toId: 'gone' }),
        transition({ id: 'loop', fromId: 'mount', toId: 'mount' }),
        transition({ id: 'ok', fromId: 'stand', toId: 'closed', type: 'takedown' }),
      ],
      'horizontal',
    );
    expect(edges.map((e) => e.id)).toEqual(['ok']);
    expect(edges[0]?.path).toMatch(/^M[\d.-]+ [\d.-]+Q[\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+$/);
  });

  it('is deterministic and copes with an empty library', () => {
    const transitions = [transition({ id: 'a', fromId: 'stand', toId: 'closed' })];
    expect(layoutPositionMap(positions, transitions, 'vertical')).toEqual(
      layoutPositionMap(positions, transitions, 'vertical'),
    );
    expect(layoutPositionMap([], transitions, 'horizontal')).toMatchObject({ lanes: [], nodes: [], edges: [] });
  });
});
