import { assertNever } from '../../core/assertNever';
import { ROLE_LABELS, TRANSITION_LABELS } from '../../core/labels';
import type { Library } from '../../core/library';
import { findSituation, situationName } from '../../core/situations';
import type { StudyItem } from '../../core/study';
import { techniqueDrill } from '../../core/techniqueDrill';
import { TransitionArtwork } from '../graphics/Artwork';
import { ConceptArtwork } from '../graphics/ConceptSvg';
import { PositionArtwork } from '../graphics/PositionSvg';
import { Bullets } from './common';
import { ItemPicture } from './ItemPicture';
import { TransitionList } from './TransitionLink';

const ARTWORK_CLASS = 'review-artwork';

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
      return {
        eyebrow: 'Position',
        question: `${position.name}: what are the goals for each person?`,
      };
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
    case 'situation': {
      const situation = findSituation(lib, item.id);
      if (!situation) return null;
      return { eyebrow: 'Situation', question: `${situationName(situation)}: what are your options?` };
    }
    default:
      return assertNever(item.kind);
  }
}

/** The answer side of a review card: the item's picture, then what the student should have recalled. */
export function CardAnswer({ item, lib }: { item: StudyItem; lib: Library }) {
  switch (item.kind) {
    case 'concept': {
      const concept = lib.conceptById.get(item.id);
      if (!concept) return null;
      return (
        <>
          <ItemPicture kind="concept" id={concept.id} className={ARTWORK_CLASS}>
            <ConceptArtwork id={concept.id} name={concept.name} className={ARTWORK_CLASS} />
          </ItemPicture>
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
          <PositionArtwork id={position.id} name={position.name} className={ARTWORK_CLASS} />
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
      const drill = techniqueDrill(transition);
      return (
        <>
          <ItemPicture kind="transition" id={transition.id} className={ARTWORK_CLASS}>
            <TransitionArtwork transition={transition} positionById={lib.positionById} className={ARTWORK_CLASS} />
          </ItemPicture>
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
          {drill && (
            <p className="drill">
              <strong>Drill:</strong> {drill}
            </p>
          )}
        </>
      );
    }
    case 'situation': {
      const situation = findSituation(lib, item.id);
      if (!situation) return null;
      const { position, role, options } = situation;
      const goals = role === 'top' ? position.topGoals : position.bottomGoals;
      return (
        <>
          <PositionArtwork id={position.id} name={position.name} className={ARTWORK_CLASS} />
          <h3>What you want</h3>
          <Bullets items={goals} />
          <h3>What you can do</h3>
          <TransitionList transitions={options} positionById={lib.positionById} direction="out" />
        </>
      );
    }
    default:
      return assertNever(item.kind);
  }
}
