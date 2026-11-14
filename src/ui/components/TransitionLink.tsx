import { Link } from 'react-router-dom';
import { TRANSITION_LABELS } from '../../domain/labels';
import type { Position, Transition } from '../../domain/types';
import { itemPath } from '../routes';

interface Props {
  transition: Transition;
  positionById: Map<string, Position>;
  /** 'out' shows where it leads; 'in' shows where it comes from. */
  direction: 'out' | 'in';
}

function describeOtherEnd({ transition, positionById, direction }: Props): string {
  if (direction === 'in') {
    const from = positionById.get(transition.fromId);
    return from ? ` from ${from.name}` : '';
  }
  if (transition.type === 'submission') return ' → finish';
  const to = positionById.get(transition.toId);
  return to ? ` → ${to.name}` : '';
}

export function TransitionLink(props: Props) {
  const { transition } = props;
  return (
    <li className="transition-row">
      <span className={`tag tag-${transition.type}`}>{TRANSITION_LABELS[transition.type]}</span>
      <Link to={itemPath('transition', transition.id)}>{transition.name}</Link>
      <span className="muted small">{describeOtherEnd(props)}</span>
    </li>
  );
}
