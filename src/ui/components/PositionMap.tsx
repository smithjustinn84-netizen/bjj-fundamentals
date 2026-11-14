import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_LABELS, TRANSITION_LABELS } from '../../core/labels';
import type { Library } from '../../core/library';
import { layoutPositionMap, type MapNode } from '../../core/mapLayout';
import { type MapOrientation, type Position, TRANSITION_TYPES, type TransitionType } from '../../core/models';
import { cardId } from '../../core/srs';
import { itemPath } from '../routes';
import { ProgressDot } from './common';
import { TransitionLink } from './TransitionLink';

/** Submissions are counted on the position instead of drawn, so they get no arrowhead and no line in the legend. */
const ARROW_TYPES = TRANSITION_TYPES.filter((type) => type !== 'submission');
const markerId = (type: TransitionType) => `map-arrow-${type}`;

function MapNodeButton({
  node,
  position,
  lib,
  selected,
  dimmed,
  onToggle,
  onPeek,
}: {
  node: MapNode;
  position: Position;
  lib: Library;
  selected: boolean;
  dimmed: boolean;
  onToggle: () => void;
  /** Called with true while the pointer or keyboard focus is on the node. */
  onPeek: (active: boolean) => void;
}) {
  return (
    <foreignObject x={node.x} y={node.y} width={node.width} height={node.height}>
      <button
        type="button"
        className={`map-node${dimmed ? ' is-dim' : ''}`}
        aria-pressed={selected}
        onClick={onToggle}
        onMouseEnter={() => onPeek(true)}
        onMouseLeave={() => onPeek(false)}
        onFocus={() => onPeek(true)}
        onBlur={() => onPeek(false)}
      >
        <span className="map-node-name">
          <ProgressDot state={lib.reviews.get(cardId('position', position.id))} />
          <span>{position.name}</span>
        </span>
        {node.submissions > 0 && (
          <span className="map-node-subs">
            {node.submissions} submission{node.submissions === 1 ? '' : 's'}
          </span>
        )}
      </button>
    </foreignObject>
  );
}

function SelectedPosition({ position, lib }: { position: Position; lib: Library }) {
  const outgoing = lib.transitions.filter((t) => t.fromId === position.id);
  const incoming = lib.transitions.filter((t) => t.toId === position.id && t.fromId !== position.id);
  return (
    // Keyed by the caller, so choosing another position replays the entrance.
    <div className="map-panel-body">
      <p className="eyebrow">{CATEGORY_LABELS[position.category]}</p>
      <h2>
        <Link to={itemPath('position', position.id)}>{position.name}</Link>
      </h2>
      <p className="muted small">{position.summary}</p>
      <h3>From here</h3>
      {outgoing.length > 0 ? (
        <ul className="transition-list">
          {outgoing.map((t) => (
            <TransitionLink key={t.id} transition={t} positionById={lib.positionById} direction="out" />
          ))}
        </ul>
      ) : (
        <p className="muted small">No techniques from here yet.</p>
      )}
      {incoming.length > 0 && (
        <>
          <h3>Ways to get here</h3>
          <ul className="transition-list">
            {incoming.map((t) => (
              <TransitionLink key={t.id} transition={t} positionById={lib.positionById} direction="in" />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * The positions as a graph: boxes in lanes by category, joined by an arrow per technique.
 * Pointing at or focusing a position highlights its arrows; selecting it lists its techniques alongside.
 * All geometry comes from `layoutPositionMap`; this component only draws it.
 */
export function PositionMap({ lib, orientation }: { lib: Library; orientation: MapOrientation }) {
  const layout = useMemo(
    () => layoutPositionMap(lib.positions, lib.transitions, orientation),
    [lib.positions, lib.transitions, orientation],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [peekId, setPeekId] = useState<string | null>(null);

  const selected = selectedId ? lib.positionById.get(selectedId) : undefined;
  // What the arrows respond to: the position under the pointer or focus, else the selected one.
  const activeId = peekId ?? selected?.id ?? null;
  const touchesActive = (edge: { fromId: string; toId: string }) => edge.fromId === activeId || edge.toId === activeId;
  const neighbours = new Set(layout.edges.filter(touchesActive).flatMap((edge) => [edge.fromId, edge.toId]));
  const horizontal = orientation === 'horizontal';

  return (
    <div className={`map map-${orientation}`}>
      <div className="card map-canvas">
        {/* biome-ignore lint/a11y/useSemanticElements: the map holds buttons, so it is a labelled group rather than an image, and a fieldset cannot be an SVG root */}
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="group"
          aria-label="Position map. Select a position to list its techniques."
        >
          <defs>
            {ARROW_TYPES.map((type) => (
              <marker
                key={type}
                id={markerId(type)}
                className={`map-arrowhead type-${type}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0 0 10 5 0 10z" />
              </marker>
            ))}
          </defs>
          <g>
            {layout.edges.map((edge) => {
              const state = activeId === null ? '' : touchesActive(edge) ? ' is-active' : ' is-dim';
              return (
                <path
                  key={edge.id}
                  className={`map-edge type-${edge.type}${state}`}
                  d={edge.path}
                  // Normalised length lets one dash animation draw every arrow in, whatever its real length.
                  pathLength={1}
                  markerEnd={`url(#${markerId(edge.type)})`}
                />
              );
            })}
            {/* A second, dashed stroke runs along the highlighted arrows to show which way they flow. */}
            {layout.edges.filter(touchesActive).map((edge) => (
              <path key={edge.id} className="map-edge-flow" d={edge.path} />
            ))}
          </g>
          {layout.lanes.map((lane) => (
            <text
              key={lane.category}
              className="map-lane"
              x={lane.labelX}
              y={lane.labelY}
              textAnchor={horizontal ? 'middle' : 'start'}
              dominantBaseline="hanging"
            >
              {CATEGORY_LABELS[lane.category]}
            </text>
          ))}
          {layout.nodes.map((node) => {
            const position = lib.positionById.get(node.id);
            if (!position) return null;
            return (
              <MapNodeButton
                key={node.id}
                node={node}
                position={position}
                lib={lib}
                selected={node.id === selectedId}
                dimmed={activeId !== null && node.id !== activeId && !neighbours.has(node.id)}
                onToggle={() => setSelectedId((current) => (current === node.id ? null : node.id))}
                onPeek={(active) => setPeekId((current) => (active ? node.id : current === node.id ? null : current))}
              />
            );
          })}
        </svg>
        <ul className="map-legend">
          {ARROW_TYPES.map((type) => (
            <li key={type} className={`type-${type}`}>
              <span className="map-legend-line" aria-hidden="true" />
              {TRANSITION_LABELS[type]}
            </li>
          ))}
        </ul>
      </div>
      <aside className="card map-panel" aria-live="polite">
        {selected ? (
          <SelectedPosition key={selected.id} position={selected} lib={lib} />
        ) : (
          <p className="muted">
            Select a position to see the techniques that start and end there. Arrows show where each technique takes
            you.
          </p>
        )}
      </aside>
    </div>
  );
}
