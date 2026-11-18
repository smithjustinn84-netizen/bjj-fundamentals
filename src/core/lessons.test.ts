import { describe, expect, it } from 'vitest';
import { currentLesson, FOUNDATION_LESSONS, findLesson, lessonCards, lessonProgress } from './lessons';
import { buildLibrary } from './library';
import type { ReviewState } from './models';
import { starterContent } from './seed';
import { buildLessonQueue } from './study';
import { review } from './testing/testFixtures';

const starter = starterContent(0);
const library = (reviews: ReviewState[] = []) =>
  buildLibrary(starter.concepts, starter.positions, starter.transitions, reviews);
const first = FOUNDATION_LESSONS[0];
const surviving = FOUNDATION_LESSONS[1];
const NOW = 1_000_000_000_000;

describe('foundation lessons', () => {
  it('name only starter items, each lesson with a title, a summary and a practice script', () => {
    const lib = library();
    const unknown = FOUNDATION_LESSONS.flatMap((lesson) => [
      ...lesson.conceptIds.filter((id) => !lib.conceptById.has(id)),
      ...lesson.positionIds.filter((id) => !lib.positionById.has(id)),
      ...lesson.transitionIds.filter((id) => !lib.transitionById.has(id)),
    ]);
    expect(unknown).toEqual([]);
    expect(FOUNDATION_LESSONS.filter((l) => !l.title || !l.summary || !l.practice).map((l) => l.id)).toEqual([]);
    expect(new Set(FOUNDATION_LESSONS.map((l) => l.id)).size).toBe(FOUNDATION_LESSONS.length);
  });

  it('teach a lesson as its first concept, its position, techniques woven with concepts, then the situation', () => {
    if (!surviving) throw new Error('no lessons');
    expect(lessonCards(library(), surviving).map((card) => `${card.kind}:${card.id}`)).toEqual([
      'concept:breathing',
      'position:side-control',
      'transition:side-control-escape',
      'concept:frames',
      'transition:side-control-escape-knees',
      'concept:elbows-in',
      'transition:americana-defence',
      'situation:side-control:bottom',
    ]);
  });

  it('leave out what the library no longer has', () => {
    if (!surviving) throw new Error('no lessons');
    const lib = buildLibrary(starter.concepts, starter.positions, [], []);
    expect(lessonCards(lib, surviving).map((card) => card.kind)).toEqual([
      'concept',
      'position',
      'concept',
      'concept',
    ]);
    expect(lessonCards(buildLibrary([], [], [], []), surviving)).toEqual([]);
  });

  it('count progress from the review state of the cards, and move on once a lesson is learned', () => {
    if (!first) throw new Error('no lessons');
    expect(lessonProgress(library(), first)).toEqual({ total: 5, started: 0, learned: 0 });
    expect(currentLesson(library())?.id).toBe(first.id);
    const reviews = lessonCards(library(), first).map((card) => review(card.kind, card.id, { intervalDays: 8 }));
    expect(lessonProgress(library(reviews.slice(0, 3)), first)).toEqual({ total: 5, started: 3, learned: 3 });
    expect(currentLesson(library(reviews))?.id).toBe(FOUNDATION_LESSONS[1]?.id);
    expect(currentLesson(buildLibrary([], [], [], []))).toBeNull();
  });

  it('are found by id', () => {
    expect(findLesson('escaping-the-mount')?.title).toBe('Escaping the mount');
    expect(findLesson('nothing')).toBeUndefined();
    expect(findLesson(null)).toBeUndefined();
  });
});

describe('buildLessonQueue', () => {
  it('holds only the lesson cards: the due ones, then new ones in lesson order up to the limit', () => {
    if (!surviving) throw new Error('no lessons');
    const lib = library([
      review('position', 'side-control', { due: NOW - 1 }),
      review('concept', 'breathing', { due: NOW + 1 }), // not due
      review('concept', 'posture', { due: NOW - 1 }), // due, but in another lesson
    ]);
    const { queue, fresh } = buildLessonQueue(lib, surviving, 2, NOW);
    expect(queue.map((card) => card.id)).toEqual(['side-control', 'side-control-escape', 'frames']);
    expect(fresh.length).toBe(6);
  });
});
