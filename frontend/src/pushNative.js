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
    await PushNotifications.addListener('pushNotificationActionPerformed', a => {
      const url = a && a.notification && a.notification.data && a.notification.data.url;
      const hash = url && url.includes('#') ? url.slice(url.indexOf('#')) : '';
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
