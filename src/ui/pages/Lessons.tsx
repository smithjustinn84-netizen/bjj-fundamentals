import { Link } from 'react-router-dom';
import { useLibrary } from '../../bindings';
import { plural } from '../../core/labels';
import { currentLesson, FOUNDATION_LESSONS, type Lesson, lessonCards, lessonProgress } from '../../core/lessons';
import { type Library, reviewOf } from '../../core/library';
import { cardName } from '../../core/study';
import { Loading, ProgressDot, ProgressLegend } from '../components/common';
import { LearnTabs } from '../components/LearnTabs';
import { ProgressBar } from '../graphics/ProgressBar';
import { lessonReviewPath, studyItemPath } from '../routes';

function LessonCard({
  lib,
  lesson,
  number,
  current,
}: {
  lib: Library;
  lesson: Lesson;
  number: number;
  current: boolean;
}) {
  const cards = lessonCards(lib, lesson);
  const progress = lessonProgress(lib, lesson);
  return (
    <section className="card stack lesson">
      <div>
        <p className="eyebrow">
          Lesson {number}
          {current && ' · you are here'}
        </p>
        <h2>{lesson.title}</h2>
        <p className="muted">{lesson.summary}</p>
      </div>
      {cards.length === 0 ? (
        <p className="muted">Nothing from this lesson is in your library.</p>
      ) : (
        <>
          <div>
            <p className="small">
              <strong>
                {progress.learned} of {plural(progress.total, 'card')}
              </strong>{' '}
              learned
            </p>
            <ProgressBar value={progress.learned} max={progress.total} label={`${lesson.title}: cards learned`} />
          </div>
          <ul className="chip-list">
            {cards.map((card) => (
              <li key={`${card.kind}:${card.id}`}>
                <Link className="chip" to={studyItemPath(card)}>
                  <ProgressDot state={reviewOf(lib, card.kind, card.id)} /> {cardName(lib, card)}
                </Link>
              </li>
            ))}
          </ul>
          <p className="drill">
            <strong>Practise with a partner, about 15 minutes.</strong> {lesson.practice}
          </p>
          <Link className={current ? 'button primary' : 'button'} to={lessonReviewPath(lesson.id)}>
            Study this lesson
          </Link>
        </>
      )}
    </section>
  );
}

export default function Lessons() {
  const lib = useLibrary();
  if (!lib) return <Loading />;
  const current = currentLesson(lib);
  return (
    <div className="stack">
      <LearnTabs />
      <div className="page-head">
        <div>
          <h1>Lessons</h1>
          <p className="muted">
            {FOUNDATION_LESSONS.length} class-sized lessons, in the order to take them: survive underneath first, then
            the guard, then the rest. Review brings new cards in this order too.
          </p>
        </div>
      </div>
      <ProgressLegend />
      <div className="lesson-list">
        {FOUNDATION_LESSONS.map((lesson, index) => (
          <LessonCard key={lesson.id} lib={lib} lesson={lesson} number={index + 1} current={lesson === current} />
        ))}
      </div>
    </div>
  );
}
