'use strict';

// The next guard of a post who is already IN (card or QR) but has not pressed Take over yet (Prem, 16 Nov:
// Cumbum showed "post empty" at 22:03 while the C guard had been IN since 21:41). Looks at the post's
// published schedule for the duty day and that guard's last punch. null when there is nobody like that.
async function waitingAtPost(zcql, postId, dutyDate, exceptGuardId) {
  const id = String(postId).replace(/\D/g, '');
  const day = String(dutyDate || '').slice(0, 10);
  if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const sched = (await zcql.executeZCQLQuery(`SELECT guard_id FROM Schedule WHERE post_id = ${id} AND sched_date = '${day}' AND published = true`))
    .map(r => String(r.Schedule.guard_id)).filter(g => g && g !== String(exceptGuardId));
  for (const g of [...new Set(sched)]) {
    const last = (await zcql.executeZCQLQuery(`SELECT direction, punch_time FROM AccessLog WHERE guard_id = ${g.replace(/\D/g, '')} AND duty_date = '${day}' ORDER BY CREATEDTIME DESC LIMIT 1`)).map(r => r.AccessLog)[0];
    if (!last || last.direction !== 'IN') continue;
    // Taken over already: an active duty row for this guard at this post means it is not "waiting".
    const live = await zcql.executeZCQLQuery(`SELECT ROWID FROM DutyLog WHERE guard_id = ${g.replace(/\D/g, '')} AND post_id = ${id} AND status = 'on_duty' LIMIT 1`);
    if (live.length) continue;
    const who = (await zcql.executeZCQLQuery(`SELECT guard_name FROM Guards WHERE ROWID = ${g.replace(/\D/g, '')}`)).map(r => r.Guards)[0];
    return { guardId: g, name: who ? who.guard_name : 'Next guard', time: String(last.punch_time || '').slice(0, 5) };
  }
  return null;
}

module.exports = { waitingAtPost };
