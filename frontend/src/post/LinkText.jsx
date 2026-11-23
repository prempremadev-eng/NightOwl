// Links in chat messages can be tapped (Prem, 23 Nov: the app link sent in the Cumbum Schedule group).
// Only https:// links; the rest of the text stays plain. Opens in a new tab (Chrome downloads an APK there).
const LINK = /(https:\/\/[^\s<>"']+)/g;

export default function LinkText({ text }) {
  const parts = String(text || '').split(LINK);
  return parts.map((p, i) => (i % 2
    ? <a key={i} className="pd-link" href={p.replace(/[).,!?]+$/, '')} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}>{p}</a>
    : p));
}
