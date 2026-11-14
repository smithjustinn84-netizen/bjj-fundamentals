/** Parse YouTube links and timestamps without calling any YouTube API. */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function isYouTubeId(value: string): boolean {
  return ID_RE.test(value);
}

export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (ID_RE.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
      if (m) id = m[1] ?? null;
    }
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
    return raw.split(':').reduce((acc, part) => acc * 60 + parseInt(part, 10), 0);
  }
  const m = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (m && (m[1] || m[2] || m[3])) {
    return parseInt(m[1] ?? '0', 10) * 3600 + parseInt(m[2] ?? '0', 10) * 60 + parseInt(m[3] ?? '0', 10);
  }
  return null;
}

/** Pull the start time out of a YouTube URL (t=, start=, or #t=). */
export function parseYouTubeStart(input: string): number | null {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const fromQuery = url.searchParams.get('t') ?? url.searchParams.get('start');
  if (fromQuery) return parseTime(fromQuery);
  const hash = url.hash.match(/t=([^&]+)/);
  return hash ? parseTime(hash[1]) : null;
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

export function watchUrl(youtubeId: string, startSeconds: number): string {
  const t = startSeconds > 0 ? `&t=${Math.floor(startSeconds)}s` : '';
  return `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}${t}`;
}
