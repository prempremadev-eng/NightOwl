// 📱 App v3.3 (Prem, 23 Nov): the gate QR opens the NightOwl app when it is installed (Android App Links,
// public/.well-known/assetlinks.json). The link is the same as before (…#qr/<key>); here the app takes the
// #… part of the link and shows that page. Without the app the same QR opens in the browser as before.
import { App } from '@capacitor/app';
import { isNativeApp } from './native.js';

function openLink(url) {
  try {
    const i = String(url || '').indexOf('#');
    const hash = i >= 0 ? String(url).slice(i) : '';
    if (/^#(qr|guard|group)\//.test(hash) && window.location.hash !== hash) window.location.hash = hash;
  } catch { /* not a link of ours */ }
}

export function startAppLinks() {
  if (!isNativeApp()) return;
  App.getLaunchUrl().then(r => r && openLink(r.url)).catch(() => {});
  App.addListener('appUrlOpen', e => openLink(e && e.url));
}
