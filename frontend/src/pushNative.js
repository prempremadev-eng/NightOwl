import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from './api.js';
import { isNativeApp } from './native.js';

// 🔔 v2 (Prem, 19 Nov): the Android app gets card-IN notifications through FCM (Firebase).
// The guard's phone asks once for "Allow notifications", gets its FCM address and sends it to our
// server with the guard's link token. Tapping a notification opens the page it names.
// Old APKs (v1.2) do not have the plugin: then nothing happens.
let started = false;
export async function startAppPush(t) {
  if (started || !t || !isNativeApp() || !Capacitor.isPluginAvailable('PushNotifications')) return;
  started = true;
  try {
    await PushNotifications.addListener('registration', async tok => {
      try { await api.saveAppPush(t, tok.value); } catch (err) { console.error('App push not saved:', err.message); }
    });
    await PushNotifications.addListener('registrationError', e => console.error('App push register failed:', e && e.error));
    // v3.1: a notification while the app is open (it is also shown on top, see capacitor.config.json):
    // the open guard page reloads its data at once, like the browser's service worker does.
    await PushNotifications.addListener('pushNotificationReceived', n => {
      window.dispatchEvent(new CustomEvent('guard-push', { detail: { type: 'push', title: n && n.title, url: n && n.data && n.data.url } }));
      // Prem, 19 Nov: the open page did not always change at once on card OUT. On the guard's own page
      // a card IN / OUT reloads the whole page a moment later, so it always shows the new state.
      const title = String((n && n.title) || '');
      if (window.location.hash.startsWith('#guard/') && /\b(IN|OUT)\b/.test(title)) setTimeout(() => window.location.reload(), 1200);
    });
    await PushNotifications.addListener('pushNotificationActionPerformed', a => {
      const url = a && a.notification && a.notification.data && a.notification.data.url;
      let hash = url && url.includes('#') ? url.slice(url.indexOf('#')) : '';
      // 23 Nov: the server sends '#guard' / '#group' without the guard's link (no token through Google);
      // this phone's own logged-in guard is meant.
      if (hash === '#guard' || hash === '#group') hash += '/' + t;
      if (hash) window.location.hash = hash;
    });
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;
    await PushNotifications.register();
  } catch (err) {
    console.error('App push start failed:', err && err.message);
  }
}
