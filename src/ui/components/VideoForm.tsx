import { type FormEvent, useState } from 'react';
import { useLibrary, videos } from '../../data';
import { type ItemKind, isItemKind } from '../../domain/types';
import { formatTime, parseTime, parseYouTubeId, parseYouTubeStart } from '../../domain/youtube';

interface ItemRef {
  kind: ItemKind;
  id: string;
}

interface Props {
  /** When set, the bookmark is attached to this item and the "About" picker is hidden. */
  linkedTo?: ItemRef;
  /** Called after saving or cancelling. When set, a Cancel button is shown. */
  onDone?: () => void;
}

// The <select> needs a single string per option, so an item reference is encoded as "kind:id".
const encodeRef = (ref: ItemRef) => `${ref.kind}:${ref.id}`;
function decodeRef(value: string): ItemRef | null {
  const split = value.indexOf(':');
  const kind = value.slice(0, split);
  return split > 0 && isItemKind(kind) ? { kind, id: value.slice(split + 1) } : null;
}

export function VideoForm({ linkedTo, onDone }: Props) {
  const library = useLibrary();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState('');
  const [error, setError] = useState('');

  function onUrlChange(value: string) {
    setUrl(value);
    const start = parseYouTubeStart(value);
    if (start != null && time === '') setTime(formatTime(start));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const youtubeId = parseYouTubeId(url);
    if (!youtubeId) {
      setError('That does not look like a YouTube link.');
      return;
    }
    const startSeconds = time.trim() === '' ? 0 : parseTime(time);
    if (startSeconds == null) {
      setError('Use a time like 1:30, 90, or 1m30s.');
      return;
    }
    const link = linkedTo ?? decodeRef(picked);
    await videos.add({
      title: title.trim() || 'Untitled clip',
      youtubeId,
      startSeconds,
      linkedKind: link?.kind ?? '',
      linkedId: link?.id ?? '',
      note: note.trim(),
    });
    setUrl('');
    setTitle('');
    setTime('');
    setNote('');
    setPicked('');
    setError('');
    onDone?.();
  }

  return (
    <form className="video-form" onSubmit={submit}>
      <label>
        YouTube link
        <input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://youtu.be/…?t=95"
          required
        />
      </label>
      <div className="row">
        <label className="grow">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scissor sweep details" />
        </label>
        <label className="narrow">
          Start at
          <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="1:35" inputMode="numeric" />
        </label>
      </div>
      {!linkedTo && (
        <label>
          About
          <select value={picked} onChange={(e) => setPicked(e.target.value)}>
            <option value="">— Not linked —</option>
            {library && (
              <>
                <optgroup label="Concepts">
                  {library.concepts.map((c) => (
                    <option key={c.id} value={encodeRef({ kind: 'concept', id: c.id })}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Positions">
                  {library.positions.map((p) => (
                    <option key={p.id} value={encodeRef({ kind: 'position', id: p.id })}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Techniques">
                  {library.transitions.map((t) => (
                    <option key={t.id} value={encodeRef({ kind: 'transition', id: t.id })}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
        </label>
      )}
      <label>
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What to watch for" />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row">
        <button type="submit" className="primary">
          Save bookmark
        </button>
        {onDone && (
          <button type="button" onClick={onDone}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
