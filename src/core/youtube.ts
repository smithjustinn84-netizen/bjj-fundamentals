/** Parse YouTube links and timestamps without calling any YouTube API. */

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeId(value: string): boolean {
  return ID_RE.test(value);
}

interface ParsedLink {
  host: string;
  path: string;
  query: Map<string, string>;
  hash: string;
}

const LINK_RE = /^(?:https?:\/\/)?([^/?#\s]+)([^?#\s]*)(?:\?([^#\s]*))?(?:#(\S*))?$/i;

/**
 * Split a link into its parts by hand. The platform `URL` class is not used because it is a browser/Node API,
 * not part of the language, and core must run anywhere.
 */
function parseLink(input: string): ParsedLink | null {
  const match = LINK_RE.exec(input.trim());
  if (!match) return null;
  const query = new Map<string, string>();
  for (const pair of (match[3] ?? '').split('&')) {
    const [key, value = ''] = pair.split('=');
    // First occurrence wins, as with URLSearchParams.get.
    if (key && !query.has(key)) query.set(key, value);
  }
  return { host: (match[1] ?? '').toLowerCase(), path: match[2] ?? '', query, hash: match[4] ?? '' };
}

export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (ID_RE.test(raw)) return raw;
  const link = parseLink(raw);
  if (!link) return null;
  const host = link.host.replace(/^(www\.|m\.|music\.)/, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = link.path.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (link.path === '/watch') id = link.query.get('v') ?? null;
    else id = link.path.match(/^\/(?:shorts|embed|live|v)\/([^/]+)/)?.[1] ?? null;
  }
  return id && ID_RE.test(id) ? id : null;
}

/**
 * Parse a time like "90", "90s", "1m30s", "1h2m3s", "1:30" or "1:02:03" into seconds.
 * Returns null if it cannot be understood.
 */
export function parseTime(input: string | null | undefined): number | null {
  if (input == null) return null;
  const raw = input.trim().toLowerCase();
  if (raw === '') return null;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^\d+(:\d{1,2}){1,2}$/.test(raw)) {
    return raw.split(':').reduce((acc, part) => acc * SECONDS_PER_MINUTE + parseInt(part, 10), 0);
  }
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (m && (m[1] || m[2] || m[3])) {
    return (
      parseInt(m[1] ?? '0', 10) * SECONDS_PER_HOUR +
      parseInt(m[2] ?? '0', 10) * SECONDS_PER_MINUTE +
      parseInt(m[3] ?? '0', 10)
    );
  }
  return null;
}

/** Pull the start time out of a YouTube URL (t=, start=, or #t=). */
export function parseYouTubeStart(input: string): number | null {
  const link = parseLink(input);
  if (!link) return null;
  const fromQuery = link.query.get('t') ?? link.query.get('start');
  if (fromQuery) return parseTime(fromQuery);
  const fromHash = link.hash.match(/(?:^|&)t=([^&]+)/);
  return fromHash ? parseTime(fromHash[1]) : null;
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / SECONDS_PER_HOUR);
  const m = Math.floor((s % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const sec = s % SECONDS_PER_MINUTE;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

export function watchUrl(youtubeId: string, startSeconds: number): string {
  const t = startSeconds > 0 ? `&t=${Math.floor(startSeconds)}s` : '';
  return `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}${t}`;
}
