'use strict';

// 📱 Android app login (Prem, 13 Nov): a guard signs in once with Clock No + a 4-digit PIN; the app then keeps
// the guard's link token, exactly like the secret link he had before.
//   First time: Clock No + the last 4 digits of his phone (from the Guards list) → he sets his own PIN.
//   Later: Clock No + PIN.  Forgot: the office presses "Reset app PIN" → first time again.
// The PIN is never stored, only "salt:scrypt hash" in Guards.pin_hash. Five wrong tries lock the Clock No
// for 15 minutes (Catalyst cache).

const crypto = require('crypto');

const MAX_TRIES = 5;
const LOCK_HOURS = 1; // cache TTL is in hours; the lock itself is checked against 15 minutes
const LOCK_MS = 15 * 60 * 1000;

module.exports = function appLogin(app, { catalyst, fail, requireRowId, auth, guardById }) {
  const clean = v => String(v || '').trim().toUpperCase().replace(/\s+/g, '');
  const digits = v => String(v || '').replace(/\D/g, '');
  const pinOk = p => /^\d{4}$/.test(String(p || ''));

  function hashPin(pin) {
    const salt = crypto.randomBytes(16).toString('hex');
    return salt + ':' + crypto.scryptSync(String(pin), salt, 32).toString('hex');
  }
  function samePin(pin, stored) {
    const [salt, hash] = String(stored || '').split(':');
    if (!salt || !hash) return false;
    const a = Buffer.from(hash, 'hex');
    const b = crypto.scryptSync(String(pin), salt, 32);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  // Wrong-try counter per Clock No.
  const key = clock => 'applogin_' + clock.replace(/[^A-Z0-9]/g, '').slice(0, 40);
  async function tries(catalystApp, clock) {
    try {
      const v = await catalystApp.cache().segment().getValue(key(clock));
      const t = v ? JSON.parse(v) : null;
      return t && Date.now() - t.at < LOCK_MS ? t : { n: 0, at: Date.now() };
    } catch (e) { return { n: 0, at: Date.now() }; }
  }
  async function wrong(catalystApp, clock) {
    const t = await tries(catalystApp, clock);
    const next = { n: t.n + 1, at: t.n === 0 ? Date.now() : t.at };
    try { await catalystApp.cache().segment().put(key(clock), JSON.stringify(next), LOCK_HOURS); } catch (e) { /* no cache: no lock */ }
    return MAX_TRIES - next.n;
  }
  async function clearTries(catalystApp, clock) {
    try { await catalystApp.cache().segment().delete(key(clock)); } catch (e) { /* fine */ }
  }

  // The one active guard with this Clock No (ID number). Two people with one ID: the office must fix it.
  async function guardOf(zcql, clock) {
    const rows = (await zcql.executeZCQLQuery(`SELECT ROWID, guard_name, id_number, phone, pin_hash, guard_token, is_active, tags FROM Guards WHERE id_number = '${clock.replace(/'/g, "''")}'`))
      .map(r => r.Guards).filter(g => g.is_active === true || g.is_active === 'true');
    if (rows.length > 1) throw new Error('This Clock No is on two guards. Ask the office.');
    return rows[0] || null;
  }
  async function tokenOf(catalystApp, g) {
    if (g.guard_token) return g.guard_token;
    const t = crypto.randomBytes(16).toString('hex');
    await catalystApp.datastore().table('Guards').updateRow({ ROWID: g.ROWID, guard_token: t });
    return t;
  }

  // Step 1: does this Clock No need the first-time setup (phone last 4) or the PIN?
  app.post('/appStart', async (req, res) => {
    try {
      const catalystApp = catalyst.initialize(req, { scope: 'admin' });
      const clock = clean(req.body.clock);
      if (!clock) throw new Error('Type your Clock No.');
      const g = await guardOf(catalystApp.zcql(), clock);
      // The same answer for an unknown Clock No, so the screen does not tell who exists.
      res.status(200).json({ status: 'success', data: { setup: !g || !g.pin_hash } });
    } catch (err) { fail(res, err); }
  });

  // First time: Clock No + last 4 of the phone on record → set the PIN → the guard's token.
  app.post('/appSetup', async (req, res) => {
    try {
      const catalystApp = catalyst.initialize(req, { scope: 'admin' });
      const clock = clean(req.body.clock);
      const t = await tries(catalystApp, clock);
      if (t.n >= MAX_TRIES) throw new Error('Too many wrong tries. Wait 15 minutes or ask the office.');
      if (!pinOk(req.body.pin)) throw new Error('PIN must be 4 digits.');
      const g = await guardOf(catalystApp.zcql(), clock);
      const last4 = digits(req.body.phone4);
      const phone = digits(g && g.phone);
      if (!g || last4.length !== 4 || phone.length < 4 || phone.slice(-4) !== last4) {
        const left = await wrong(catalystApp, clock);
        throw new Error('Clock No or phone digits do not match. ' + (left > 0 ? left + ' tries left.' : 'Locked for 15 minutes.'));
      }
      if (g.pin_hash) throw new Error('A PIN is already set. Log in with your PIN, or ask the office to reset it.');
      const token = await tokenOf(catalystApp, g);
      await catalystApp.datastore().table('Guards').updateRow({ ROWID: g.ROWID, pin_hash: hashPin(req.body.pin) });
      await clearTries(catalystApp, clock);
      res.status(200).json({ status: 'success', data: { t: token, name: g.guard_name } });
    } catch (err) { fail(res, err); }
  });

  // Every later login: Clock No + PIN → the guard's token.
  app.post('/appLogin', async (req, res) => {
    try {
      const catalystApp = catalyst.initialize(req, { scope: 'admin' });
      const clock = clean(req.body.clock);
      const t = await tries(catalystApp, clock);
      if (t.n >= MAX_TRIES) throw new Error('Too many wrong tries. Wait 15 minutes or ask the office.');
      const g = await guardOf(catalystApp.zcql(), clock);
      if (!g || !g.pin_hash || !pinOk(req.body.pin) || !samePin(req.body.pin, g.pin_hash)) {
        const left = await wrong(catalystApp, clock);
        throw new Error('Wrong Clock No or PIN. ' + (left > 0 ? left + ' tries left.' : 'Locked for 15 minutes.'));
      }
      await clearTries(catalystApp, clock);
      const token = await tokenOf(catalystApp, g);
      res.status(200).json({ status: 'success', data: { t: token, name: g.guard_name } });
    } catch (err) { fail(res, err); }
  });

  // Office: "Reset app PIN" on the Guards page → the guard does the first-time setup again.
  app.post('/resetAppPin', async (req, res) => {
    try {
      const catalystApp = catalyst.initialize(req, { scope: 'admin' });
      auth.need(req, 'supervisor');
      const g = auth.requireRow(req, await guardById(catalystApp.zcql(), requireRowId(req.body.guard_id)), 'guard');
      await catalystApp.datastore().table('Guards').updateRow({ ROWID: g.ROWID, pin_hash: '' });
      res.status(200).json({ status: 'success', data: { reset: true } });
    } catch (err) { fail(res, err); }
  });
};
