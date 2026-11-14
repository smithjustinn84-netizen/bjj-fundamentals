import { assertNever } from '../../domain/assertNever';
import { ROLE_LABELS, TRANSITION_LABELS } from '../../domain/labels';
import type { Library } from '../../domain/library';
import type { StudyItem } from '../../domain/study';
import { Bullets } from './common';

/** The question side of a review card, or null if the item no longer exists. */
export function cardPrompt(item: StudyItem, lib: Library): { eyebrow: string; question: string } | null {
  switch (item.kind) {
    case 'concept': {
      const concept = lib.conceptById.get(item.id);
      if (!concept) return null;
      return { eyebrow: 'Concept', question: `What is "${concept.name}", and what are its key points?` };
    }
    case 'position': {
      const position = lib.positionById.get(item.id);
      if (!position) return null;
      return { eyebrow: 'Position', question: `${position.name}: what are the goals for each person?` };
    }
    case 'transition': {
      const transition = lib.transitionById.get(item.id);
      if (!transition) return null;
      const from = lib.positionById.get(transition.fromId)?.name ?? 'unknown position';
      return {
        eyebrow: `${TRANSITION_LABELS[transition.type]} · from ${from}`,
        question: `How do you do the ${transition.name}?`,
      };
    }
    default:
      return assertNever(item.kind);
  }
}

/** The answer side of a review card. */
export function CardAnswer({ item, lib }: { item: StudyItem; lib: Library }) {
  switch (item.kind) {
    case 'concept': {
      const concept = lib.conceptById.get(item.id);
      if (!concept) return null;
      return (
        <>
          <p className="lead">{concept.summary}</p>
          <Bullets items={concept.keyPoints} />
          {concept.drill && (
            <p className="drill">
              <strong>Drill:</strong> {concept.drill}
            </p>
          )}
        </>
      );
    }
    case 'position': {
      const position = lib.positionById.get(item.id);
      if (!position) return null;
      const [top, bottom] = ROLE_LABELS[position.category];
      return (
        <>
          <p className="lead">{position.summary}</p>
          <div className="two-col">
            <div>
              <h3>{top}</h3>
              <Bullets items={position.topGoals} />
            </div>
            <div>
              <h3>{bottom}</h3>
              <Bullets items={position.bottomGoals} />
            </div>
          </div>
        </>
      );
    }
    case 'transition': {
      const transition = lib.transitionById.get(item.id);
      if (!transition) return null;
      const to = transition.toId ? lib.positionById.get(transition.toId)?.name : null;
      return (
        <>
          {to && (
            <p className="lead">
              Ends in: <strong>{to}</strong>
            </p>
          )}
          <Bullets items={transition.steps} ordered />
          {transition.commonMistakes.length > 0 && (
            <>
              <h3>Common mistakes</h3>
              <Bullets items={transition.commonMistakes} />
            </>
          )}
        </>
      );
    }
    default:
      return assertNever(item.kind);
  }
}
