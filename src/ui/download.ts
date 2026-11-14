/** Save a value as a pretty-printed JSON file via the browser's download mechanism. */
export function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke later: some browsers cancel the download if the URL is revoked immediately.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
