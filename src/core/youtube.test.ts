import { describe, expect, it } from 'vitest';
import { formatTime, parseTime, parseYouTubeId, parseYouTubeStart, watchUrl } from './youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeId', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}&list=abc`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://youtu.be/${ID}?t=30`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/embed/${ID}?start=10`],
    [`https://www.youtube.com/live/${ID}`],
    [`youtube.com/watch?v=${ID}`],
    [`HTTPS://WWW.YouTube.com/watch?feature=share&v=${ID}#t=5`],
    [`  https://youtu.be/${ID}  `],
    [ID],
  ])('extracts the id from %s', (url) => {
    expect(parseYouTubeId(url)).toBe(ID);
  });

  it.each([
    ['https://vimeo.com/123'],
    ['not a url'],
    ['https://youtube.com/watch?v=short'],
    ['https://evil.example/watch?v=dQw4w9WgXcQ'],
    ['https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ'],
    ['https://example.com/?u=youtube.com/watch?v=dQw4w9WgXcQ'],
    [''],
  ])('rejects %s', (url) => {
    expect(parseYouTubeId(url)).toBeNull();
  });
});

describe('parseTime', () => {
  it.each([
    ['90', 90],
    ['90s', 90],
    ['1m30s', 90],
    ['1h2m3s', 3723],
    ['1:30', 90],
    ['01:02:03', 3723],
    ['2m', 120],
  ])('%s → %i', (input, expected) => {
    expect(parseTime(input)).toBe(expected);
  });
  it.each([[''], ['abc'], ['1:2:3:4'], [null]])('rejects %s', (input) => {
    expect(parseTime(input)).toBeNull();
  });
});

describe('parseYouTubeStart', () => {
  it('reads t=, start= and #t=', () => {
    expect(parseYouTubeStart(`https://youtu.be/${ID}?t=95`)).toBe(95);
    expect(parseYouTubeStart(`https://www.youtube.com/watch?v=${ID}&t=1m35s`)).toBe(95);
    expect(parseYouTubeStart(`https://www.youtube.com/embed/${ID}?start=42`)).toBe(42);
    expect(parseYouTubeStart(`https://www.youtube.com/watch?v=${ID}#t=1m`)).toBe(60);
    expect(parseYouTubeStart(`https://www.youtube.com/watch?v=${ID}`)).toBeNull();
  });
});

describe('formatting', () => {
  it('formats seconds', () => {
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(95)).toBe('1:35');
    expect(formatTime(3723)).toBe('1:02:03');
  });
  it('builds a watch URL with a timestamp', () => {
    expect(watchUrl(ID, 95)).toBe(`https://www.youtube.com/watch?v=${ID}&t=95s`);
    expect(watchUrl(ID, 0)).toBe(`https://www.youtube.com/watch?v=${ID}`);
  });
});
