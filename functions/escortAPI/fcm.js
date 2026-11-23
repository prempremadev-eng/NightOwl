'use strict';

// 🔔 FCM sender for the Android app (Prem, 19 Nov, v2). No extra package: a Google service-account JWT
// is signed with Node's crypto and swapped for a 1-hour access token, then FCM HTTP v1 sends the message.
// The service-account file (Firebase → Project settings → Service accounts → Generate new private key)
// lives only in the private Stratus bucket at FCM_KEY_PATH, never in git or in Settings.
const crypto = require('crypto');

const FCM_KEY_PATH = 'secrets/fcm-service-account.json';
let account = null;   // { project_id, client_email, private_key }
let access = null;    // { token, until }

async function loadAccount(catalystApp, bucketName) {
  if (account) return account;
  const chunks = [];
  for await (const c of await catalystApp.stratus().bucket(bucketName).getObject(FCM_KEY_PATH)) chunks.push(Buffer.from(c));
  const a = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if (!a.project_id || !a.client_email || !a.private_key) throw new Error('FCM key file is not a service-account file');
  account = { project_id: a.project_id, client_email: a.client_email, private_key: a.private_key };
  return account;
}

const b64 = v => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');

async function accessToken(a) {
  if (access && Date.now() < access.until) return access.token;
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: a.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.sign('RSA-SHA256', Buffer.from(head + '.' + body), a.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + body + '.' + sig })
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) throw new Error('FCM login failed (' + res.status + ')');
  access = { token: j.access_token, until: Date.now() + 50 * 60 * 1000 };
  return access.token;
}

// No names through Google (Prem, 23 Nov): FCM text is readable on Google's servers, so the app gets only a
// fixed label and the time; no guard, post, branch or message text, and no guard link in the address. The
// full text is in the app when the guard opens it. (Browser push stays full: it is encrypted end to end.)
const SAFE_BODY = 'Open NightOwl to see · ஆப்-ஐத் திறந்து பாருங்கள்';
function safeText(payload) {
  const title = String(payload.title || ''), tag = String(payload.tag || ''), url = String(payload.url || '');
  const time = (title.match(/\b\d{1,2}:\d{2}\b/) || String(payload.body || '').match(/\b\d{1,2}:\d{2}\b/) || [''])[0];
  let label = '🦉 NightOwl update';
  if (/\bCard IN\b|^\S*\s*IN\b/.test(title)) label = '🪪 Card IN';
  else if (/\bCard OUT\b|^\S*\s*OUT\b/.test(title)) label = '🚪 Card OUT';
  else if (tag.startsWith('group-') || /#group\b/.test(url)) label = '👥 New group message';
  else if (/Cover request/i.test(title)) label = '☕ Cover request';
  else if (/come back/i.test(title)) label = '🔔 Please come back';
  else if (/empty/i.test(title)) label = '⚠️ Post empty';
  else if (tag.startsWith('break-') || /cover|break|is back/i.test(title)) label = '☕ Break update';
  return { title: label + (time ? ' · ' + time : ''), body: SAFE_BODY };
}
// The guard's own link stays on the phone: '#guard/<token>' → '#guard' (the app opens its own page).
const safeUrl = url => String(url || '').replace(/#(guard|group)\/[^/?#]*/, '#$1');

// One notification to one app. Answers 'sent', 'gone' (app removed / token old: delete it) or throws.
async function sendFcm(catalystApp, bucketName, token, payload) {
  const a = await loadAccount(catalystApp, bucketName);
  const bearer = await accessToken(a);
  const data = { url: safeUrl(payload.url) };
  const text = safeText(payload);
  const res = await fetch('https://fcm.googleapis.com/v1/projects/' + a.project_id + '/messages:send', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: {
      token,
      notification: text,
      data,
      android: { priority: 'high', ttl: '3600s', notification: { tag: payload.tag ? String(payload.tag) : undefined } }
    } })
  });
  if (res.ok) return 'sent';
  const j = await res.json().catch(() => ({}));
  const code = j.error && (j.error.status || '');
  const detail = JSON.stringify(j.error && j.error.details || []);
  if (res.status === 404 || code === 'NOT_FOUND' || /UNREGISTERED/.test(detail)) return 'gone';
  const err = new Error('FCM ' + res.status + ' ' + code);
  err.statusCode = res.status;
  throw err;
}

module.exports = { sendFcm };
