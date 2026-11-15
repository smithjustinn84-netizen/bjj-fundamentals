import { Link } from 'react-router-dom';
import { endSideLabel, TRANSITION_LABELS } from '../../core/labels';
import { endsTheRoll, type Position, type Transition } from '../../core/models';
import { endRole } from '../../core/roles';
import { Icon } from '../graphics/icons';
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
    return from ? `from ${from.name}` : '';
  }
  if (endsTheRoll(transition.type)) return '→ tap';
  const to = positionById.get(transition.toId);
  if (!to) return '';
  const side = endRole({ positionById }, transition);
  return side ? `→ ${to.name}, ${endSideLabel(to.category, side)}` : `→ ${to.name}`;
}

function TransitionLink(props: Props) {
  const { transition } = props;
  return (
    <li>
      <Link className="row-link" to={itemPath('transition', transition.id)}>
        <span className="row-text">
          <span className="row-name">{transition.name}</span>
          <span className="row-meta">
            <span className={`tag tag-${transition.type}`}>{TRANSITION_LABELS[transition.type]}</span>
            {describeOtherEnd(props)}
          </span>
        </span>
        <Icon name="chevron" />
      </Link>
    </li>
  );
}

/** Techniques as a list of links, each with its type and other end. */
export function TransitionList({
  transitions,
  positionById,
  direction,
  className = '',
}: Omit<Props, 'transition'> & { transitions: Transition[]; className?: string }) {
  return (
    <ul className={`transition-list ${className}`.trim()}>
      {transitions.map((t) => (
        <TransitionLink key={t.id} transition={t} positionById={positionById} direction={direction} />
      ))}
    </ul>
  );
}

export const NO_TECHNIQUES_FROM_HERE = 'No techniques from here yet.';
