// Links in chat messages can be tapped (Prem, 23 Nov: the app link sent in the Cumbum Schedule group).
// Only https:// links; the rest of the text stays plain. In a browser: a new tab (Chrome downloads an APK there).
// In the Android app the WebView ignores new-tab links (Prem, 23 Nov: "touch pannine onnume aagala"), so the
// link opens in Chrome through the Browser plugin.
import { Browser } from '@capacitor/browser';
import { isNativeApp } from '../native.js';

const LINK = /(https:\/\/[^\s<>"']+)/g;

function open(e, url) {
  e.stopPropagation();
  if (!isNativeApp()) return; // the browser follows the link itself
  e.preventDefault();
  Browser.open({ url }).catch(() => { window.location.href = url; });
}

export default function LinkText({ text }) {
  const parts = String(text || '').split(LINK);
  return parts.map((p, i) => {
    if (!(i % 2)) return p;
    const url = p.replace(/[).,!?]+$/, '');
    return <a key={i} className="pd-link" href={url} target="_blank" rel="noopener noreferrer" onClick={e => open(e, url)}>{p}</a>;
  });
}
