/**
 * Offers starter items the library does not have, such as ones added to the app after it was set up.
 * Dismissing hides those items for good; one that goes missing later is offered again.
 */
export function StarterOffer({
  noun,
  names,
  onAdd,
  onDismiss,
}: {
  /** Singular, as in "1 starter concept is not in your library". */
  noun: string;
  names: string[] | undefined;
  onAdd: () => Promise<number>;
  onDismiss: () => Promise<number>;
}) {
  if (!names || names.length === 0) return null;
  const one = names.length === 1;
  return (
    <div className="card stack">
      <p>
        <strong>
          {names.length} starter {one ? `${noun} is` : `${noun}s are`} not in your library:
        </strong>{' '}
        {names.join(', ')}.
      </p>
      <div className="row">
        <button type="button" className="primary" onClick={() => void onAdd()}>
          Add {one ? 'it' : 'them'}
        </button>
        <button type="button" onClick={() => void onDismiss()}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
