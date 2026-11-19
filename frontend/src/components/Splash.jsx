import { useEffect, useRef, useState } from 'react';

// The welcome when the app opens (Prem, 26 Oct), once per app open:
//   shift incharge → 📍 branch · agency, guard → "Welcome, <name>", admin → the logo (app name + shield
//   until a logo file is given). A page asks for it with showSplash({...}); this host plays it once.
const SHOWN = 'splash_shown';
// From the gate QR straight to the duty page (Prem, 10 Nov): no owl intro, but the 👋 welcome stays.
const fromGate = () => { try { return !!sessionStorage.getItem('no-splash'); } catch { return false; } };

export function showSplash(detail) {
  try { if (sessionStorage.getItem(SHOWN)) return; sessionStorage.setItem(SHOWN, '1'); } catch { /* private mode: show it */ }
  window.dispatchEvent(new CustomEvent('app-splash', { detail }));
}

// Owl intro on every app open (Prem, 4 Nov: "owl thalai suththanum", like an owl turning its head):
// the face slides round to the back of the head and comes back from the other side, then a blink.
// Plays first; a welcome asked meanwhile waits for it. Module level so StrictMode can't eat it.
const OWL = 'owl_shown';
const OWL_NOW = (() => { try { if (sessionStorage.getItem(OWL)) return false; sessionStorage.setItem(OWL, '1'); } catch { /* show it */ } return true; })();

// The head is its own 3D layer (front face + back of head) on the neck, so the WHOLE head turns
// round like a real owl (Prem, 4 Nov: "neck da suththudhu, eye mattum illa"). Prem's video: the owl
// sits with its back to us and only the head swings round to look at us over its back. Soft "clay" look
// (Prem's prompt: cute 3D owl, sits still, head turns all the way round): every part has a light
// top-left, dark bottom-right gradient, glossy eyes, a shadow and a glow behind.
const GRAD = [
  ['b', 'radial', '#FDBA74', '#F97316', '#B93C0B'],   // body / head
  ['y', 'radial', '#FFFBF5', '#FED7AA', '#F5A962'],   // belly
  ['e', 'radial', '#FFFFFF', '#FFFFFF', '#CBD5E1'],   // eye white
  ['p', 'radial', '#4B5563', '#111827', '#000000'],   // pupil
  ['k', 'radial', '#FEF08A', '#FACC15', '#CA8A04'],   // beak / feet
  ['w', 'radial', '#EA580C', '#C2410C', '#7C2D12'],   // wings / ears
  ['r', 'linear', '#A16207', '#78350F', '#451A03'],   // branch
];
function Defs({ id }) {
  return (
    <defs>
      {GRAD.map(([k, t, a, m, z]) => {
        const stops = [<stop key="a" offset="0" stopColor={a} />, <stop key="m" offset=".5" stopColor={m} />, <stop key="z" offset="1" stopColor={z} />];
        return t === 'radial'
          ? <radialGradient key={k} id={id + k} cx=".35" cy=".3" r=".8">{stops}</radialGradient>
          : <linearGradient key={k} id={id + k} x1="0" y1="0" x2="0" y2="1">{stops}</linearGradient>;
      })}
    </defs>
  );
}
const F = (id, k) => 'url(#' + id + k + ')';

export function Owl() {
  const head = (back) => {
    const id = back ? 'owlB' : 'owlF';
    return (
      <svg viewBox="130 90 252 240" aria-hidden="true">
        <Defs id={id} />
        <path d="M150 104Q170 140 218 156L168 188Q146 150 150 104Z M362 104Q342 140 294 156L344 188Q366 150 362 104Z" fill={F(id, 'w')} />
        <circle cx="256" cy="215" r="105" fill={F(id, 'b')} />
        {back
          ? <path d="M206 170q25 18 50 0q25 18 50 0M196 205q30 20 60 0q30 20 60 0M211 240q22 14 45 0q22 14 45 0" stroke="#B93C0B" strokeWidth="7" fill="none" strokeLinecap="round" opacity=".8" />
          : <>
            <ellipse cx="256" cy="226" rx="92" ry="64" fill="#FDBA74" opacity=".55" />
            <g className="owl-eyes">
              <circle cx="212" cy="210" r="46" fill={F(id, 'e')} /><circle cx="300" cy="210" r="46" fill={F(id, 'e')} />
              <circle cx="216" cy="214" r="25" fill={F(id, 'p')} /><circle cx="296" cy="214" r="25" fill={F(id, 'p')} />
              <circle cx="225" cy="202" r="9" fill="#fff" /><circle cx="305" cy="202" r="9" fill="#fff" />
              <circle cx="209" cy="224" r="4" fill="#fff" opacity=".8" /><circle cx="289" cy="224" r="4" fill="#fff" opacity=".8" />
            </g>
            <path d="M238 250Q256 246 274 250Q264 272 256 282Q248 272 238 250Z" fill={F(id, 'k')} />
            <ellipse cx="196" cy="252" rx="13" ry="7" fill="#FB7185" opacity=".45" /><ellipse cx="316" cy="252" rx="13" ry="7" fill="#FB7185" opacity=".45" />
          </>}
      </svg>
    );
  };
  const id = 'owlS';
  return (
    <div className="owl">
      <svg viewBox="0 0 512 512" aria-hidden="true">
        <Defs id={id} />
        <circle className="owl-star" cx="110" cy="96" r="5" fill="#FDE68A" />
        <circle className="owl-star" cx="160" cy="60" r="4" fill="#FDE68A" />
        <circle className="owl-star" cx="330" cy="58" r="4" fill="#FDE68A" />
        <path d="M405 62a40 40 0 1 0 35 66a46 46 0 0 1 -35 -66z" fill="#FDE68A" />
        <ellipse cx="256" cy="440" rx="150" ry="14" fill="#000" opacity=".25" />
        <rect x="96" y="400" width="320" height="22" rx="11" fill={F(id, 'r')} />
        <ellipse cx="256" cy="312" rx="118" ry="104" fill={F(id, 'b')} />
        <circle cx="256" cy="215" r="103" fill={F(id, 'b')} />
        {/* Body seen from the BACK (like Prem's video): folded wings meet in the middle, a tail. */}
        <path d="M244 398L256 446L268 398Z" fill={F(id, 'w')} />
        <path d="M256 226Q160 234 146 302Q144 372 242 412Q250 330 256 226Z M256 226Q352 234 366 302Q368 372 270 412Q262 330 256 226Z" fill={F(id, 'w')} />
        <path d="M190 300q14 10 28 0M178 336q16 10 32 0M200 368q14 10 28 0M294 300q14 10 28 0M302 336q16 10 32 0M284 368q14 10 28 0" stroke="#7C2D12" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".55" />
        <g fill={F(id, 'k')}>
          <rect x="214" y="396" width="10" height="30" rx="5" /><rect x="229" y="396" width="10" height="30" rx="5" />
          <rect x="273" y="396" width="10" height="30" rx="5" /><rect x="288" y="396" width="10" height="30" rx="5" />
        </g>
      </svg>
      <div className="owl-head">
        <div className="owl-side">{head(false)}</div>
        <div className="owl-side owl-side-back">{head(true)}</div>
      </div>
    </div>
  );
}

// Real owl video (Prem, 17 Nov): the owl sits with its back to us, turns its head round and looks
// straight at us. "NightOwl" comes up the moment it looks; after a short stare the app opens.
// If the video can't play (old phone, no autoplay, reduced motion) the drawn owl above plays instead.
// Head angle over the clip (seconds → degrees away from us), read off owl-intro.mp4 (same as the bird page).
const OWL_KEYS = [[0, 180], [1.2, 165], [2.0, 100], [2.5, 90], [2.75, 40], [2.91, 0]];
function owlAngle(t) {
  if (t <= OWL_KEYS[0][0]) return OWL_KEYS[0][1];
  for (let i = 1; i < OWL_KEYS.length; i++) {
    const [t1, a1] = OWL_KEYS[i], [t0, a0] = OWL_KEYS[i - 1];
    if (t <= t1) { const k = (t - t0) / (t1 - t0); return a0 + (a1 - a0) * (k * k * (3 - 2 * k)); }
  }
  return 0;
}
function owlArc(a) {
  if (Math.abs(a) < 0.5) return '';
  const r = 92, rad = (a - 90) * Math.PI / 180;
  return `M100 8 A${r} ${r} 0 ${a > 180 ? 1 : 0} 1 ${(100 + r * Math.cos(rad)).toFixed(2)} ${(100 + r * Math.sin(rad)).toFixed(2)}`;
}
const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const OWL_LOOKS_AT = 2.85;   // second in owl-intro.mp4 when the owl faces us
const OWL_STARE_MS = 2500;   // stay on the stare before the app opens (Prem 19 Nov: was 0.9 s, too quick)
const reducedMotion = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

export default function SplashHost() {
  const [owl, setOwl] = useState(OWL_NOW && !fromGate() ? 'on' : null);
  const [film, setFilm] = useState(!reducedMotion());
  const [looking, setLooking] = useState(false);
  const video = useRef(null);
  useEffect(() => {
    if (!owl) return undefined;
    // Safety net: never keep the guard waiting more than 9 s, even on a slow network.
    const t = setTimeout(() => setOwl(owl === 'on' ? 'leaving' : null), owl === 'on' ? 9000 : 500);
    return () => clearTimeout(t);
  }, [owl]);
  useEffect(() => {
    const v = video.current;
    if (owl !== 'on' || !film || !v) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => setFilm(false));
  }, [owl, film]);
  // The dial's needle follows the owl's head while the clip plays (bird page style, Prem 19 Nov).
  const needle = useRef(null);
  const sweep = useRef(null);
  const deg = useRef(null);
  const [angle, setAngle] = useState(180);
  useEffect(() => {
    const v = video.current;
    if (owl !== 'on' || !film || !v) return undefined;
    let raf;
    const tick = () => {
      const a = owlAngle(v.currentTime || 0);
      if (needle.current) needle.current.setAttribute('transform', `rotate(${a.toFixed(1)} 100 100)`);
      if (sweep.current) sweep.current.setAttribute('d', owlArc(a));
      if (deg.current) deg.current.textContent = Math.round(a);
      setAngle(x => (Math.abs(x - a) > 30 || (a < 8) !== (x < 8) ? a : x));
      if (!v.ended) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [owl, film]);
  const onTime = e => { if (e.currentTarget.currentTime >= OWL_LOOKS_AT) setLooking(true); };
  const onEnded = () => { setLooking(true); setTimeout(() => setOwl(o => (o === 'on' ? 'leaving' : o)), OWL_STARE_MS); };
  const owlLayer = owl && (
    <div className={'splash splash-owl' + (film ? ' splash-film' : '') + (looking ? ' owl-looking' : '') + (owl === 'leaving' ? ' splash-out' : '')} onClick={() => setOwl('leaving')} role="status">
      {film
        ? <>
          <div className="owl-film">
            <video ref={video} src="owl-intro.mp4" muted playsInline autoPlay preload="auto" aria-hidden="true"
              onTimeUpdate={onTime} onEnded={onEnded} onError={() => setFilm(false)} />
          </div>
          <div className="owl-ghost" aria-hidden="true">Night<em>owl</em></div>
          {/* Sides like the bird page (Prem, 19 Nov): left a headline about NightOwl that comes in when the
              owl looks at us, right a dial whose needle follows the owl's head round to the post. */}
          <div className="nwcopy" aria-hidden="true">
            <div className="nw-eyebrow">NightOwl · every shift</div>
            <h2 className="nw-h1">Every post covered, <em>all night long</em></h2>
            <p className="nw-lede">Card IN, take over the post, break with a cover, hand over at the end. The office sees it live.</p>
            <p className="nw-lede nw-ta">ஒவ்வொரு post-உம், ஒவ்வொரு shift-உம்.</p>
          </div>
          <div className="nwdial-wrap" aria-hidden="true">
            <div className="nwdial">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="92" fill="none" stroke="rgba(227,232,222,.14)" strokeWidth="1" strokeDasharray="1 5.42" />
                <path ref={sweep} d={owlArc(180)} fill="none" stroke="#E8732A" strokeWidth="2" strokeLinecap="round" />
                <g ref={needle} transform="rotate(180 100 100)"><line x1="100" y1="58" x2="100" y2="22" stroke="#E3E8DE" strokeWidth="1.5" strokeLinecap="round" /><circle cx="100" cy="20" r="4" fill="#E8732A" /></g>
                <text x="100" y="2" textAnchor="middle" fill="rgba(227,232,222,.5)" fontSize="8" letterSpacing="1.5">POST</text>
              </svg>
              <div className="nwdial-read"><div className="nwdial-time">{hhmm()}</div><div className="nwdial-deg"><span ref={deg}>180</span>°</div></div>
            </div>
            <div className="nwdial-cap"><span>Eyes on the post</span><b>{looking || angle < 8 ? 'Watching' : angle > 120 ? 'Turned away' : 'Turning'}</b></div>
          </div>
          <button type="button" className="splash-skip">Skip</button>
        </>
        : <Owl />}
      <div className="splash-title">NightOwl</div>
      {film && <div className="owl-tag" aria-hidden="true">Card IN · Post · Break · Attendance · Escort</div>}
    </div>
  );
  const [s, setS] = useState(null);
  const [leaving, setLeaving] = useState(false);
  // Office logins see the Zoho logo (Prem, 26 Oct; official file from zoho.com/branding in public/).
  // Put inline so each coloured part can pop in on its own.
  const [logo, setLogo] = useState('');
  useEffect(() => {
    if (!s || !s.logo || logo) return;
    fetch('zoho-logo.svg').then(r => (r.ok ? r.text() : '')).then(t => setLogo(t.startsWith('<svg') ? t : '')).catch(() => {});
  }, [s, logo]);
  useEffect(() => {
    const on = e => { setLeaving(false); setS(e.detail); };
    window.addEventListener('app-splash', on);
    return () => window.removeEventListener('app-splash', on);
  }, []);
  useEffect(() => {
    if (!s || owl === 'on') return undefined;
    // 3.5 s for everyone (Prem, 26 Oct: the incharge's "Estancia · IPF" timing felt right).
    const stay = s.stay || 3500;
    const a = setTimeout(() => setLeaving(true), stay);
    const b = setTimeout(() => setS(null), stay + 400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [s, owl === 'on']);
  if (!s) return owlLayer || null;
  if (owl === 'on') return owlLayer;
  return (<>
    <div className={'splash' + (s.place ? ' splash-place' : '') + (leaving ? ' splash-out' : '')} onClick={() => setLeaving(true)} role="status">
      {s.logo
        ? <div className="splash-logo" aria-label="Zoho">{logo && <span dangerouslySetInnerHTML={{ __html: logo }} />}</div>
        : s.appLogo
          // Our own app's logo (the home-screen icon) for shift incharges (Prem, 26 Oct).
          ? <img className="splash-app" src="icon-512.png" alt="NightOwl" />
          : !s.place && <div className="splash-icon">{s.icon || '🛡️'}</div>}
      {s.kicker && <div className="splash-kicker">{s.kicker}</div>}
      <div className="splash-title">{s.title}</div>
      {s.sub && <div className="splash-sub">{s.sub}</div>}
      {s.foot && <div className="splash-foot">{s.foot}</div>}
    </div>
    {owlLayer}
  </>);
}
