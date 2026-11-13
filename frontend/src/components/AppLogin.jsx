import { useState } from 'react';
import { api } from '../api.js';

// 📱 Android app login (Prem, 13 Nov). One time on this phone; after that the app opens the guard's page.
//   Step 1  Clock No
//   Step 2a first time: last 4 digits of the phone on record + a new 4-digit PIN (twice)
//   Step 2b later: the PIN
// The server answers with the guard's link token; it is kept on this phone like the old secret link.
const TOKEN_KEY = 'guard_token';

export default function AppLogin() {
  const [step, setStep] = useState('clock'); // clock · setup · pin
  const [clock, setClock] = useState('');
  const [phone4, setPhone4] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const only = (v, n) => v.replace(/\D/g, '').slice(0, n);
  function done(t) {
    try { localStorage.setItem(TOKEN_KEY, t); localStorage.removeItem('app_office'); } catch { /* private mode */ }
    window.location.hash = '#guard/' + t;
  }
  async function run(fn) {
    setBusy(true); setError('');
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const next = () => run(async () => {
    const r = (await api.appStart(clock)).data;
    setStep(r.setup ? 'setup' : 'pin');
  });
  const setup = () => run(async () => {
    if (pin.length !== 4) throw new Error('PIN 4 இலக்கம் · PIN must be 4 digits.');
    if (pin !== pin2) throw new Error('இரண்டு PIN-உம் ஒரே மாதிரி இல்லை · The two PINs are not the same.');
    done((await api.appSetup(clock, phone4, pin)).data.t);
  });
  const login = () => run(async () => done((await api.appLogin(clock, pin)).data.t));
  const office = () => { try { localStorage.setItem('app_office', '1'); } catch { /* fine */ } window.location.hash = '#home'; };
  const back = () => { setStep('clock'); setPin(''); setPin2(''); setPhone4(''); setError(''); };

  return (
    <div className="setup app-login">
      <div className="setup-card guard-head">
        <div className="app-login-logo" aria-hidden="true">🦉</div>
        <div className="guard-me">NightOwl</div>
        <div className="guard-sub">
          {step === 'clock' && 'உங்கள் Clock No · Your Clock No'}
          {step === 'setup' && 'முதல் முறை · First time on this phone'}
          {step === 'pin' && 'உங்கள் PIN · Your PIN'}
        </div>
      </div>

      <form className="setup-card app-login-form" onSubmit={e => { e.preventDefault(); if (busy) return; if (step === 'clock') next(); else if (step === 'setup') setup(); else login(); }}>
        {step === 'clock' && (
          <label>Clock No / ID
            <input id="al-clock" value={clock} onChange={e => setClock(e.target.value.toUpperCase())} autoCapitalize="characters" autoComplete="username" placeholder="P01234" autoFocus required />
          </label>
        )}
        {step !== 'clock' && <div className="app-login-who">Clock No <b>{clock}</b> <button type="button" className="pd-chip" onClick={back}>Change</button></div>}

        {step === 'setup' && <>
          <label>உங்கள் phone எண்ணின் கடைசி 4 இலக்கம் · Last 4 digits of your phone
            <input id="al-phone4" value={phone4} onChange={e => setPhone4(only(e.target.value, 4))} inputMode="numeric" placeholder="••••" required />
          </label>
          <label>புதிய 4 இலக்க PIN · New 4-digit PIN
            <input id="al-pin" type="password" value={pin} onChange={e => setPin(only(e.target.value, 4))} inputMode="numeric" autoComplete="new-password" placeholder="••••" required />
          </label>
          <label>PIN மீண்டும் · PIN again
            <input id="al-pin2" type="password" value={pin2} onChange={e => setPin2(only(e.target.value, 4))} inputMode="numeric" autoComplete="new-password" placeholder="••••" required />
          </label>
          <p className="sim-note">இந்த PIN-ஐ நினைவில் வையுங்கள். யாரிடமும் சொல்ல வேண்டாம். · Remember this PIN. Do not tell anyone.</p>
        </>}

        {step === 'pin' && (
          <label>PIN
            <input id="al-pin-login" type="password" value={pin} onChange={e => setPin(only(e.target.value, 4))} inputMode="numeric" autoComplete="current-password" placeholder="••••" autoFocus required />
          </label>
        )}

        {error && <div className="trip-error">{error}</div>}
        <button className="btn setup-btn" type="submit" disabled={busy}>
          {busy ? '…' : step === 'clock' ? 'Next →' : step === 'setup' ? 'PIN set செய் · Set PIN & log in' : 'உள்ளே · Log in'}
        </button>
        {step === 'pin' && <p className="sim-note">PIN மறந்தால் supervisor-இடம் "Reset app PIN" கேளுங்கள். · Forgot? Ask your supervisor to reset it.</p>}
      </form>

      <button type="button" className="btn secondary setup-btn app-login-office" onClick={office}>Office login (email)</button>
    </div>
  );
}
