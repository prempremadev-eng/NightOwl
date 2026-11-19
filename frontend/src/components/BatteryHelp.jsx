import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';

// 🔋 v3 (Prem, 19 Nov): on the guard's page in the Android app, until NightOwl is free from battery saving,
// a card asks for it. Many phones (Xiaomi, Oppo, Vivo, Realme) hold notifications back otherwise.
// One button opens Android's own "Allow?" box; brand tips for the extra switch some phones have.
// Old APKs (no plugin) and a guard who closed it: no card.
const BatteryHelp = registerPlugin('BatteryHelp');
const HIDE_KEY = 'battery_help_hidden';

const TIPS = {
  xiaomi: 'Xiaomi / Redmi / POCO: App info → Autostart ON, Battery saver → No restrictions.',
  redmi: 'Xiaomi / Redmi / POCO: App info → Autostart ON, Battery saver → No restrictions.',
  poco: 'Xiaomi / Redmi / POCO: App info → Autostart ON, Battery saver → No restrictions.',
  oppo: 'Oppo / Realme: App info → Battery usage → Allow background activity + Auto launch ON.',
  realme: 'Oppo / Realme: App info → Battery usage → Allow background activity + Auto launch ON.',
  oneplus: 'OnePlus: App info → Battery → Allow background activity / Don’t optimise.',
  vivo: 'Vivo / iQOO: App info → Battery → Allow background power use + Autostart ON.',
  iqoo: 'Vivo / iQOO: App info → Battery → Allow background power use + Autostart ON.',
  samsung: 'Samsung: App info → Battery → Unrestricted.',
  infinix: 'Infinix / Tecno: Phone Master → Auto-start ON, App info → Battery → No restrictions.',
  tecno: 'Infinix / Tecno: Phone Master → Auto-start ON, App info → Battery → No restrictions.'
};

export default function BatteryHelpCard() {
  const [st, setSt] = useState(null);
  const [onGuard, setOnGuard] = useState(window.location.hash.startsWith('#guard/'));
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(HIDE_KEY) === '1'; } catch { return false; } });

  useEffect(() => {
    if (!Capacitor.isPluginAvailable('BatteryHelp')) return undefined;
    const check = () => BatteryHelp.status().then(setSt).catch(() => {});
    check();
    const onHash = () => setOnGuard(window.location.hash.startsWith('#guard/'));
    window.addEventListener('hashchange', onHash);
    let sub;
    App.addListener('resume', check).then(h => { sub = h; }).catch(() => {});
    return () => { window.removeEventListener('hashchange', onHash); if (sub) sub.remove(); };
  }, []);

  if (!st || st.free || hidden || !onGuard) return null;
  const tip = TIPS[st.brand] || '';
  const later = () => { try { localStorage.setItem(HIDE_KEY, '1'); } catch { /* fine */ } setHidden(true); };
  return (
    <div className="battery-help" role="status">
      <div className="battery-help-text">
        <b>🔋 Notification late aagaama irukka</b>
        <span>NightOwl ku battery saving off pannunga. · பேட்டரி சேமிப்பிலிருந்து NightOwl-ஐ விடுவியுங்கள்.</span>
        {tip && <small>{tip} <button type="button" className="link-btn" onClick={() => BatteryHelp.appSettings()}>App info →</button></small>}
      </div>
      <div className="battery-help-btns">
        <button type="button" className="btn" onClick={() => BatteryHelp.open()}>Allow</button>
        <button type="button" className="pd-chip" onClick={later} aria-label="Later">✕</button>
      </div>
    </div>
  );
}
