# Owl video splash — handoff prompt (2026-11-17)

Paste the block below into a new Claude Code session started in `~/Desktop/NightOwl`
(or `~/Desktop/NightOwl-mobile` when it's time to bring this into the APK).

---

```
I'm Prem. This folder is NightOwl (React + Vite frontend in frontend/, Catalyst function
functions/escortAPI/, Slate hosting). Reply in Tanglish, simple words.

## What was done on 2026-11-17 (in another chat, folder ~/Desktop/bird)
The app-open owl intro changed from the drawn SVG cartoon owl to a REAL owl video.

- Video: frontend/public/owl-intro.mp4 (540x960, 2.93 s, 0.78 MB, no sound).
  Made from my WhatsApp owl video: the owl sits with its back to us, turns its head round
  and ends looking straight at the camera. People were cut out, the top emoji cropped,
  the back part slowed down. The owl's real left eye is dark in every frame, so in the
  last frames the good eye was mirrored onto it (both eyes look clear at the end).
  The same clip is on my website page https://bird-60086856508.development.catalystserverless.in/app/owl.html
- Code: frontend/src/components/Splash.jsx (SplashHost) + styles at the end of the
  splash section in frontend/src/post/post.css (.splash-film, .owl-film, .owl-ghost,
  .splash-skip).

## How the splash works now
- Shows on EVERY app open (once per browser session: sessionStorage 'owl_shown').
  Reload in the same session = no owl. Coming from the gate QR ('no-splash') = no owl.
  I said: "every open for now, I may change it to first time only later".
- Dark night background #05060C, video in the middle with soft edges (top/bottom/sides),
  a big faint "Night*owl*" word behind the owl (mix-blend-mode: lighten).
- At 2.85 s (OWL_LOOKS_AT) the owl faces us -> class owl-looking -> "NightOwl" title rises
  and the video zooms 5 %. After the video ends: 0.9 s stare (OWL_STARE_MS), then fade
  into the app. Skip button top-right, tap anywhere also skips. Safety cap 7 s.
- Fallback to the old drawn owl (<Owl />) when: video error, play() rejected,
  or prefers-reduced-motion.
- The welcome splash ("Welcome, <name>", branch/agency, Zoho logo) still comes after the owl.

## Deploy (done on 2026-11-17)
- Built with `cd frontend && npm run build:slate-prod` (PRODUCTION mode, same as before),
  deployed with `cd .. && catalyst deploy slate nightowl`.
- Live: https://nightowl-pebhkgse.onslate.in  (owl-intro.mp4 served as video/mp4 with
  Range support; tested on a phone-size screen: owl turns -> NightOwl -> app opens ~4 s).
- Do NOT run plain `npm run build` casually: it rewrites ../client (old Web Client
  Hosting output, which had uncommitted changes on that day).

## Git
- Commit 2f28192 on branch `slate`:
  "Splash: real owl video on app open (owl turns round and looks at us)".
- NOT pushed yet. Push with: git push origin slate

## Still to do
1. Push `slate` to GitHub.
2. Merge `slate` into `mobile-app` (~/Desktop/NightOwl-mobile) so the APK gets the owl too.
3. Maybe later: show the owl only the first time (change the sessionStorage 'owl_shown'
   check in Splash.jsx to localStorage, or add a setting).
4. Confirm we are allowed to use the WhatsApp owl video in the company app.
```
