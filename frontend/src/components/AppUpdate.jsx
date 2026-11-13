import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

// 🔄 In-app update banner (Prem, 13 Nov): the Android app compares its own build number with
// app/version.json on the website; a newer APK shows a banner, Update downloads it in the browser and
// Android opens the install screen. Play Store later makes this unneeded.
export default function AppUpdate() {
  const [next, setNext] = useState(null);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const info = await App.getInfo();
        const res = await fetch('app/version.json?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return;
        const v = await res.json();
        if (!stop && Number(v.build) > Number(info.build)) setNext(v);
      } catch { /* offline or no file: no banner */ }
    })();
    return () => { stop = true; };
  }, []);

  if (!next || hide) return null;
  const url = new URL(next.apk || 'app/NightOwl.apk', window.location.href).href;
  return (
    <div className="app-update" role="status">
      <span>🔄 NightOwl புதிய version <b>{next.name}</b> · New version ready</span>
      <button className="btn" onClick={() => Browser.open({ url })}>Update</button>
      <button className="pd-chip" onClick={() => setHide(true)} aria-label="Later">✕</button>
    </div>
  );
}
