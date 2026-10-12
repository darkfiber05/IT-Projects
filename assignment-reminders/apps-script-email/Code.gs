/**
 * Assignment Reminders — email edition (Google Apps Script, free)
 *
 * What it does
 *  - Serves the tracker page as a private web app only you can open.
 *  - Emails each active student about their upcoming deadlines from your Gmail.
 *  - Runs by itself every morning at 9 AM Eastern once you click "Turn on daily emails".
 *
 * Setup is in the instructions you were sent. Nothing below needs editing.
 */

var TZ = 'America/New_York';
var COURSES = {
  ELR: 'Employee & Labor Relations',
  MYC: 'Managing Your Company',
  SM: 'Strategic Management',
  CRS: 'Compensation & Reward Systems',
  AOL: 'MGT 4199 AoL'
};
var STAGES = [7, 3, 1, 0, -1];
var SEND_HOUR = 9;
var SEED = [{"c": "ELR","t": "Quiz 2 (Chapters 4–6)","ty": "Quiz","n": "Closes at the deadline. No late access.","iso": "2026-10-11T23:59:00-04:00","id": "i0"},{"c": "MYC","t": "Fast Starter Revision","ty": "Assignment","n": "Drop box stays open until Dec 7 for revisions.","iso": "2026-10-11T23:59:00-04:00","id": "i1"},{"c": "SM","t": "Individual Case Assignment","ty": "Paper","n": "Mini case #9, LVMH Acquires Tiffany. Max 1,000 words, submit to D2L.","iso": "2026-10-15T23:59:00-04:00","id": "i2"},{"c": "MYC","t": "NotebookLM link","ty": "Drop box","n": "Post the shared NotebookLM link. Closes at 2:54 PM, not midnight.","iso": "2026-10-18T14:54:00-04:00","id": "i3"},{"c": "ELR","t": "Team Conflict Management Styles Analysis","ty": "Team paper","n": "Submit through Turnitin.","iso": "2026-10-18T23:59:00-04:00","id": "i4"},{"c": "CRS","t": "Exam 2 (Chapters 7–11)","ty": "Exam","n": "Opens Oct 19. LockDown Browser + webcam, closed book, one sitting.","iso": "2026-10-23T23:59:00-04:00","id": "i5"},{"c": "ELR","t": "Discussion: Case Study 8-1","ty": "Discussion","n": "Closes at the deadline.","iso": "2026-10-25T23:59:00-04:00","id": "i6"},{"c": "CRS","t": "Compa Ratio Assignment","ty": "Assignment","n": "Upload the Excel sheet with formulas and the Word responses to D2L.","iso": "2026-10-30T23:59:00-04:00","id": "i7"},{"c": "ELR","t": "Quiz 3 (Chapters 7–9)","ty": "Quiz","n": "Closes at the deadline. Daylight saving ends this morning.","iso": "2026-11-01T23:59:00-05:00","id": "i8"},{"c": "ELR","t": "Discussion: Case Study 10-1","ty": "Discussion","n": "Closes at the deadline.","iso": "2026-11-08T23:59:00-05:00","id": "i9"},{"c": "AOL","t": "AoL Program Assessment 2026","ty": "Exam","n": "Required. LockDown Browser + webcam.","iso": "2026-11-20T23:59:00-05:00","id": "i10"},{"c": "AOL","t": "Major exam (own major only)","ty": "Exam","n": "Take only the exam for their major. Most need LockDown Browser.","iso": "2026-11-20T23:59:00-05:00","id": "i11"},{"c": "ELR","t": "Strategies to Achieve Employee Engagement","ty": "Paper","n": "Submit through Turnitin.","iso": "2026-11-22T23:59:00-05:00","id": "i12"},{"c": "CRS","t": "Exam 3 (Chapters 12–18)","ty": "Exam","n": "Opens Nov 23 at 12:01 AM, listed due same night. Window closes Dec 4.","iso": "2026-11-23T23:59:00-05:00","id": "i13"},{"c": "SM","t": "Peer Evaluation","ty": "Evaluation","n": "","iso": "2026-12-05T23:59:00-05:00","id": "i14"},{"c": "ELR","t": "Team Collective Bargaining Agreement SWOT Analysis","ty": "Team paper","n": "Submit through Turnitin.","iso": "2026-12-06T23:59:00-05:00","id": "i15"},{"c": "ELR","t": "Team Peer Evaluation (Team Participation)","ty": "Evaluation","n": "Submit through Turnitin.","iso": "2026-12-06T23:59:00-05:00","id": "i16"},{"c": "MYC","t": "Fast Starter Revision (final window)","ty": "Drop box","n": "Last chance to resubmit a revision. Closes 11:00 PM.","iso": "2026-12-07T23:00:00-05:00","id": "i17"},{"c": "CRS","t": "Leading Through Action","ty": "Assignment","n": "","iso": "2026-12-07T23:59:00-05:00","id": "i18"},{"c": "ELR","t": "Final Exam (Chapters 1–13 + Employee Engagement)","ty": "Exam","n": "Opens Dec 5.","iso": "2026-12-08T23:59:00-05:00","id": "i19"}];

/* ------------------------------------------------------------------ web app */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Assignment Reminders')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ------------------------------------------------------------------ storage */

function readBig_(name, fallback) {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty(name + '_n') || 0);
  if (!n) return fallback;
  var s = '';
  for (var i = 0; i < n; i++) s += props.getProperty(name + '_' + i) || '';
  try { return JSON.parse(s); } catch (e) { return fallback; }
}

function writeBig_(name, value) {
  var props = PropertiesService.getScriptProperties();
  var s = JSON.stringify(value), size = 8000, parts = {};
  var n = Math.ceil(s.length / size) || 1;
  for (var i = 0; i < n; i++) parts[name + '_' + i] = s.slice(i * size, (i + 1) * size);
  parts[name + '_n'] = String(n);
  props.setProperties(parts);
}

function initial_() {
  return {
    items: SEED,
    students: [{ id: 'p1', name: 'Student', email: '', active: true, courses: Object.keys(COURSES) }],
    done: [],
    enabled: false,
    stages: [3, 1, 0],
    lastRun: null
  };
}

function state_() { return readBig_('state', null) || initial_(); }

function update_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var s = state_();
    fn(s);
    writeBig_('state', s);
    return s;
  } finally { lock.releaseLock(); }
}

function log_(entry) {
  var logs = readBig_('logs', []);
  logs.unshift(entry);
  writeBig_('logs', logs.slice(0, 60));
}

/* ------------------------------------------------------------------ helpers */

function dayNum_(d) {
  var k = Utilities.formatDate(new Date(d), TZ, 'yyyy-MM-dd');
  return Math.round(Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)) / 864e5);
}
function fmt_(d, pattern) { return Utilities.formatDate(new Date(d), TZ, pattern); }
function niceDue_(iso) { return fmt_(iso, 'EEEE, MMM d') + ' at ' + fmt_(iso, 'h:mm a') + ' ET'; }
function cleanEmail_(e) {
  e = String(e || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error('Enter a valid email address.');
  return e;
}
function stageLabel_(diff) {
  return diff < 0 ? '1 day overdue' : diff === 0 ? 'Due today' : diff === 1 ? 'Due tomorrow' : 'Due in ' + diff + ' days';
}
function uid_() { return Utilities.getUuid().slice(0, 8); }
function hasTrigger_() {
  return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'dailyReminders'; });
}

/* ------------------------------------------------------------------ API for the page */

function getState() {
  var s = state_();
  return {
    items: s.items, students: s.students, done: s.done, enabled: s.enabled && hasTrigger_(),
    stages: s.stages, lastRun: s.lastRun, logs: readBig_('logs', []),
    owner: Session.getEffectiveUser().getEmail(),
    quota: MailApp.getRemainingDailyQuota()
  };
}

function saveStudent(b) {
  update_(function (s) {
    var id = b.id || uid_();
    var p = {
      id: id,
      name: String(b.name || '').trim().slice(0, 80),
      email: cleanEmail_(b.email),
      active: !!b.active,
      courses: (b.courses || []).filter(function (k) { return COURSES[k]; })
    };
    if (!p.name || !p.courses.length) throw new Error('Enter a name and select at least one course.');
    var i = s.students.map(function (x) { return x.id; }).indexOf(id);
    if (i < 0) s.students.push(p); else s.students[i] = p;
  });
  return true;
}

function removeStudent(id) {
  update_(function (s) {
    s.students = s.students.filter(function (x) { return x.id !== id; });
    s.done = s.done.filter(function (x) { return x.indexOf(id + ':') !== 0; });
  });
  return true;
}

function saveAssignment(b) {
  update_(function (s) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(b.localDue || '')) throw new Error('Enter a due date and time.');
    var due = Utilities.parseDate(b.localDue, TZ, "yyyy-MM-dd'T'HH:mm");
    var a = {
      id: b.id || uid_(),
      t: String(b.t || '').trim().slice(0, 200),
      c: b.c,
      ty: String(b.ty || 'Assignment').slice(0, 50),
      n: String(b.n || '').slice(0, 600),
      iso: due.toISOString()
    };
    if (!a.t || !COURSES[a.c]) throw new Error('Enter an assignment name and course.');
    var i = s.items.map(function (x) { return x.id; }).indexOf(a.id);
    if (i < 0) s.items.push(a); else s.items[i] = a;
  });
  return true;
}

function removeAssignment(id) {
  update_(function (s) {
    s.items = s.items.filter(function (x) { return x.id !== id; });
    s.done = s.done.filter(function (x) { return x.slice(-(id.length + 1)) !== ':' + id; });
  });
  return true;
}

function toggleDone(person, id) {
  update_(function (s) {
    var k = person + ':' + id;
    s.done = s.done.indexOf(k) >= 0 ? s.done.filter(function (x) { return x !== k; }) : s.done.concat([k]);
  });
  return true;
}

function saveSettings(b) {
  var stages = (b.stages || []).map(Number).filter(function (n) { return STAGES.indexOf(n) >= 0; });
  if (b.enabled && !stages.length) throw new Error('Select at least one reminder day.');
  update_(function (s) { s.enabled = !!b.enabled; s.stages = stages; });
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyReminders') ScriptApp.deleteTrigger(t);
  });
  if (b.enabled) {
    ScriptApp.newTrigger('dailyReminders').timeBased().everyDays(1).atHour(SEND_HOUR).inTimezone(TZ).create();
  }
  return true;
}

/** Manual send from the page: one assignment, or a test email. */
function sendNow(b) {
  var s = state_();
  var p = s.students.filter(function (x) { return x.id === b.person; })[0];
  if (!p) throw new Error('Student not found.');
  if (!p.email) throw new Error('Add an email address for ' + p.name + ' first.');
  if (b.test) {
    var sample = s.items.filter(function (a) { return new Date(a.iso) > new Date() && p.courses.indexOf(a.c) >= 0; }).slice(0, 2)
      .map(function (a) { return { a: a, diff: dayNum_(a.iso) - dayNum_(new Date()) }; });
    deliver_(p, sample, 'Test', true);
    return 'Test email sent to ' + p.email + '.';
  }
  var a = s.items.filter(function (x) { return x.id === b.id; })[0];
  if (!a) throw new Error('Assignment not found.');
  deliver_(p, [{ a: a, diff: dayNum_(a.iso) - dayNum_(new Date()) }], 'Manual', false);
  return 'Reminder emailed to ' + p.email + '.';
}

/** Button on the page: run today's check right now. */
function runNow() { return runReminders_(true); }

/** Called by the daily trigger. */
function dailyReminders() { runReminders_(false); }

/* ------------------------------------------------------------------ reminder engine */

function runReminders_(manual) {
  var s = update_(function (s) { s.lastRun = new Date().toISOString(); });
  if (!s.enabled && !manual) return 'Daily emails are off.';
  if (!s.stages.length) return 'No reminder days are selected.';
  var now = new Date(), today = dayNum_(now);
  var sentKeys = readBig_('sent', []);
  var total = 0;
  s.students.forEach(function (p) {
    if (!p.active || !p.email) return;
    var due = [];
    s.items.forEach(function (a) {
      if (p.courses.indexOf(a.c) < 0 || s.done.indexOf(p.id + ':' + a.id) >= 0) return;
      var diff = dayNum_(a.iso) - today;
      if (s.stages.indexOf(diff) < 0) return;
      if (diff === 0 && new Date(a.iso) < now) return;
      var key = [p.id, p.email, a.id, a.iso, diff].join('|');
      if (sentKeys.indexOf(key) >= 0) return;
      due.push({ a: a, diff: diff, key: key });
    });
    if (!due.length) return;
    if (deliver_(p, due, manual ? 'Check now' : 'Automatic', false)) {
      due.forEach(function (d) { sentKeys.push(d.key); });
      total++;
    }
  });
  // keep the sent list small: drop keys for deadlines more than 3 days past
  sentKeys = sentKeys.filter(function (k) { var iso = k.split('|')[3]; return dayNum_(iso) >= today - 3; });
  writeBig_('sent', sentKeys);
  return total ? total + ' reminder email' + (total > 1 ? 's' : '') + ' sent.' : 'Nothing new to send today.';
}

function deliver_(p, due, stage, test) {
  due.sort(function (x, y) { return new Date(x.a.iso) - new Date(y.a.iso); });
  var titles = due.map(function (d) { return d.a.t; });
  var entry = { at: new Date().toISOString(), name: p.name, email: p.email, title: test ? 'Test email' : titles.join(', '), stage: stage, status: 'sent' };
  try {
    var soonest = due.length ? Math.min.apply(null, due.map(function (d) { return d.diff; })) : 1;
    var subject = (test ? '[Test] ' : '') +
      (!due.length ? 'Assignment reminders are set up' :
        (soonest < 0 ? 'Past due: ' : soonest === 0 ? 'Due TODAY: ' : soonest === 1 ? 'Due tomorrow: ' : 'Coming up: ') +
        titles[0] + (due.length > 1 ? ' + ' + (due.length - 1) + ' more' : ''));
    MailApp.sendEmail({ to: p.email, subject: subject, body: plain_(p, due, test), htmlBody: html_(p, due, test), name: 'Assignment Reminders' });
    return true;
  } catch (e) {
    entry.status = 'failed';
    entry.error = String(e.message || e);
    return false;
  } finally { log_(entry); }
}

function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

function plain_(p, due, test) {
  var head = test ? 'This is a test. Real reminders look like this:\n\n' : '';
  return 'Hey ' + p.name + ',\n\n' + head + (due.length ? due.map(function (d) {
    return '- ' + d.a.t + ' (' + COURSES[d.a.c] + '): ' + stageLabel_(d.diff).toLowerCase() + ', ' + niceDue_(d.a.iso) + (d.a.n ? '\n  ' + d.a.n : '');
  }).join('\n') : 'Your assignment reminders are set up.') + '\n\nSubmit in D2L. You got this.';
}

function html_(p, due, test) {
  var rows = due.map(function (d) {
    var color = d.diff <= 0 ? '#a42e22' : d.diff === 1 ? '#875600' : '#006b61';
    return '<tr><td style="padding:14px 0;border-top:1px solid #dbe5e8">' +
      '<div style="font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:' + color + '">' + stageLabel_(d.diff) + '</div>' +
      '<div style="font-size:17px;font-weight:bold;color:#172e39;margin:3px 0">' + esc_(d.a.t) + '</div>' +
      '<div style="font-size:14px;color:#617780">' + esc_(COURSES[d.a.c]) + ' &middot; ' + esc_(niceDue_(d.a.iso)) + '</div>' +
      (d.a.n ? '<div style="font-size:14px;color:#172e39;margin-top:5px">' + esc_(d.a.n) + '</div>' : '') +
      '</td></tr>';
  }).join('');
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;color:#172e39">' +
    (test ? '<p style="background:#fff0d4;color:#875600;padding:8px 12px;border-radius:8px;font-size:13px">Test email. Real reminders look like this.</p>' : '') +
    '<p style="font-size:16px">Hey ' + esc_(p.name) + ', here is what is coming up:</p>' +
    '<table style="width:100%;border-collapse:collapse">' + (rows || '<tr><td>Your reminders are set up.</td></tr>') + '</table>' +
    '<p style="font-size:14px;color:#617780;margin-top:18px">Submit in D2L. You got this.</p></div>';
}
