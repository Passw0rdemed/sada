/* SADA — app logic. Strings come from i18n.js (I, GAPS, PRACTICES…) and content from data.js. */
'use strict';
(() => {
  /* ---------------- config ---------------- */
  /* Per-platform account overrides (handle, url, connection state). None are linked in this build. */
  const ACCOUNTS = {};
  const PALETTES = { brand: ['nabd'], collection: ['rose', 'lavender', 'coral', 'pearl'] };
  const SWATCH = { nabd: ['#0B1D2D', '#0F766E', '#22C55E'], rose: ['#3A1424', '#984560', '#E8A7BE'], lavender: ['#1E1838', '#5A4AB5', '#B9A8F0'], coral: ['#34170F', '#B0452D', '#F2B49A'], pearl: ['#1C1A16', '#86652A', '#E6D3A3'] };
  const VIEWS = ['today', 'radar', 'studio', 'approvals', 'dashboard', 'calendar', 'inbox', 'analytics', 'ledger', 'team', 'library', 'notes'];
  const NAV = [['grp.work', ['today', 'radar', 'studio', 'approvals']], ['grp.track', ['dashboard', 'calendar', 'inbox', 'analytics', 'ledger']], ['grp.manage', ['team', 'library', 'notes']]];
  const SLA = { low: 60, medium: 240, religious: 120, sensitive: 120, crisis: 15 };
  const TZ = 'Asia/Riyadh';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, reduced ? 40 : ms));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const EV = Object.fromEntries(EVENTS.map(e => [e.id, e])); EV.rumor = RUMOR;
  const SRC = Object.fromEntries(SOURCES.map(s => [s.id, s]));
  const AG = Object.fromEntries(AGENTS.map(a => [a.id, a]));

  const S = {
    lang: 'ar', palette: 'nabd', mode: 'auto', view: 'today', crisis: false, pop: false,
    terms: { sensitive: TERMS.sensitive.map(x => ({ ...x })), medium: TERMS.medium.map(x => ({ ...x })) },
    sources: SOURCES.map(s => ({ ...s })),
    radarFilter: 'all', dismissed: new Set(), corrOpen: false,
    approvals: [], selApproval: null, rejecting: false,
    schedule: [], ledger: [], audit: [],
    inbox: INBOX.map(m => ({ ...m, status: 'open', edit: null })), selInbox: 'm1', inboxFilter: 'all',
    ledgerTab: 'posts', ledgerQ: '', ledgerPf: 'all', testText: '',
    studio: { mode: 'library', eventId: 'dates', free: { title: '', details: '', src: '', cat: 'routine' },
      platforms: ['instagram', 'x', 'linkedin', 'tiktok', 'whatsapp'], langs: ['ar', 'en'], tone: 'official',
      running: false, steps: [], result: null, tab: 'ar', edits: {}, outcome: null },
  };

  const t = (k, v) => { const e = I[k]; let s = e ? (e[S.lang] ?? e.ar) : k; if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]); return s; };
  const L = o => (o ? (o[S.lang] ?? o.ar ?? '') : '');
  const pfName = p => L(PLATFORMS[p]);
  const langName = l => (LANGS[l] ? L(LANGS[l]) : L(NEXT_LANGS.find(x => x.code === l)) || l.toUpperCase());
  const connOf = p => (ACCOUNTS[p] ? ACCOUNTS[p].conn : PLATFORMS[p].conn);
  const member = k => MEMBERS[k];

  /* ---------------- time ---------------- */
  function nowMin() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    return +p.find(x => x.type === 'hour').value * 60 + +p.find(x => x.type === 'minute').value;
  }
  const toMin = s => { const [a, b] = s.split(':').map(Number); return a * 60 + b; };
  const hhmm = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  const quietAt = m => PRAYERS.find(p => { const x = toMin(p.t); return m >= x - QUIET.before && m < x + QUIET.after; });
  function safeSlot(m) { let p, g = 0; while ((p = quietAt(m)) && g++ < 8) m = toMin(p.t) + QUIET.after + 3; return m; }
  const dayDate = off => { const d = new Date(); d.setDate(d.getDate() + off); return d; };
  const gLoc = () => (S.lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB');
  const fmt = (d, o) => new Intl.DateTimeFormat(gLoc(), { timeZone: TZ, ...o }).format(d);
  const hijri = d => new Intl.DateTimeFormat(S.lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura-nu-latn' : 'en-u-ca-islamic-umalqura', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  const ago = mins => (mins < 60 ? t('ago.m', { n: mins }) : t('ago.h', { n: Math.round(mins / 60) }));
  const minsSince = ts => Math.max(0, Math.round((Date.now() - ts) / 60000));
  const stamp = ts => fmt(new Date(ts), { day: 'numeric', month: 'short' }) + ' · ' + fmt(new Date(ts), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

  /* ---------------- sensitivity ---------------- */
  const DIAC = new RegExp('[' + String.fromCharCode(0x64B) + '-' + String.fromCharCode(0x652) + String.fromCharCode(0x640) + ']', 'g');
  const norm = s => s.toLowerCase().replace(DIAC, '').replace(/[أإآ]/g, 'ا');
  const PFX = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك'];
  function hasTerm(text, term) {
    const prefix = term.endsWith('*'), raw = term.replace(/\*$/, '');
    if (/^[a-z\s'-]+$/i.test(raw)) return new RegExp('\\b' + raw.replace(/\s+/g, '\\s+') + (prefix ? '' : '\\b'), 'i').test(text);
    const nt = norm(text), nr = norm(raw);
    if (/\s/.test(nr)) return nt.includes(nr);
    const base = nr.startsWith('ال') ? nr.slice(2) : nr;
    return nt.split(/[^\p{L}\p{M}]+/u).some(tok => {
      if (!tok) return false;
      if (tok === nr || (prefix && tok.startsWith(nr))) return true;
      return PFX.some(p => tok.startsWith(p) && tok.length > p.length + 1 && [nr, base].includes(tok.slice(p.length)));
    });
  }
  function classify(text, cat) {
    if (cat === 'religious' || cat === 'crisis') return { level: 'sensitive', kind: 'cat', cat };
    for (const x of S.terms.sensitive) if (hasTerm(text, x.t)) return { level: 'sensitive', kind: 'term', term: x.t, cat };
    if (cat === 'event' || cat === 'seasonal') return { level: 'medium', kind: 'catMed', cat };
    for (const x of S.terms.medium) if (hasTerm(text, x.t)) return { level: 'medium', kind: 'termMed', term: x.t, cat };
    return { level: 'low', kind: 'low', cat };
  }
  const reasonText = g => {
    const c = L(CATS[g.cat] || { ar: g.cat, en: g.cat });
    return { cat: t('reason.cat', { c }), term: t('reason.term', { t: g.term }), catMed: t('reason.catMed', { c }), termMed: t('reason.termMed', { t: g.term }), low: t('reason.low') }[g.kind];
  };
  const evText = ev => ['ar', 'en', 'ur'].map(l => ev[l] ? [ev[l].title, ev[l].hook, ev[l].short, ev[l].more].join(' ') : '').join(' ');
  const classifyEv = ev => classify(evText(ev), ev.cat);
  /* Nothing is published without a person: low = one quick approval, medium = editor then head of media. */
  function chainFor(level, cat) {
    if (level === 'low') return ['editor'];
    if (level === 'medium') return ['editor', 'manager'];
    return cat === 'crisis' ? ['manager', 'ops'] : ['editor', 'manager', 'specialist'];
  }
  const slaFor = (level, cat) => (level === 'low' ? SLA.low : level === 'medium' ? SLA.medium : cat === 'crisis' ? SLA.crisis : SLA.religious);
  const restrictedOf = ev => ev.cat === 'religious' || ev.cat === 'crisis' || classifyEv(ev).level === 'sensitive';

  /* ---------------- post variants ---------------- */
  const tagsFor = (ev, l) => (ev.tags ? (l === 'ar' ? ev.tags.ar : ev.tags.en) : []) || [];
  function variant(ev, l, pf, tone = 'official') {
    const c = ev[l]; if (!c) return null;
    const tags = tagsFor(ev, l), hook = c.hook || c.title, body = [c.short, c.more].filter(Boolean).join(' ');
    const g = tone === 'friendly' && !restrictedOf(ev) ? POSTKIT.greet[l] + '\n' : '';
    const concise = tone === 'concise', sh = POSTKIT.shots[l] || POSTKIT.shots.en;
    switch (pf) {
      case 'x': return (g + hook + '\n' + (concise ? '' : c.short + '\n') + tags.slice(0, 2).join(' ')).trim();
      case 'instagram': return `${g}${c.title}\n\n${concise ? c.short : body}\n\n${c.cta}\n\n${tags.join(' ')}`.trim();
      case 'linkedin': return `${c.title}\n\n${body}\n\n${c.cta}\n${tags.slice(0, 3).join(' ')}`.trim();
      case 'tiktok': return `${sh[0]}: ${hook}\n${sh[1]}: ${c.short}\n${sh[2]}: ${c.cta}\n\n${sh[3]}: ${hook} ${tags.join(' ')}`;
      case 'snapchat': return hook;
      case 'whatsapp': return `*${c.title}*\n${concise ? c.short : body}\n${c.cta}`;
    }
    return body;
  }
  const evTitle = ev => (ev[S.lang] || ev.ar || ev.en).title;
  const evShort = ev => (ev[S.lang] || ev.ar || ev.en).short;

  /* ---------------- icons ---------------- */
  const P = {
    today: 'M3 12h4l2.5-6 4 12 2.5-6H21', radar: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 12m-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0M12 12l6.5-6.5',
    studio: 'M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
    approvals: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5', calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    inbox: 'M4 5h16v11H9l-5 4z', analytics: 'M5 20V11M11 20V5M17 20v-8M3 20h18', ledger: 'M3 5h18v4H3zM5 9v10h14V9M10 13h4',
    team: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.6a3 3 0 0 1 0 5.4M18 14.3c1.8.8 3 2.7 3 5.7', notes: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7',
    alert: 'M12 3l10 18H2zM12 10v5M12 18v.01', check: 'M5 12.5l4.5 4.5L19 7', x: 'M6 6l12 12M18 6L6 18', lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
    eye: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12zM12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0', sun: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    palette: 'M12 3a9 9 0 1 0 0 18c1.2 0 1.6-1 1.1-1.9-.6-1 .1-2.1 1.2-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10zM7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01', globe: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z',
    image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5h.01', play: 'M8 5v14l11-7z', send: 'M4 12l16-8-6 16-2-7z', arrow: 'M5 12h14M13 6l6 6-6 6', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    monitor: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 12m-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0M12 12l6.5-6.5', ceo: 'M12 4v4M12 16v4M4 12h4M16 12h4M12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
    strategy: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M12 12h.01', research: 'M11 11m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0M20 20l-4.5-4.5',
    factcheck: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5', writing: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3', stylist: 'M4 7h16M4 12h10M4 17h13',
    gate: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3', publishing: 'M4 12l16-8-6 16-2-7z', community: 'M4 5h16v11H9l-5 4z', learning: 'M3 9l9-5 9 5-9 5zM7 11v5c3 2 7 2 10 0v-5',
    orchestrator: 'M12 4v4M12 16v4M4 12h4M16 12h4M12 12m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0', competitors: 'M4 20V9l4-3 4 3v11M12 20V5l4-2 4 2v15M3 20h18',
    data: 'M12 5c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3', design: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5h.01',
    video: 'M4 6h11v12H4zM15 10l5-3v10l-5-3', hashtags: 'M9 4L7 20M17 4l-2 16M4 9h16M3 15h16', localize: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z',
    review: 'M9 11l3 3 8-8M20 12v7H4V5h11', crisiswatch: 'M12 3l10 18H2zM12 10v5M12 18v.01', reports: 'M5 20V11M11 20V5M17 20v-8M3 20h18',
    library: 'M4 4h6v16H4zM14 4h6v16h-6zM10 8h4', dashboard: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  };
  P.image_agent = P.image; P.analytics_agent = P.analytics;
  const ic = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[k] || P.today}"/></svg>`;
  const agentIc = id => ic(id);
  const lvChip = lv => `<span class="chip ${lv}">${ic(lv === 'low' ? 'check' : lv === 'medium' ? 'eye' : 'lock')}${t('lv.' + lv)}</span>`;
  const trustChip = tr => `<span class="chip ${tr === 'official' ? 'ok' : tr === 'partner' ? 'info' : 'crit'}">${t('trust.' + tr)}</span>`;
  const connChip = c => `<span class="chip ${c === 'connected' ? 'ok' : c === 'keys' ? 'warn' : c === 'pending' ? 'info' : ''}">${t('conn.' + c)}</span>`;
  const LOGO = `<svg viewBox="0 0 512 512" role="img" aria-label="${esc(t('brand'))}"><defs><linearGradient id="lg1" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0B1D2D"/><stop offset="1" stop-color="#0F766E"/></linearGradient></defs><rect x="36" y="36" width="440" height="440" rx="112" fill="url(#lg1)"/><circle cx="170" cy="256" r="36" fill="#22C55E"/><g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-width="30"><path d="M234.3 179.4A100 100 0 0 1 234.3 332.6"/><path d="M279.3 125.8A170 170 0 0 1 279.3 386.2" stroke-opacity=".72"/><path d="M321.1 76A235 235 0 0 1 321.1 436" stroke-opacity=".42"/></g></svg>`;
  const media = (ev, cls = 'ph') => ev && ev.img
    ? `<div class="media-wrap"><img class="${cls}" src="${ev.img}" alt="${cls === 'thumb' ? '' : esc(L(ev.alt))}" loading="lazy">${cls === 'ph' ? `<span class="badge-ai">${t('ai.label')}</span>` : ''}</div>`
    : `<div class="libph ${cls === 'thumb' ? 'sm' : ''}" ${cls === 'thumb' ? `title="${esc(t('lib.label'))}"` : ''}>${ic('image')}${cls === 'thumb' ? '' : `<small>${t('lib.label')}</small>`}</div>`;
  const langAttr = l => (l === 'ur' ? ' class="ur" lang="ur" dir="rtl"' : l === 'ar' ? ' lang="ar" dir="rtl"' : ` lang="${l}" dir="ltr"`);

  /* ---------------- seed ---------------- */
  function seed() {
    const now = Date.now(), H = 3600e3, D = 864e5;
    const mk = (evId, pf, l, at, mode, by) => { const ev = EV[evId]; return { id: uid(), at, pf, lang: l, ev: evId, text: variant(ev, l, pf), mode, level: classifyEv(ev).level, by, img: ev.img }; };
    S.ledger = [
      mk('shuttle', 'instagram', 'ar', now - 1 * D + 0.5 * H, 'live', 'reem'), mk('shuttle', 'linkedin', 'en', now - 1 * D + 0.5 * H, 'live', 'reem'),
      mk('volunteers', 'instagram', 'ar', now - 1 * D - 6 * H, 'live', 'khalid'),
      mk('museum', 'linkedin', 'ar', now - 2 * D, 'live', 'reem'), mk('museum', 'instagram', 'ur', now - 2 * D, 'live', 'reem'),
      mk('heat', 'instagram', 'ar', now - 4 * D, 'live', 'ops'), mk('heat', 'linkedin', 'en', now - 4 * D, 'live', 'ops'),
      mk('ramadan', 'x', 'ar', now - 5 * D, 'draft', 'reem'),
    ];
    S.audit = [
      { at: now - 20 * 60e3, act: 'submitted', ev: 'heat', level: 'sensitive', by: 'reem' },
      { at: now - 40 * 60e3, act: 'step', ev: 'nabawi', level: 'sensitive', by: 'reem' },
      { at: now - 1 * D + 0.5 * H, act: 'approved', ev: 'shuttle', level: 'low', by: 'reem' },
      { at: now - 1 * D - 6 * H, act: 'approved', ev: 'volunteers', level: 'medium', by: 'khalid' },
      { at: now - 2 * D, act: 'approved', ev: 'museum', level: 'low', by: 'reem' },
      { at: now - 4 * D, act: 'approved', ev: 'heat', level: 'sensitive', by: 'ops' },
    ];
    const ap = (id, evId, doneN, mins) => {
      const ev = EV[evId], g = classifyEv(ev), roles = chainFor(g.level, ev.cat);
      return { id, ev: evId, g, sla: slaFor(g.level, ev.cat), at: now - mins * 60e3, status: 'pending', pfs: ['instagram', 'x', 'whatsapp'], langs: ['ar', 'en'],
        chain: roles.map((r, i) => ({ role: r, status: i < doneN ? 'done' : i === doneN ? 'current' : 'waiting', at: i < doneN ? now - (mins - 10) * 60e3 : null })) };
    };
    S.approvals = [ap('a1', 'heat', 0, 6), ap('a2', 'nabawi', 1, 40), ap('a3', 'quba', 2, 95), ap('a4', 'dates', 0, 70)];
    S.selApproval = 'a1';
    const sc = (day, time, evId, status, cadence, pfs) => {
      const ev = EV[evId], m = toMin(time), safe = safeSlot(m);
      return { id: uid(), day, time: hhmm(safe), from: safe !== m ? time : null, prayer: safe !== m ? quietAt(m) : null, ev: evId, status, cadence, pfs, level: classifyEv(ev).level };
    };
    S.schedule = [
      ...[0, 1, 2, 3, 4, 5, 6].map(d => sc(d, '08:30', 'shuttle', 'scheduled', 'daily', ['x', 'whatsapp'])),
      sc(0, BEST.event, 'dates', 'held', 'once', ['instagram', 'tiktok']),
      sc(1, BEST.religious, 'nabawi', 'held', 'once', ['instagram', 'x']),
      sc(2, '10:00', 'museum', 'scheduled', 'once', ['instagram', 'linkedin']),
      sc(3, BEST.event, 'volunteers', 'scheduled', 'once', ['instagram', 'linkedin', 'x']),
      sc(4, BEST.seasonal, 'ramadan', 'scheduled', 'once', ['instagram', 'whatsapp']),
      sc(5, BEST.event, 'quba', 'held', 'once', ['instagram']),
    ];
  }

  /* ---------------- prefs ---------------- */
  const hostTheme = document.documentElement.getAttribute('data-theme');
  function loadPrefs() { try { const p = JSON.parse(localStorage.getItem('nabd.prefs') || '{}'); if (p.lang) S.lang = p.lang; if (p.palette) S.palette = p.palette; if (p.mode) S.mode = p.mode; } catch (e) { /* storage unavailable */ } }
  function savePrefs() { try { localStorage.setItem('nabd.prefs', JSON.stringify({ lang: S.lang, palette: S.palette, mode: S.mode })); } catch (e) { /* storage unavailable */ } }
  function applyPrefs() {
    const h = document.documentElement;
    h.lang = S.lang; h.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    h.setAttribute('data-palette', S.palette);
    if (S.mode === 'auto') { if (hostTheme) h.setAttribute('data-theme', hostTheme); else h.removeAttribute('data-theme'); } else h.setAttribute('data-theme', S.mode);
    document.title = t('brand') + ' · ' + t('nav.' + S.view);
  }

  /* ---------------- shell ---------------- */
  const counts = () => ({
    approvals: S.approvals.filter(a => a.status === 'pending').length,
    inbox: S.inbox.filter(m => m.status === 'open').length,
    radar: RADAR.filter(r => !S.dismissed.has(r.ev) && r.mins < 120).length,
  });
  function renderRail() {
    const c = counts(), hot = S.approvals.some(a => a.status === 'pending' && EV[a.ev].cat === 'crisis');
    $('#rail').innerHTML = `
      <div class="brand">${LOGO}<div><b>${t('brand')}</b><small>${t('brandSub')}</small></div></div>
      <svg class="pulse" viewBox="0 0 220 22" preserveAspectRatio="none" aria-hidden="true"><path d="M0 11h70l8-8 10 16 8-12 6 4h118" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <nav class="nav" aria-label="${esc(t('brand'))}">${NAV.map(([g, items]) => `<div><h4>${t(g)}</h4><ul>${items.map(v => {
        const n = c[v]; return `<li><a href="#${v}" ${S.view === v ? 'aria-current="page"' : ''}>${ic(v)}<span>${t('nav.' + v)}</span>${n ? `<span class="cnt ${v === 'approvals' && hot ? 'hot' : ''}">${n}</span>` : ''}</a></li>`;
      }).join('')}</ul></div>`).join('')}</nav>
      <div class="rail-foot"><span class="live"><i></i>${t('rail.agents', { n: AGENTS.filter(a => a.kind !== 'layer').length })}</span><span class="muted-on">${t('rail.preview')}</span></div>`;
  }
  function renderTop() {
    $('#top').innerHTML = `
      <div class="ttl"><h1>${t('nav.' + S.view)}</h1><p>${t('sub.' + S.view)}</p></div>
      <div class="tools">
        <button class="btn ${S.crisis ? 'crisis-on' : 'ghost'} sm" data-a="crisis" aria-pressed="${S.crisis}">${ic('alert')}${S.crisis ? t('top.crisisOn') : t('top.crisis')}</button>
        <button class="btn ghost sm" data-a="pop" aria-expanded="${S.pop}" aria-controls="pop">${ic('palette')}${t('top.appearance')}</button>
        <button class="btn ghost sm" data-a="lang" lang="${S.lang === 'ar' ? 'en' : 'ar'}">${ic('globe')}${t('top.switchLang')}</button>
      </div>`;
    $('#banner').innerHTML = S.crisis ? `<div class="banner" role="alert">${ic('alert')}<p>${t('banner.crisis')}</p><button class="btn danger sm" data-a="crisis">${t('banner.end')}</button></div>` : '';
  }
  function renderPop() {
    const pop = $('#pop'); pop.hidden = !S.pop; if (!S.pop) return;
    const pal = p => `<button class="pal" data-a="palette" data-v="${p}" aria-pressed="${S.palette === p}"><span class="sw" style="background:linear-gradient(135deg,${SWATCH[p][0]} 0 45%,${SWATCH[p][1]} 45% 75%,${SWATCH[p][2]} 75%)"></span>${t('pal.' + p)}</button>`;
    pop.innerHTML = `
      <div class="row"><h2 id="popTitle" style="font-size:16px">${t('ap.title')}</h2><span class="spacer"></span><button class="btn quiet sm" data-a="pop" aria-label="${esc(t('ap.close'))}">${ic('x')}</button></div>
      <div class="stack"><span class="meta">${t('ap.mode')}</span><div class="seg" role="group">${['light', 'dark', 'auto'].map(m => `<button data-a="mode" data-v="${m}" aria-pressed="${S.mode === m}">${t('ap.' + m)}</button>`).join('')}</div></div>
      <div class="stack"><span class="meta">${t('ap.brand')}</span><div class="pals">${PALETTES.brand.map(pal).join('')}</div>
        <span class="meta">${t('ap.collection')}</span><div class="pals">${PALETTES.collection.map(pal).join('')}</div></div>
      <div class="stack"><span class="meta">${t('ap.language')}</span><div class="seg" role="group"><button data-a="setlang" data-v="ar" aria-pressed="${S.lang === 'ar'}" lang="ar">العربية</button><button data-a="setlang" data-v="en" aria-pressed="${S.lang === 'en'}" lang="en">English</button></div></div>`;
  }

  /* ---------------- views ---------------- */
  const V = {};

  V.today = () => {
    const now = nowMin(), d = new Date(), c = counts();
    const todays = S.schedule.filter(s => s.day === 0);
    const next = todays.filter(s => toMin(s.time) >= now).sort((a, b) => toMin(a.time) - toMin(b.time))[0]
      || S.schedule.filter(s => s.day === 1).sort((a, b) => toMin(a.time) - toMin(b.time))[0];
    const nev = next && EV[next.ev];
    const q = quietAt(now), np = PRAYERS.find(p => toMin(p.t) > now) || PRAYERS[0];
    const span = [300, 1440], pos = m => ((Math.min(Math.max(m, span[0]), span[1]) - span[0]) / (span[1] - span[0]) * 100).toFixed(2);
    const pend = S.approvals.filter(a => a.status === 'pending').sort((a, b) => (a.sla - minsSince(a.at)) - (b.sla - minsSince(b.at)));
    const busy = { monitor: 'working', data: 'working', crisiswatch: 'working', orchestrator: 'working', community: c.inbox ? 'working' : 'idle', gate: c.approvals ? 'waiting' : 'idle' };
    if (S.studio.running) { const r = S.studio.steps.find(s => s.status === 'run'); if (r) busy[r.id] = 'working'; }
    const tasks = [['draft', S.ledger.filter(r => r.mode === 'draft').length], ['review', c.approvals], ['approved', S.schedule.filter(s => s.status === 'scheduled' && (s.day > 0 || toMin(s.time) >= now)).length], ['published', S.ledger.filter(r => r.mode !== 'draft').length]];
    const neg = NEG_SHARE.series, thr = NEG_SHARE.threshold;
    return `
    <section class="hero">
      <div class="hero-txt">
        <span class="eyebrow">${t(now < 720 ? 'greet.morning' : 'greet.evening')}</span>
        <h2>${t('today.title')}</h2>
        <p class="date">${fmt(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${hijri(d)}</p>
        <p>${t('today.lead')}</p>
        <div class="tiles">
          ${[['approvals', 'tile.approvals', c.approvals, pend.some(a => EV[a.ev].cat === 'crisis')], ['calendar', 'tile.scheduled', todays.length], ['radar', 'tile.radar', c.radar], ['inbox', 'tile.inbox', c.inbox]]
            .map(([v, k, n, alert]) => `<button class="tile ${alert ? 'alert' : ''}" data-a="go" data-v="${v}"><b class="num">${n}</b><span>${t(k)}</span></button>`).join('')}
        </div>
      </div>
      ${nev ? `<article class="feature">${nev.img ? `<img src="${nev.img}" alt="${esc(L(nev.alt))}">` : ''}
        <div class="cap"><div class="row"><span class="chip">${t('today.next')} · <span class="num">${next.time}</span></span>${nev.img ? `<span class="chip">${t('ai.label')}</span>` : ''}</div>
          <h3>${esc(evTitle(nev))}</h3>
          ${next.from ? `<small>${t('today.shifted', { from: next.from, to: next.time, p: L(next.prayer) })}</small>` : ''}
          <div class="row">${next.pfs.map(p => `<span class="chip">${pfName(p)}</span>`).join('')}</div></div></article>` : ''}
    </section>
    <section class="grid g-side">
      <div class="card"><div class="card-h"><h2>${t('today.decide')}</h2><button class="btn quiet sm" data-a="go" data-v="approvals">${t('today.viewAll')}</button></div>
        <div class="list">${pend.slice(0, 3).map(a => { const ev = EV[a.ev], left = a.sla - minsSince(a.at); return `
          <div class="li">${media(ev, 'thumb')}<div class="grow"><b class="clip">${esc(evTitle(ev))}</b><div class="row">${lvChip(a.g.level)}<span class="meta">${left >= 0 ? t('apv.slaLeft', { n: left }) : t('apv.slaOver')}</span></div></div>
          <button class="btn ghost sm" data-a="openApproval" data-v="${a.id}">${t('today.open')}</button></div>`; }).join('') || `<p class="empty">${t('apv.empty')}</p>`}</div></div>
      <div class="card"><div class="card-h"><h2>${t('today.windows')}</h2><span class="chip ${q ? 'warn' : 'ok'}">${q ? t('today.quietNow', { t: hhmm(toMin(q.t) + QUIET.after) }) : t('today.openNow')}</span></div>
        <div class="timeline" dir="ltr" aria-hidden="true"><div class="bar"></div>
          ${PRAYERS.filter(p => toMin(p.t) >= span[0]).map((p, i) => { const a = toMin(p.t) - QUIET.before, b = toMin(p.t) + QUIET.after; return `<div class="q" style="left:${pos(a)}%;width:${(pos(b) - pos(a)).toFixed(2)}%"></div><span class="lab ${i % 2 ? 'up' : ''}" style="left:${pos(toMin(p.t))}%">${L(p)}</span>`; }).join('')}
          ${todays.map(s => `<span class="pt" style="left:${pos(toMin(s.time))}%"><i></i></span>`).join('')}
          <span class="now" style="left:${pos(now)}%"></span></div>
        <p class="meta" style="margin-top:18px">${t('today.nextPrayer', { p: L(np), t: np.t })}</p>
        <p class="meta">${t('today.windowsNote')}</p></div>
    </section>
    <section class="grid g-side">
      <div class="card"><div class="card-h"><h2>${t('today.tasks')}</h2><small>${t('sample')}</small></div>
        <div class="flow">${tasks.map(([k, n], i) => `${i ? `<span class="arrow">${ic('arrow')}</span>` : ''}<div class="fstep ${k}"><b class="num">${n}</b><span>${t('task.' + k)}</span></div>`).join('')}</div></div>
      <div class="card"><div class="card-h"><h2>${t('cw.title')}</h2><span class="chip ok">${ic('check')}${t('cw.normal')}</span></div>
        <div class="kpi" style="border:0;padding:0">${spark(neg)}</div><p class="meta">${t('cw.desc', { n: thr })}</p></div>
    </section>
    <section class="card"><div class="card-h"><h2>${t('today.agents')}</h2><small>${t('studio.simulated')}</small></div>
      <div class="stages">${Object.keys(STAGES).map(sg => `<div class="stage"><span class="eyebrow">${L(STAGES[sg])}</span><div class="agents">${AGENTS.filter(a => a.stage === sg).map(a => { const st = busy[a.id] || 'idle'; return `<div class="agent"><span class="ic">${agentIc(a.id)}</span><div style="min-width:0"><b>${L(a)}</b><small>${L(a.d)}</small><div class="row" style="gap:6px"><span class="st ${st}"><i></i>${t('st.' + st)}</span>${a.mvp ? `<span class="chip soft">${t('stage.mvp')}</span>` : ''}${a.kind === 'layer' ? `<span class="chip">${t('kind.layer')}</span>` : ''}</div></div></div>`; }).join('')}</div></div>`).join('')}</div></section>
    <section class="card"><div class="card-h"><h2>${t('today.radar')}</h2><button class="btn quiet sm" data-a="go" data-v="radar">${t('today.viewAll')}</button></div>
      <div class="grid g3">${RADAR.filter(r => !S.dismissed.has(r.ev) && r.ev !== 'rumor').slice(0, 3).map(r => { const ev = EV[r.ev]; return `
        <div class="stack">${media(ev)}<span class="meta">${esc(L(SRC[ev.src]))} · ${ago(r.mins)}</span><b>${esc(evTitle(ev))}</b>
        <div class="row">${lvChip(classifyEv(ev).level)}<span class="spacer"></span><button class="btn ghost sm" data-a="compose" data-v="${ev.id}">${t('radar.compose')}</button></div></div>`; }).join('')}</div></section>`;
  };

  V.radar = () => {
    const items = RADAR.filter(r => !S.dismissed.has(r.ev)).filter(r => S.radarFilter === 'all' || SRC[EV[r.ev].src].trust === S.radarFilter);
    return `
    <div class="row"><div class="seg" role="group">${['all', 'official', 'partner', 'unverified'].map(f => `<button data-a="radarFilter" data-v="${f}" aria-pressed="${S.radarFilter === f}">${f === 'all' ? t('radar.all') : t('trust.' + f)}</button>`).join('')}</div>
      <span class="spacer"></span><span class="meta">${t('radar.lastSync')}</span></div>
    <div class="grid g-side">
      <div class="feed">${items.map(r => {
        const ev = EV[r.ev], src = SRC[ev.src], blocked = src.trust === 'unverified', g = classifyEv(ev);
        return `<article class="item ${blocked ? 'blocked' : ''}">${blocked ? `<div class="libph">${ic('alert')}</div>` : media(ev)}
          <div class="stack">
            <div class="row"><span class="meta">${esc(L(src))}</span>${trustChip(src.trust)}<span class="meta">· ${ago(r.mins)}</span></div>
            <h3>${esc(evTitle(ev))}</h3><p class="sum">${esc(evShort(ev))}</p>
            ${blocked ? `<div class="note crit">${ic('alert')}<span>${t('radar.blocked')}</span></div>
              <div class="row"><button class="btn ghost sm" data-a="verify">${ic('shield')}${t('radar.verify')}</button><button class="btn ghost sm" data-a="corr" aria-expanded="${S.corrOpen}">${ic('writing')}${t('radar.correction')}</button></div>
              ${S.corrOpen ? `<div class="corr"><b>${t('corr.title')}</b><dl><dt>${t('corr.claim')}</dt><dd>${esc(evTitle(ev))}</dd><dt>${t('corr.fact')}</dt><dd>${t('corr.factText')}</dd><dt>${t('corr.ref')}</dt><dd>${t('corr.refText')}</dd></dl>
                <div class="quote">${t('corr.draft')}</div><p class="meta">${t('corr.practice')}</p><button class="btn pri sm" disabled>${t('studio.submit')}</button><p class="meta">${t('corr.locked')}</p></div>` : ''}`
            : `<div class="row"><span class="chip">${L(CATS[ev.cat])}</span><span class="meta">${t('radar.predicted')}:</span>${lvChip(g.level)}<span class="spacer"></span>
                <button class="btn quiet sm" data-a="dismiss" data-v="${ev.id}">${t('radar.dismiss')}</button><button class="btn pri sm" data-a="compose" data-v="${ev.id}">${t('radar.compose')}</button></div>`}
          </div></article>`;
      }).join('') || `<p class="empty">${t('radar.empty')}</p>`}</div>
      <aside class="card" style="align-self:start"><div class="card-h"><h2>${t('radar.sources')}</h2><span class="chip soft num">${S.sources.length}</span></div>
        <div class="list">${S.sources.map(s => `<div class="li"><div class="grow"><b>${esc(L(s))}</b></div>${trustChip(s.trust)}</div>`).join('')}</div>
        <div class="note" style="margin-top:12px">${ic('shield')}<span>${t('radar.spokes')}</span></div>
        <div class="card-h" style="margin-top:22px"><h2>${t('cmp.title')}</h2><span class="chip">${t('sample')}</span></div>
        <div class="list">${PEERS.map(p => `<div class="li"><div class="grow"><b>${t('cmp.peer', { x: L(p.x) })}</b><span class="meta">${t('cmp.best')}: <span class="num">${p.best}</span></span></div><span class="chip soft num">${t('cmp.eng')} ${p.eng}%</span></div>`).join('')}</div>
        <p class="note" style="margin-top:10px">${ic('competitors')}<span>${t('cmp.insight')}</span></p></aside>
    </div>`;
  };

  function studioEvent() {
    const st = S.studio;
    if (st.mode === 'library') return EV[st.eventId];
    const f = st.free, l = /[؀-ۿ]/.test(f.title + f.details) ? 'ar' : 'en';
    return { id: 'free', cat: f.cat, src: f.src, img: null, when: { ar: '', en: '' }, [l]: { title: f.title.trim(), short: f.details.trim(), cta: POSTKIT.cta[l] }, tags: POSTKIT.tags, alt: { ar: '', en: '' } };
  }
  V.studio = () => {
    const st = S.studio, r = st.result;
    const evs = EVENTS;
    const conf = `
      <div class="card stack">
        <span class="meta">${t('studio.source')}</span>
        <div class="seg" role="group"><button data-a="smode" data-v="library" aria-pressed="${st.mode === 'library'}">${t('studio.library')}</button><button data-a="smode" data-v="free" aria-pressed="${st.mode === 'free'}">${t('studio.free')}</button></div>
        ${st.mode === 'library' ? `<span class="meta">${t('studio.pickEvent')}</span><div class="opts">${evs.map(e => `
          <button class="opt" data-a="pickEvent" data-v="${e.id}" aria-pressed="${st.eventId === e.id}">${media(e, 'thumb')}<span style="min-width:0"><b>${esc(evTitle(e))}</b><span class="meta">${L(CATS[e.cat])} · ${L(e.when)}</span></span></button>`).join('')}</div>`
        : `<label class="f">${t('studio.freeTitle')}<input class="inp" id="fTitle" data-in="free.title" value="${esc(st.free.title)}" placeholder="${esc(t('studio.ph.title'))}"></label>
           <label class="f">${t('studio.freeDetails')}<textarea class="inp" id="fDetails" data-in="free.details" placeholder="${esc(t('studio.ph.details'))}">${esc(st.free.details)}</textarea></label>
           <label class="f">${t('studio.freeSource')}<select class="inp" id="fSrc" data-ch="free.src"><option value="">${t('studio.noSource')}</option>${S.sources.map(s => `<option value="${s.id}" ${st.free.src === s.id ? 'selected' : ''}>${esc(L(s))} · ${t('trust.' + s.trust)}</option>`).join('')}</select></label>
           <label class="f">${t('studio.freeCat')}<select class="inp" id="fCat" data-ch="free.cat">${Object.keys(CATS).map(c => `<option value="${c}" ${st.free.cat === c ? 'selected' : ''}>${L(CATS[c])}</option>`).join('')}</select></label>`}
        <hr class="sep">
        <span class="meta">${t('studio.platforms')}</span>
        <div class="row">${Object.keys(PLATFORMS).map(p => `<button class="toggle" data-a="togglePf" data-v="${p}" aria-pressed="${st.platforms.includes(p)}"><span class="dot"></span>${pfName(p)}</button>`).join('')}</div>
        <span class="meta">${t('studio.langs')}</span>
        <div class="row">${Object.keys(LANGS).map(l => `<button class="toggle" data-a="toggleLang" data-v="${l}" aria-pressed="${st.langs.includes(l)}"><span class="dot"></span>${langName(l)}</button>`).join('')}</div>
        <span class="meta">${t('studio.tone')}</span>
        <div class="seg" role="group">${['official', 'friendly', 'concise'].map(x => `<button data-a="tone" data-v="${x}" aria-pressed="${st.tone === x}">${t('tone.' + x)}</button>`).join('')}</div>
        <button class="btn pri" data-a="run" ${st.running || (st.mode === 'free' && !st.free.title.trim()) || !st.platforms.length || !st.langs.length ? 'disabled' : ''}>${ic('studio')}${st.running ? t('studio.running') : r ? t('studio.rerun') : t('studio.run')}</button>
      </div>`;
    const pipe = st.steps.length ? `<div class="card"><div class="card-h"><h2>${t('studio.pipeline')}</h2><small>${t('studio.simulated')}</small></div><div class="pipe" id="pipe">${pipeHtml()}</div></div>`
      : `<div class="card"><div class="card-h"><h2>${t('studio.pipeline')}</h2></div><div class="agents">${PIPE_PLAN.concat(PIPE_PUBLISH).map(id => { const a = AG[id]; return `<div class="agent"><span class="ic">${agentIc(id)}</span><div><b>${L(a)}</b><small>${t('kind.' + a.kind)}</small></div></div>`; }).join('')}</div><p class="note" style="margin-top:14px">${ic('studio')}<span>${t('studio.idleHint')}</span></p></div>`;
    return `<div class="grid g-studio">${conf}<div class="stack" style="gap:24px">${pipe}${r ? resultHtml() : ''}</div></div>`;
  };
  function pipeHtml() {
    return S.studio.steps.map(s => { const a = AG[s.id]; return `<div class="step ${s.status}"><span class="dot">${s.status === 'done' ? ic('check') : s.status === 'block' ? ic('x') : agentIc(s.id)}</span>
      <div style="min-width:0"><div class="row" style="gap:8px"><b>${L(a)}</b><span class="chip">${t('kind.' + a.kind)}</span></div>
      <div class="out">${s.out ? esc(s.out()) : esc(L(a.d))}</div></div></div>`; }).join('');
  }
  function resultHtml() {
    const st = S.studio, r = st.result, ev = r.ev;
    if (r.blocked === 'source') return `<div class="note crit">${ic('alert')}<span>${t('studio.blocked.source')}</span></div>`;
    const langs = st.langs, tab = langs.includes(st.tab) ? st.tab : langs[0];
    const crisisBlock = S.crisis && ev.cat !== 'crisis';
    const chain = r.chain.length ? r.chain.map((ro, i) => `${i ? `<span class="arrow">${ic('arrow')}</span>` : ''}<span class="chip">${L(ROLE_NAME[ro])}</span>`).join('') : `<span class="chip ok">${t('studio.chainAuto')}</span>`;
    const slot = r.g.level === 'low' ? hhmm(safeSlot(BEST[ev.cat] === 'now' ? nowMin() : toMin(BEST[ev.cat]))) : null;
    const isTik = p => p === 'tiktok';
    return `
      <div class="gate"><div class="row"><b>${t('studio.gate')}</b><span class="spacer"></span>${lvChip(r.g.level)}<span class="meta">${t('lvd.' + r.g.level)}</span></div>
        <p>${esc(reasonText(r.g))}</p><div class="chain"><span class="meta">${t('studio.chain')}:</span>${chain}</div></div>
      <div class="card"><div class="card-h"><h2>${t('studio.media')}</h2>${ev.img ? `<span class="chip soft">${t('ai.label')}</span>` : ''}</div>
        <div class="media-row">${ev.img ? media(ev) : `<div class="libph">${ic('image')}<small>${t(ev.id === 'free' ? 'out.imageFree' : 'lib.need')}</small>${ev.id !== 'free' ? `<button class="btn ghost sm" data-a="libPick">${t('lib.pick')}</button>` : ''}</div>`}
          <div class="stack"><label class="f">${t('studio.alt')} <span class="meta">${t('studio.altReq')}</span><textarea class="inp" id="altText" data-in="alt">${esc(st.alt ?? L(ev.alt))}</textarea></label>
            ${ev.img ? `<p class="note">${ic('shield')}<span>${t('studio.disclosure')}</span></p>` : ''}
            <p class="note">${ic('eye')}<span><b>${t('studio.signLang')}</b> · ${t('studio.signLangNote')}</span></p></div></div></div>
      <div class="card"><div class="card-h"><h2>${t('studio.previews')}</h2><div class="seg" role="group">${langs.map(l => `<button data-a="tab" data-v="${l}" aria-pressed="${tab === l}">${langName(l)}</button>`).join('')}</div></div>
        <div class="pv-grid">${st.platforms.map(p => {
          const key = p + '|' + tab, base = variant(ev, tab, p, st.tone), txt = st.edits[key] ?? base, lim = PLATFORMS[p].limit, n = txt ? [...txt].length : 0, conn = connOf(p);
          return `<div class="pv"><div class="pv-h"><b>${pfName(p)}</b>${connChip(conn)}</div>
            ${isTik(p) ? `${ev.video ? `<video src="${ev.video}" poster="${ev.video.replace('.mp4', '-poster.jpg')}" controls muted playsinline loop preload="metadata" aria-label="${esc(t('ai.video'))}"></video><span class="meta">${t('ai.video')}</span>` : ''}<span class="meta">${t('studio.scriptTitle')}</span>` : ''}
            ${txt == null ? `<p class="note">${ic('globe')}<span>${t('studio.translateLater')}</span></p>`
              : `<textarea class="inp"${langAttr(tab)} id="pv-${p}" data-in="edit" data-k="${key}" aria-label="${esc(pfName(p))}">${esc(txt)}</textarea>
                 <div class="row"><span class="count num ${n > lim ? 'over' : ''}" id="cnt-${p}">${n} / ${lim}${n > lim ? ' · ' + t('studio.overLimit') : ''}</span><span class="spacer"></span>${conn !== 'connected' ? `<span class="meta">${t('studio.draftOnly')}</span>` : ''}</div>`}
          </div>`; }).join('')}</div></div>
      ${crisisBlock ? `<div class="note crit">${ic('alert')}<span>${t('studio.blocked.crisis')}</span></div>` : ''}
      <div class="row">
        ${st.outcome ? `<div class="note" style="flex:1">${ic('check')}<span>${st.outcome}</span></div>`
          : r.g.level === 'low' ? `<button class="btn pri" data-a="publish" ${crisisBlock ? 'disabled' : ''}>${ic('send')}${t('studio.publish')}</button><button class="btn ghost" data-a="schedule" ${crisisBlock ? 'disabled' : ''}>${ic('calendar')}${t('studio.schedule', { t: slot })}</button>`
          : `<button class="btn pri" data-a="submit" ${crisisBlock ? 'disabled' : ''}>${ic('approvals')}${t('studio.submit')}</button>`}
      </div>`;
  }

  V.approvals = () => {
    const list = S.approvals, sel = list.find(a => a.id === S.selApproval) || list[0];
    if (!sel) return `<p class="empty">${t('apv.empty')}</p>`;
    const ev = EV[sel.ev], l = sel.langs.includes(S.lang) ? S.lang : sel.langs[0];
    const statusChip = a => a.status === 'pending' ? `<span class="chip warn">${t('apv.pending')}</span>` : a.status === 'approved' ? `<span class="chip ok">${t('apv.approved')}</span>` : `<span class="chip crit">${t('apv.rejected')}</span>`;
    const cur = sel.chain.find(c => c.status === 'current');
    return `${approvalsStrip()}<div class="grid g-list">
      <div class="stack"><span class="meta">${t('apv.queue')}</span>${list.map(a => { const e = EV[a.ev], left = a.sla - minsSince(a.at); return `
        <button class="qitem" data-a="selApproval" data-v="${a.id}" aria-current="${a.id === sel.id}"><div class="row">${lvChip(a.g.level)}${statusChip(a)}<span class="spacer"></span>${a.status === 'pending' ? `<span class="meta num ${left < 0 ? '' : ''}">${left >= 0 ? t('apv.slaLeft', { n: left }) : t('apv.slaOver')}</span>` : ''}</div>
          <b>${esc(evTitle(e))}</b><span class="meta">${L(CATS[e.cat])} · ${t('apv.submitted', { t: ago(minsSince(a.at)) })}</span></button>`; }).join('')}</div>
      <div class="card stack" style="gap:18px">
        <div class="row"><h2 style="font-size:19px">${esc(evTitle(ev))}</h2><span class="spacer"></span>${statusChip(sel)}</div>
        <div class="grid g-fit" style="gap:18px">
          <div class="stack">${media(ev)}</div>
          <div class="stack"><span class="meta">${t('apv.why')}</span><p>${esc(reasonText(sel.g))}</p>
            ${ev.cat === 'crisis' ? `<span class="chip info">${ic('shield')}${t('apv.spokes')}</span>` : ''}
            <span class="meta">${t('studio.chain')}</span>
            <div class="steps">${sel.chain.map(c => { const m = member(ROLE_OF[c.role]); return `<div class="sline ${c.status}"><span class="av">${L(m.ini)}</span><div class="grow"><b>${L(ROLE_NAME[c.role])}</b><div class="meta">${esc(L(m))}</div></div>
              ${c.status === 'done' ? `<span class="chip ok">${ic('check')}${t('apv.done')}</span>` : c.status === 'current' ? `<span class="chip warn">${t('apv.current')}</span>` : `<span class="chip">${t('apv.waiting')}</span>`}</div>`; }).join('')}</div></div></div>
        <span class="meta">${t('apv.content')} · ${langName(l)} · ${sel.pfs.map(pfName).join(S.lang === 'ar' ? '، ' : ', ')}</span>
        <div class="quote"${langAttr(l)}>${esc((sel.texts && sel.texts[sel.pfs[0] + '|' + l]) ?? variant(ev, l, sel.pfs[0]))}</div>
        ${sel.status === 'pending' && cur ? (S.rejecting
          ? `<label class="f">${t('apv.rejectReason')}<textarea class="inp" id="rejReason"></textarea></label><div class="row"><button class="btn danger" data-a="confirmReject">${t('apv.confirmReject')}</button><button class="btn quiet" data-a="cancelReject">${t('apv.cancel')}</button></div>`
          : `<div class="row"><button class="btn pri" data-a="approve" ${S.crisis && ev.cat !== 'crisis' ? 'disabled' : ''}>${ic('check')}${t('apv.approve')} · ${L(ROLE_NAME[cur.role])}</button><button class="btn ghost" data-a="reject">${t('apv.reject')}</button>${S.crisis && ev.cat !== 'crisis' ? `<span class="meta">${t('studio.blocked.crisis')}</span>` : ''}</div>`) : sel.reason ? `<div class="note crit">${ic('x')}<span>${esc(sel.reason)}</span></div>` : ''}
      </div></div>`;
  };

  /* ---------------- dashboards ---------------- */
  const PF_ORDER = ['instagram', 'x', 'linkedin', 'tiktok', 'snapchat', 'whatsapp'];
  const SERIES = { instagram: 's1', x: 's2', linkedin: 's3', tiktok: 's4', snapchat: 's5', whatsapp: 's6', ar: 's1', en: 's2', ur: 's3' };
  const pct = (v, tot) => (tot ? Math.round(v / tot * 100) : 0);
  const fmtN = n => new Intl.NumberFormat(S.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB').format(n);
  const dataTable = (head, rows) => `<details class="dtable"><summary>${t('db.table')}</summary><div class="tbl-wrap"><table style="min-width:0"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td class="num">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  function hbars(items, max) {
    return `<div class="hbars">${items.map(it => `<div class="hbar" data-tip="${esc(it.label + ': ' + it.text)}"><span class="hb-l">${esc(it.label)}</span><span class="hb-t"><i style="width:${Math.max(2, it.value / max * 100).toFixed(1)}%;background:${it.color}"></i></span><span class="hb-v num">${esc(it.text)}</span></div>`).join('')}</div>`;
  }
  function legend(items) { return `<div class="legend">${items.map(i => `<span><i style="background:${i.color}"></i>${esc(i.label)}</span>`).join('')}</div>`; }
  const sentColor = ['var(--s1)', 'var(--s-neutral)', 'var(--s2)'];
  const sentLabel = () => [t('mood.pos'), t('mood.neu'), t('mood.neg')];

  V.dashboard = () => {
    const k = id => KPIS.find(x => x.id === id), dayName = i => fmt(new Date(Date.UTC(2026, 10, 22 + i, 9)), { weekday: S.lang === 'ar' ? 'long' : 'short' });
    const escal = S.inbox.filter(m => m.status === 'escalated' || (m.status === 'open' && m.intent === 'complaint')).length;
    const pfTot = PF_ORDER.reduce((a, p) => a + DASH.byPlatform[p], 0), pfMax = Math.max(...PF_ORDER.map(p => DASH.byPlatform[p]));
    const lTot = Object.values(DASH.byLang).reduce((a, b) => a + b, 0);
    const fKeys = ['draft', 'review', 'approved', 'published'];
    const caseKey = { low: 'tm.case.low', medium: 'tm.case.medium', religious: 'tm.case.religious', crisis: 'tm.case.crisis' };
    const quietSlot = h => PRAYERS.some(p => { const a = toMin(p.t) - QUIET.before, b = toMin(p.t) + QUIET.after; return a < (h + 2) * 60 && b > h * 60; });
    const heatVals = DASH.heatDay.map(d => DASH.heatHour.map(v => Math.min(100, v + d))), hMax = Math.max(...heatVals.flat()), hMin = Math.min(...heatVals.flat());
    const tiles = [
      [t('db.published'), fmtN(DASH.published), true], [t('db.sla'), DASH.sla + '%', true],
      [t('db.reply'), k('rsp').v + L(k('rsp').unit), true], [t('db.eng'), k('eng').v + k('eng').unit, true], [t('db.escal'), fmtN(escal), false],
    ];
    return `<div class="note warn">${ic('alert')}<span>${t('db.sampleNote')}</span></div>
    <div class="stats">${tiles.map(([l, v, sample]) => `<div class="stat"><span class="l">${l}</span><b class="num">${v}</b><span class="meta">${sample ? t('sample') : t('db.live')}</span></div>`).join('')}</div>
    <div class="grid g2">
      <div class="card"><div class="card-h"><h2>${t('db.byPlatform')}</h2><span class="chip">${t('sample')}</span></div>
        ${hbars(PF_ORDER.map(p => ({ label: pfName(p), value: DASH.byPlatform[p], text: `${DASH.byPlatform[p]} · ${pct(DASH.byPlatform[p], pfTot)}%`, color: `var(--${SERIES[p]})` })), pfMax)}
        ${dataTable([t('lg.platform'), t('db.count'), t('db.share')], PF_ORDER.map(p => [pfName(p), DASH.byPlatform[p], pct(DASH.byPlatform[p], pfTot) + '%']))}</div>
      <div class="card"><div class="card-h"><h2>${t('db.byLang')}</h2><span class="chip">${t('sample')}</span></div>
        <div class="stack100" role="img" aria-label="${esc(t('db.byLang'))}">${Object.keys(DASH.byLang).map(l => `<i style="flex:${DASH.byLang[l]};background:var(--${SERIES[l]})" data-tip="${esc(langName(l) + ': ' + DASH.byLang[l] + ' · ' + pct(DASH.byLang[l], lTot) + '%')}"></i>`).join('')}</div>
        ${legend(Object.keys(DASH.byLang).map(l => ({ label: `${langName(l)} · ${pct(DASH.byLang[l], lTot)}%`, color: `var(--${SERIES[l]})` })))}
        <hr class="sep" style="margin:16px 0">
        <h3 class="h3">${t('db.funnel')}</h3>
        ${hbars(fKeys.map(f => ({ label: t('task.' + f), value: DASH.funnel[f], text: `${DASH.funnel[f]}`, color: 'var(--s1)' })), DASH.funnel.draft)}
        ${dataTable([t('db.col.stage'), t('db.count')], fKeys.map(f => [t('task.' + f), DASH.funnel[f]]))}</div>
    </div>
    <div class="grid g2">
      <div class="card"><div class="card-h"><h2>${t('db.slaBy')}</h2><span class="chip">${t('db.target', { n: DASH.slaTarget })}</span></div>
        <div class="target-wrap" style="--target:${DASH.slaTarget}%">${hbars(DASH.slaBy.map(x => ({ label: t(caseKey[x.k]), value: x.v, text: x.v + '%', color: 'var(--s1)' })), 100)}</div>
        ${dataTable([t('tm.level'), t('db.share')], DASH.slaBy.map(x => [t(caseKey[x.k]), x.v + '%']))}</div>
      <div class="card"><div class="card-h"><h2>${t('db.sentiment')}</h2><span class="chip">${t('sample')}</span></div>
        <div class="cols" dir="ltr">${DASH.sentiment.map((d, i) => `<div class="col" data-tip="${esc(dayName(i) + ' · ' + sentLabel().map((s, j) => s + ' ' + d[j] + '%').join(' · '))}"><div class="col-bar">${[2, 1, 0].map(j => `<i style="height:${d[j]}%;background:${sentColor[j]}"></i>`).join('')}</div><span class="col-l">${esc(dayName(i))}</span></div>`).join('')}</div>
        ${legend(sentLabel().map((l, j) => ({ label: l, color: sentColor[j] })))}
        ${dataTable([t('db.day'), ...sentLabel()], DASH.sentiment.map((d, i) => [dayName(i), d[0] + '%', d[1] + '%', d[2] + '%']))}</div>
    </div>
    <div class="card"><div class="card-h"><h2>${t('db.heat')}</h2><span class="chip">${t('sample')}</span></div>
      <div class="heat-scroll"><div class="heat" dir="ltr" style="grid-template-columns: minmax(84px,auto) repeat(${DASH.heatHours.length}, minmax(44px,1fr))">
        <span></span>${DASH.heatHours.map(h => `<span class="hh num">${hhmm(h * 60)}</span>`).join('')}
        ${heatVals.map((row, i) => `<span class="hd">${esc(dayName(i))}</span>${row.map((v, j) => { const q = quietSlot(DASH.heatHours[j]), a = 0.12 + 0.88 * (v - hMin) / (hMax - hMin || 1); return `<span class="hc ${q ? 'q' : ''}" style="--a:${a.toFixed(2)}" data-tip="${esc(dayName(i) + ' · ' + hhmm(DASH.heatHours[j] * 60) + '–' + hhmm(DASH.heatHours[j] * 60 + 120) + ' · ' + t('db.index') + ' ' + v + (q ? ' · ' + t('db.quiet') : ''))}"></span>`; }).join('')}`).join('')}
      </div></div>
      <div class="row heat-legend"><span class="meta">${t('db.lower')}</span><span class="ramp"></span><span class="meta">${t('db.higher')}</span><span class="hc q demo"></span><span class="meta">${t('db.quiet')}</span></div>
      <p class="meta">${t('db.heatNote')} ${t('today.windowsNote')}</p></div>
    <div class="card"><div class="card-h"><h2>${t('db.agents')}</h2><span class="chip">${t('sample')}</span></div>
      <div class="tbl-wrap"><table><thead><tr><th>${t('db.col.agent')}</th><th>${t('db.col.stage')}</th><th>${t('db.col.runs')}</th><th>${t('db.col.time')}</th><th>${t('db.col.esc')}</th><th>${t('db.col.edit')}</th></tr></thead><tbody>
      ${AGENTS.filter(a => a.kind !== 'layer').map(a => { const o = DASH.ops[a.id], mx = Math.max(...Object.values(DASH.ops).map(x => x[0])); return `<tr><td><div class="row" style="gap:8px;flex-wrap:nowrap"><span class="ic sm">${agentIc(a.id)}</span><b>${L(a)}</b></div></td><td>${L(STAGES[a.stage])}</td>
        <td><div class="mini"><span class="num">${fmtN(o[0])}</span><i style="width:${Math.max(4, Math.sqrt(o[0] / mx) * 100).toFixed(0)}%"></i></div></td><td class="num">${t('db.sec', { n: o[1] })}</td><td class="num">${o[2]}%</td><td class="num">${o[3]}%</td></tr>`; }).join('')}</tbody></table></div></div>`;
  };
  function approvalsStrip() {
    const pend = S.approvals.filter(a => a.status === 'pending'), over = pend.filter(a => a.sla - minsSince(a.at) < 0).length;
    const oldest = pend.length ? Math.max(...pend.map(a => minsSince(a.at))) : 0;
    return `<div class="strip">${['low', 'medium', 'sensitive'].map(l => `<div class="sitem">${lvChip(l)}<b class="num">${pend.filter(a => a.g.level === l).length}</b></div>`).join('')}
      <div class="sitem"><span class="chip ${over ? 'crit' : 'ok'}">${t('strip.overdue')}</span><b class="num">${over}</b></div>
      <div class="sitem"><span class="meta">${t('strip.oldest', { n: oldest })}</span></div><span class="spacer"></span><span class="meta">${t('db.live')}</span></div>`;
  }
  function inboxStrip() {
    const by = f => S.inbox.filter(f).length, moods = ['pos', 'neu', 'neg'], langs = [...new Set(S.inbox.map(m => m.lang))];
    return `<div class="strip">
      <div class="sitem"><span class="meta">${t('in.open')}</span><b class="num">${by(m => m.status === 'open')}</b></div>
      <div class="sitem"><span class="meta">${t('strip.complaints')}</span><b class="num">${by(m => m.intent === 'complaint')}</b></div>
      <div class="sitem"><span class="meta">${t('in.escalated')}</span><b class="num">${by(m => m.status === 'escalated')}</b></div>
      <div class="sitem sent"><div class="stack100 thin">${moods.map((m, j) => `<i style="flex:${by(x => x.mood === m) || 0.0001};background:${sentColor[j]}" data-tip="${esc(t('mood.' + m) + ': ' + by(x => x.mood === m))}"></i>`).join('')}</div>${legend(moods.map((m, j) => ({ label: `${t('mood.' + m)} ${by(x => x.mood === m)}`, color: sentColor[j] })))}</div>
      <div class="sitem"><span class="meta">${t('strip.langs')}</span><span>${langs.map(langName).join(S.lang === 'ar' ? '، ' : ', ')}</span></div>
      <span class="spacer"></span><span class="meta">${t('db.live')}</span></div>`;
  }

  V.calendar = () => {
    const now = nowMin();
    return `<div class="note">${ic('alert')}<span>${t('cal.finding')}</span></div>
      <div class="row">${PRAYERS.map(p => `<span class="chip warn">${L(p)} · <span class="num">${hhmm(toMin(p.t) - QUIET.before)}–${hhmm(toMin(p.t) + QUIET.after)}</span></span>`).join('')}</div>
      <p class="meta">${t('cal.legend', { b: QUIET.before, a: QUIET.after })} ${t('today.windowsNote')}</p>
      <div class="cal">${[0, 1, 2, 3, 4, 5, 6].map(d => { const date = dayDate(d), items = S.schedule.filter(s => s.day === d).sort((a, b) => toMin(a.time) - toMin(b.time)); return `
        <section class="day ${d === 0 ? 'today' : ''}"><div><h3>${d === 0 ? t('cal.today') : fmt(date, { weekday: 'long' })}</h3><span class="h">${fmt(date, { day: 'numeric', month: 'long' })} · ${hijri(date)}</span></div>
        ${items.map(s => { const ev = EV[s.ev], paused = S.crisis && ev.cat !== 'crisis', past = d === 0 && toMin(s.time) < now; return `
          <div class="slot ${paused ? 'paused' : ''}" style="${past ? 'opacity:.6' : ''}"><div class="row" style="gap:6px"><span class="t">${s.time}</span>${s.from ? `<s class="num">${s.from}</s>` : ''}<span class="spacer"></span>${lvChip(s.level)}</div>
            <b>${esc(evTitle(ev))}</b>
            ${s.from ? `<span class="qline">${t('today.shifted', { from: s.from, to: s.time, p: L(s.prayer) })}</span>` : ''}
            <span class="meta">${s.pfs.map(pfName).join(' · ')}${s.cadence === 'daily' ? ' · ' + t('cal.daily') : ''}</span>
            <span class="chip ${paused ? 'crit' : s.status === 'held' ? 'warn' : 'ok'}">${paused ? t('cal.paused') : s.status === 'held' ? t('cal.held') : t('cal.scheduled')}</span></div>`; }).join('') || `<p class="meta">${t('cal.empty')}</p>`}
        </section>`; }).join('')}</div>`;
  };

  V.inbox = () => {
    const f = S.inboxFilter, list = S.inbox.filter(m => f === 'all' || m.status === f), sel = S.inbox.find(m => m.id === S.selInbox) || list[0];
    const pfx = m => `${pfName(m.pf)} · ${ago(m.mins)}`;
    return `<div class="row"><div class="seg" role="group">${[['all', 'in.all'], ['open', 'in.open'], ['escalated', 'in.escalated'], ['replied', 'in.replied']].map(([v, k]) => `<button data-a="inboxFilter" data-v="${v}" aria-pressed="${f === v}">${t(k)}</button>`).join('')}</div></div>
    ${inboxStrip()}
    <div class="note">${ic('shield')}<span>${t('in.privacy')}</span></div>
    <div class="grid g-list">
      <div class="stack">${list.map(m => `<button class="qitem" data-a="selInbox" data-v="${m.id}" aria-current="${sel && m.id === sel.id}">
        <div class="row"><span class="chip ${m.intent === 'complaint' ? 'crit' : m.intent === 'ruling' || m.intent === 'rumor' ? 'warn' : 'soft'}">${t('intent.' + m.intent)}</span><span class="meta">${pfx(m)}</span><span class="spacer"></span>${m.status !== 'open' ? `<span class="chip ok">${t(m.status === 'replied' ? 'in.statusReplied' : 'in.statusEscalated')}</span>` : ''}</div>
        <b${langAttr(m.lang)}>${esc(m.text)}</b><span class="meta"><bdi dir="ltr">${esc(m.who)}</bdi> · ${langName(m.lang)}</span></button>`).join('') || `<p class="empty">${t('radar.empty')}</p>`}</div>
      ${sel ? `<div class="card stack" style="gap:16px">
        <div class="row"><span class="chip">${t('intent.' + sel.intent)}</span><span class="chip ${sel.mood === 'neg' ? 'crit' : sel.mood === 'pos' ? 'ok' : ''}">${t('mood.' + sel.mood)}</span><span class="chip soft">${t('flag.' + sel.flag)}</span><span class="spacer"></span><span class="meta">${pfx(sel)}</span></div>
        <div class="stack"><span class="meta">${t('in.original')} · <bdi dir="ltr">${esc(sel.who)}</bdi></span><div class="bubble"${langAttr(sel.lang)}>${esc(sel.text)}</div>
          ${sel.tr && sel.tr[S.lang] ? `<span class="meta">${t('in.translation')}</span><div class="bubble"${langAttr(S.lang)}>${esc(sel.tr[S.lang])}</div>` : ''}</div>
        <label class="f">${t('in.suggested')}<textarea class="inp"${langAttr(sel.lang)} id="replyText" data-in="reply" data-k="${sel.id}">${esc(sel.edit ?? sel.reply)}</textarea></label>
        <div class="note">${ic('community')}<span><b>${t('in.why')}:</b> ${esc(L(sel.note))}</span></div>
        ${sel.status === 'open' ? `<div class="row"><button class="btn pri" data-a="sendReply">${ic('send')}${t('in.send')}</button><button class="btn ghost" data-a="escalate">${t('in.escalate')}</button><button class="btn quiet" data-a="handoff">${t('in.handoff')}</button></div>`
          : `<p class="note">${ic('check')}<span>${t(sel.status === 'replied' ? 'in.statusReplied' : 'in.statusEscalated')}</span></p>`}
      </div>` : ''}
    </div>`;
  };

  function spark(vals) {
    const w = 160, h = 40, p = 4, mn = Math.min(...vals), mx = Math.max(...vals);
    const x = i => p + i * (w - 2 * p) / (vals.length - 1), y = v => h - p - (v - mn) / (mx - mn || 1) * (h - 2 * p);
    const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><polygon points="${x(0)},${h} ${pts} ${x(vals.length - 1)},${h}" fill="var(--soft)"/><polyline points="${pts}" fill="none" stroke="var(--pri)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(vals.length - 1)}" cy="${y(vals[vals.length - 1])}" r="3.2" fill="var(--pri)"/></svg>`;
  }
  function chart(vals, { min, max, step, target, bars, fmtV = v => v }) {
    const w = 560, h = 230, l = 40, r = 14, tp = 14, b = 30, iw = w - l - r, ih = h - tp - b;
    const y = v => tp + ih - (v - min) / (max - min) * ih, n = vals.length, bw = iw / n;
    const x = i => (bars ? l + bw * i + bw / 2 : l + i * iw / (n - 1));
    let g = '';
    for (let v = min; v <= max + 1e-9; v += step) g += `<line x1="${l}" x2="${w - r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${l - 8}" y="${y(v) + 4}" text-anchor="end">${fmtV(+v.toFixed(2))}</text>`;
    const labels = vals.map((_, i) => `<text x="${x(i)}" y="${h - 8}" text-anchor="middle">${t('an.week', { n: i + 1 })}</text>`).join('');
    const tl = target != null ? `<line x1="${l}" x2="${w - r}" y1="${y(target)}" y2="${y(target)}" stroke="var(--warn)" stroke-dasharray="5 4" stroke-width="1.5"/>` : '';
    let marks;
    if (bars) marks = vals.map((v, i) => `<rect x="${(x(i) - bw * 0.32).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${(tp + ih - y(v)).toFixed(1)}" rx="5" fill="${i === n - 1 ? 'var(--pri)' : 'var(--soft)'}" stroke="var(--pri)" stroke-opacity=".35"/>`).join('');
    else { const pts = vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '); marks = `<polygon points="${x(0)},${tp + ih} ${pts} ${x(n - 1)},${tp + ih}" fill="var(--soft)" opacity=".8"/><polyline points="${pts}" fill="none" stroke="var(--pri)" stroke-width="2.5" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${i === n - 1 ? 5 : 3}" fill="${i === n - 1 ? 'var(--pri)' : 'var(--surface)'}" stroke="var(--pri)" stroke-width="2"/>`).join('')}`; }
    return `<svg viewBox="0 0 ${w} ${h}" dir="ltr" role="img">${g}${tl}${marks}${labels}</svg>`;
  }
  V.analytics = () => {
    const k = id => KPIS.find(x => x.id === id);
    return `<div class="note warn">${ic('alert')}<span>${t('an.integrity')}</span></div>
    <div class="kpis">${KPIS.map(x => `<div class="kpi"><span class="l">${L(x)}</span><span class="v">${x.v}${typeof x.unit === 'string' ? x.unit : L(x.unit)}</span>${spark(x.series)}
      <span class="meta">${t('an.target')}: <span class="num">${typeof x.target === 'string' ? x.target : L(x.target)}</span></span><span class="meta">${t('an.source')}: ${L(x.src)}</span></div>`).join('')}</div>
    <div class="grid g2">
      <div class="card chart"><div class="card-h"><h2>${t('an.eng')}</h2><span class="chip">${t('sample')}</span></div>${chart(k('eng').series, { min: 1.5, max: 4, step: 0.5, target: 3 })}<p class="meta">${t('an.weeks')} · ${t('an.target')}: ${k('eng').target}</p></div>
      <div class="card chart"><div class="card-h"><h2>${t('an.tat')}</h2><span class="chip">${t('sample')}</span></div>${chart(k('tat').series, { min: 0, max: 200, step: 50, target: 60, bars: true })}<p class="meta">${t('an.weeks')} · ${t('an.target')}: ${L(k('tat').target)}</p></div>
    </div>
    <div class="grid g2">
      <div class="card"><div class="card-h"><h2>${t('ab.title')}</h2><span class="chip">${t('sample')}</span></div><p style="margin-bottom:12px">${t('ab.name')}</p>
        ${[['ab.a', AB.a, AB.a >= AB.b], ['ab.b', AB.b, AB.b > AB.a]].map(([k, v, win]) => `<div class="stack" style="gap:4px;margin-bottom:10px"><div class="row"><span>${t(k)}</span><span class="spacer"></span><b class="num">${v}%</b></div><div style="height:10px;border-radius:99px;background:var(--raise);border:1px solid var(--line);overflow:hidden"><div style="height:100%;width:${(v / 5 * 100).toFixed(0)}%;background:${win ? 'var(--pri)' : 'var(--muted)'};border-radius:99px"></div></div></div>`).join('')}
        <p class="note">${ic('reports')}<span>${t('ab.rec')}</span></p></div>
      <div class="card"><div class="card-h"><h2>${t('an.platforms')}</h2></div><div class="list">${['instagram', 'linkedin', 'x', 'tiktok'].map(p => `<div class="li"><div class="grow"><b>${pfName(p)}</b><span class="meta">${t('an.pf.' + p)}</span></div>${connChip(connOf(p))}</div>`).join('')}</div></div>
    </div>`;
  };

  V.ledger = () => {
    const q = S.ledgerQ.trim().toLowerCase();
    const rows = S.ledger.filter(r => (S.ledgerPf === 'all' || r.pf === S.ledgerPf) && (!q || (r.text || '').toLowerCase().includes(q) || evTitle(EV[r.ev] || r.evObj).toLowerCase().includes(q)));
    const by = r => r.by === 'auto' ? t('lg.auto') : esc(L(member(r.by)));
    return `<div class="row"><div class="seg" role="group"><button data-a="ledgerTab" data-v="posts" aria-pressed="${S.ledgerTab === 'posts'}">${t('lg.posts')}</button><button data-a="ledgerTab" data-v="audit" aria-pressed="${S.ledgerTab === 'audit'}">${t('lg.audit')}</button></div>
      <span class="spacer"></span>${S.ledgerTab === 'posts' ? `<input class="inp" style="max-width:260px" id="lgQ" data-in="ledgerQ" value="${esc(S.ledgerQ)}" placeholder="${esc(t('lg.search'))}" aria-label="${esc(t('lg.search'))}">
      <select class="inp" style="max-width:180px" id="lgPf" data-ch="ledgerPf" aria-label="${esc(t('lg.platform'))}"><option value="all">${t('lg.allPf')}</option>${Object.keys(PLATFORMS).map(p => `<option value="${p}" ${S.ledgerPf === p ? 'selected' : ''}>${pfName(p)}</option>`).join('')}</select>` : ''}</div>
    <p class="meta">${t('lg.retention')}</p>
    ${S.ledgerTab === 'posts' ? `<div class="tbl-wrap"><table><thead><tr><th></th><th>${t('lg.when')}</th><th>${t('lg.platform')}</th><th>${t('lg.lang')}</th><th>${t('lg.text')}</th><th>${t('lg.level')}</th><th>${t('lg.by')}</th><th>${t('lg.mode')}</th></tr></thead><tbody>
      ${rows.map(r => { const ev = EV[r.ev] || r.evObj; return `<tr><td>${media(ev, 'thumb')}</td><td class="num" style="white-space:nowrap">${stamp(r.at)}</td><td>${pfName(r.pf)}</td><td>${langName(r.lang)}</td><td><div class="clamp"${langAttr(r.lang)}>${esc(r.text)}</div></td><td>${lvChip(r.level)}</td><td>${by(r)}</td>
        <td><span class="chip ${r.mode === 'live' ? 'ok' : r.mode === 'preview' ? 'info' : ''}">${t('mode.' + r.mode)}</span></td></tr>`; }).join('') || `<tr><td colspan="8" class="empty">${t('lg.empty')}</td></tr>`}</tbody></table></div>`
    : `<div class="tbl-wrap"><table><thead><tr><th>${t('lg.when')}</th><th>${t('lg.action')}</th><th>${t('lg.item')}</th><th>${t('lg.level')}</th><th>${t('lg.by')}</th></tr></thead><tbody>
      ${S.audit.map(a => `<tr><td class="num" style="white-space:nowrap">${stamp(a.at)}</td><td>${t('act.' + a.act)}</td><td>${a.ev ? esc(evTitle(EV[a.ev] || a.evObj)) : esc(a.note ? L(a.note) : '')}</td><td>${a.level ? lvChip(a.level) : ''}</td><td>${a.by === 'auto' ? t('lg.auto') : esc(L(member(a.by)) || '')}</td></tr>`).join('')}</tbody></table></div>`}`;
  };

  V.team = () => {
    const termBox = kind => `<div class="stack"><span class="meta">${t(kind === 'sensitive' ? 'tm.rulesSensitive' : 'tm.rulesMedium')}</span>
      <div class="terms">${S.terms[kind].map((x, i) => `<span class="term ${x.src === 'new' ? 'new' : ''}" ${x.src === 'new' ? `title="${esc(t('tm.newMark'))}"` : ''}>${esc(x.t)}<button data-a="rmTerm" data-k="${kind}" data-v="${i}" aria-label="${esc(t('tm.remove', { t: x.t }))}">${ic('x')}</button></span>`).join('')}</div>
      <div class="row"><input class="inp" style="max-width:220px" id="term-${kind}" data-enter="addTerm" data-k="${kind}" placeholder="${esc(t('tm.termPh'))}" aria-label="${esc(t('tm.addTerm'))}"><button class="btn ghost sm" data-a="addTerm" data-k="${kind}">${t('tm.addTerm')}</button></div></div>`;
    const g = S.testText.trim() ? classify(S.testText, '') : null;
    const matrix = [['low', 'tm.case.low', ['editor'], SLA.low], ['medium', 'tm.case.medium', ['editor', 'manager'], SLA.medium], ['sensitive', 'tm.case.religious', ['editor', 'manager', 'specialist'], SLA.religious], ['sensitive', 'tm.case.crisis', ['manager', 'ops'], SLA.crisis]];
    return `<div class="grid g2">
      <div class="card"><div class="card-h"><h2>${t('tm.members')}</h2><span class="chip">${t('tm.illustrative')}</span></div>
        <div class="list">${Object.keys(MEMBERS).map(k => { const m = MEMBERS[k]; return `<div class="li"><span class="av">${L(m.ini)}</span><div class="grow"><b>${esc(L(m))}</b><span class="meta">${L(m.role)}</span></div><span class="meta num">${t('tm.load', { n: m.load })}</span></div>`; }).join('')}</div></div>
      <div class="card"><div class="card-h"><h2>${t('tm.matrix')}</h2></div>
        <div class="tbl-wrap"><table style="min-width:0"><thead><tr><th>${t('tm.level')}</th><th>${t('tm.path')}</th><th>${t('tm.sla')}</th></tr></thead><tbody>
          ${matrix.map(([lv, k, roles, sla]) => `<tr><td><div class="stack" style="gap:6px">${lvChip(lv)}<span>${t(k)}</span></div></td><td>${roles.length ? roles.map(r => L(ROLE_NAME[r])).join(S.lang === 'ar' ? ' ← ' : ' → ') : t('studio.chainAuto')}</td><td class="num">${sla ? t('tm.minutes', { n: sla }) : '—'}</td></tr>`).join('')}</tbody></table></div>
        <p class="meta" style="margin-top:10px">${t('tm.slaNote')}</p></div>
    </div>
    <div class="card stack" style="gap:18px"><div class="card-h" style="margin:0"><h2>${t('tm.rules')}</h2><span class="chip soft">${t('tm.newMark')}</span></div>
      ${termBox('sensitive')}${termBox('medium')}
      <p class="note">${ic('eye')}<span>${t('tm.rulesNote')}</span></p>
      <label class="f">${t('tm.test')}<textarea class="inp" id="testIn" data-in="test" placeholder="${esc(t('tm.testPh'))}">${esc(S.testText)}</textarea></label>
      <div id="testOut">${g ? `<div class="row">${lvChip(g.level)}<span>${esc(reasonText(g))}</span></div>` : ''}</div></div>
    <div class="grid g2">
      <div class="card"><div class="card-h"><h2>${t('tm.sources')}</h2></div>
        <div class="list">${S.sources.map(s => `<div class="li"><div class="grow"><b>${esc(L(s))}</b></div>${trustChip(s.trust)}</div>`).join('')}</div>
        <div class="row" style="margin-top:12px"><input class="inp" style="flex:1 1 200px" id="srcName" placeholder="${esc(t('tm.sourceName'))}" aria-label="${esc(t('tm.sourceName'))}">
          <select class="inp" style="max-width:170px" id="srcTrust" aria-label="${esc(t('tm.sourceTrust'))}">${['official', 'partner', 'unverified'].map(x => `<option value="${x}">${t('trust.' + x)}</option>`).join('')}</select><button class="btn ghost sm" data-a="addSource">${t('tm.addSource')}</button></div></div>
      <div class="card"><div class="card-h"><h2>${t('tm.accounts')}</h2></div>
        <div class="list">${Object.keys(PLATFORMS).map(p => `<div class="li"><div class="grow"><b>${pfName(p)}</b><span class="meta">${ACCOUNTS[p] ? `<a href="${ACCOUNTS[p].url}" target="_blank" rel="noopener" dir="ltr">${ACCOUNTS[p].handle}</a> · ${esc(ACCOUNTS[p].name)}` : t('tm.agencyAccount')}</span></div>${connChip(connOf(p))}</div>`).join('')}</div></div>
    </div>
    <div class="grid g3">
      <div class="card stack"><h2>${t('tm.security')}</h2>${['tm.sec1', 'tm.sec2', 'tm.sec3', 'tm.sec4'].map(k => `<div class="check">${ic('check')}<span>${t(k)}</span></div>`).join('')}<p class="meta">${t('tm.secRef')}</p></div>
      <div class="card stack"><h2>${t('tm.imagery')}</h2>${['tm.img1', 'tm.img2', 'tm.img3', 'tm.img4'].map(k => `<div class="check">${ic('check')}<span>${t(k)}</span></div>`).join('')}</div>
      <div class="card stack"><h2>${t('tm.languages')}</h2><p class="meta">${t('tm.uiLangs')}</p><span class="meta">${t('tm.langActive')}</span><div class="row">${Object.keys(LANGS).map(l => `<span class="chip ok">${langName(l)}</span>`).join('')}</div>
        <span class="meta">${t('tm.langNext')}</span><div class="row">${NEXT_LANGS.map(l => `<span class="chip">${L(l)}</span>`).join('')}</div></div>
    </div>`;
  };

  V.library = () => `
    <div class="grid g2">
      <div class="card stack" style="gap:16px"><div class="card-h" style="margin:0"><h2>${t('br.book')}</h2><span class="chip soft">${t('br.readBy')}</span></div>
        <span class="eyebrow">${t('br.voice')}</span>${BRAND.voice.map(v => `<div class="check">${ic('check')}<span>${L(v)}</span></div>`).join('')}
        <span class="eyebrow">${t('br.colors')}</span>
        <div class="row">${[['#0B1D2D', t('col.navy')], ['#0F766E', t('col.teal')], ['#22C55E', t('col.emerald')], ['#C7D9CF', t('col.sage')], ['#F1F5F3', t('col.mist')]].map(([h, n]) => `<span class="chip"><span class="sw" style="width:16px;height:16px;background:${h}"></span>${n} ${h}</span>`).join('')}</div></div>
      <div class="card stack" style="gap:12px"><div class="card-h" style="margin:0"><h2>${t('br.never')}</h2></div>
        ${BRAND.never.map(v => `<div class="check" style="color:var(--crit)">${ic('x')}<span style="color:var(--ink)">${L(v)}</span></div>`).join('')}
        <hr class="sep"><span class="eyebrow">${t('tm.imagery')}</span>${['tm.img1', 'tm.img2', 'tm.img3', 'tm.img4'].map(k => `<div class="check">${ic('check')}<span>${t(k)}</span></div>`).join('')}</div>
    </div>
    <div class="card"><div class="card-h"><h2>${t('br.assets')}</h2><small>${t('ai.label')}</small></div>
      <div class="assets">${EVENTS.map(e => `<figure class="asset" style="margin:0">${e.img ? `<img class="ph" src="${e.img}" alt="${esc(L(e.alt))}" loading="lazy">` : `<div class="libph">${ic('image')}<small>${t('br.realNeeded')}</small></div>`}
          <figcaption class="meta">${esc(evTitle(e))}</figcaption><span class="chip ${e.img ? 'soft' : 'warn'}">${e.img ? t('ai.label') : t('lib.label')}</span></figure>`).join('')}
        ${EVENTS.filter(e => e.video).map(e => `<figure class="asset" style="margin:0"><video src="${e.video}" poster="${e.video.replace('.mp4', '-poster.jpg')}" controls muted playsinline loop preload="metadata" aria-label="${esc(t('ai.video'))}"></video><figcaption class="meta">${esc(evTitle(e))}</figcaption><span class="chip soft">${t('ai.video')}</span></figure>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h2>${t('br.templates')}</h2></div>
      <div class="grid g3">${[['br.tplClar', t('corr.draft')], ['br.tplCrisis', L(EV.heat.ar && { ar: EV.heat.ar.short, en: EV.heat.en.short })], ['br.tplService', L({ ar: EV.shuttle.ar.short, en: EV.shuttle.en.short })]].map(([k, body]) => `<div class="pv"><b>${t(k)}</b><div class="quote">${esc(body)}</div></div>`).join('')}</div></div>`;

  V.notes = () => `
    <div class="grid g2">
      <div class="card stack"><h2>${t('nt.phases')}</h2>${PHASES.map((p, i) => `<div class="sline ${i === 0 ? 'current' : ''}"><span class="av num">${i + 1}</span><div class="grow"><b>${L(p.n)}</b><div class="meta">${L(p.d)}</div></div></div>`).join('')}</div>
      <div class="card stack"><h2>${t('today.agents')}</h2><p>${t('nt.sdk')}</p>
        <div class="row">${Object.keys(STAGES).map(sg => `<span class="chip">${L(STAGES[sg])} · <span class="num">${AGENTS.filter(a => a.stage === sg && a.kind !== 'layer').length}</span></span>`).join('')}</div></div>
    </div>
    <div class="card"><div class="card-h"><h2>${t('nt.gaps')}</h2></div>
      <div class="tbl-wrap"><table><thead><tr><th>${t('nt.feature')}</th><th>${t('nt.before')}</th><th>${t('nt.after')}</th></tr></thead><tbody>
        ${GAPS.map(g => `<tr><td><b>${L(g.f)}</b></td><td>${L(g.b)}</td><td>${L(g.a)}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="card-h"><h2>${t('nt.practices')}</h2></div>
      <div class="grid g2" style="gap:14px">${PRACTICES.map(p => `<article class="pv"><div class="pv-h"><b>${L(p.n)}</b><span class="chip ${p.s === 'adopted' ? 'ok' : ''}">${t(p.s === 'adopted' ? 'nt.adopted' : 'nt.roadmap')}</span></div>
        <p>${L(p.d)}</p><span class="meta">${L(p.by)}${p.sec ? ' · ' + t('nt.secondary') : ''}</span><span class="meta">${t('nt.where')}: ${L(p.w)}</span>
        <a href="${p.url}" target="_blank" rel="noopener" class="meta" dir="ltr" style="overflow-wrap:anywhere">${esc(p.url.replace(/^https?:\/\//, '').slice(0, 64))}${p.url.length > 72 ? '…' : ''}</a></article>`).join('')}</div></div>
    <div class="grid g2">
      <div class="card stack"><h2>${t('nt.remaining')}</h2>${REMAINING.map(r => `<div class="check">${ic('arrow')}<span>${L(r)}</span></div>`).join('')}</div>
      <div class="card stack"><h2>${t('nt.team')}</h2>${BUILD_TEAM.map(b => `<div class="li"><span class="chip soft" dir="ltr">${b.m}</span><span class="grow">${L(b.r)}</span></div>`).join('')}</div>
    </div>`;

  /* ---------------- render ---------------- */
  function render() {
    applyPrefs(); renderRail(); renderTop(); renderPop();
    $('#view').innerHTML = V[S.view]();
  }
  let toastT;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 3200); }
  const log = (act, extra) => S.audit.unshift({ at: Date.now(), act, ...extra });
  function go(v) { if (location.hash !== '#' + v) location.hash = v; else route(); }
  function route() { const v = location.hash.slice(1); S.view = VIEWS.includes(v) ? v : 'today'; S.pop = false; render(); window.scrollTo(0, 0); }

  /* ---------------- studio run ---------------- */
  const DUR = { orchestrator: 420, monitor: 420, strategy: 820, writing: 980, localize: 640, hashtags: 420, design: 760, video: 620, review: 700, factcheck: 760, gate: 460, publishing: 760, reports: 620 };
  const paintPipe = () => { const el = $('#pipe'); if (el && S.view === 'studio') el.innerHTML = pipeHtml(); };
  async function run() {
    const st = S.studio; if (st.running) return;
    const ev = studioEvent(), src = S.sources.find(s => s.id === ev.src), verified = !!src && src.trust !== 'unverified';
    st.running = true; st.result = null; st.outcome = null; st.edits = {}; st.alt = null;
    st.steps = PIPE_PLAN.map(id => ({ id, status: 'wait', out: null }));
    st.tab = st.langs.includes(S.lang) ? S.lang : st.langs[0];
    render();
    const g = classifyEv(ev), langs = st.langs, pfs = st.platforms, restricted = restrictedOf(ev);
    for (const s of st.steps) {
      s.status = 'run'; paintPipe(); await sleep(DUR[s.id]);
      let status = 'done';
      const sepL = () => (S.lang === 'ar' ? '، ' : ', ');
      switch (s.id) {
        case 'orchestrator': s.out = () => t('out.orchestrator', { p: pfs.length, l: langs.length, n: pfs.length * langs.length }); break;
        case 'monitor':
          if (!verified) { status = 'block'; s.out = () => t('out.researchBlock'); }
          else s.out = () => (ev.id === 'free' ? t('out.monitorFree') + ' · ' : t('out.monitor', { src: L(SRC[ev.src]), when: L(ev.when) }) + ' · ') + t('trust.' + src.trust);
          break;
        case 'strategy': s.out = () => L(PLAYBOOK[ev.cat].strategy); break;
        case 'writing': s.out = () => t('out.stylist', { list: pfs.map(pfName).join(sepL()) }) + (restricted ? t('out.stylistRestricted') : ''); break;
        case 'localize': s.out = () => t('out.localize', { langs: langs.filter(l => ev[l]).map(langName).join(sepL()) }) + (langs.some(l => !ev[l]) ? ' · ' + t('studio.translateLater') : ''); break;
        case 'hashtags': s.out = () => t('out.hashtags', { tags: [...new Set(langs.flatMap(l => tagsFor(ev, l)))].join(' ') }); break;
        case 'design': s.out = () => (ev.img ? t('out.imageAi') : ev.id === 'free' ? t('out.imageFree') : t('out.imageLib')); if (!ev.img && ev.id !== 'free') status = 'escalate'; break;
        case 'video': s.out = () => t('out.video') + (ev.video ? t('out.videoClip') : ''); break;
        case 'review': s.out = () => t('out.review'); break;
        case 'factcheck': status = ev.cat === 'religious' ? 'escalate' : 'done'; s.out = () => L(FACT[ev.cat === 'religious' ? 'religious' : ev.cat === 'crisis' ? 'crisis' : 'ok']); break;
        case 'gate': s.out = () => `${t('lv.' + g.level)} · ${reasonText(g)} · ${t('lvd.' + g.level)}`; status = 'escalate'; break;
      }
      s.status = status; paintPipe();
      if (status === 'block') { st.running = false; st.result = { ev, blocked: 'source' }; render(); return; }
    }
    st.running = false; st.result = { ev, g, chain: chainFor(g.level, ev.cat) }; render();
  }
  const textFor = (ev, p, l) => S.studio.edits[p + '|' + l] ?? variant(ev, l, p, S.studio.tone);
  async function publishFromStudio() {
    const st = S.studio, r = st.result, ev = r.ev;
    st.running = true;
    const more = PIPE_PUBLISH.map(id => ({ id, status: 'wait', out: null })); st.steps.push(...more); render();
    let ok = 0, draft = 0; const at = Date.now();
    for (const s of more) {
      s.status = 'run'; paintPipe(); await sleep(DUR[s.id]);
      if (s.id === 'publishing') {
        for (const p of st.platforms) for (const l of st.langs) { const txt = textFor(ev, p, l); if (txt == null) continue; const conn = connOf(p); const mode = conn === 'connected' ? 'preview' : 'draft'; mode === 'preview' ? ok++ : draft++;
          S.ledger.unshift({ id: uid(), at, pf: p, lang: l, ev: ev.id === 'free' ? null : ev.id, evObj: ev, text: txt, mode, level: r.g.level, by: 'reem', img: ev.img }); }
        s.out = () => t('out.publishing', { ok, draft });
      } else s.out = () => t('out.reports', { lesson: L(PLAYBOOK[ev.cat].lesson) });
      s.status = 'done'; paintPipe();
    }
    log('published', { ev: ev.id === 'free' ? null : ev.id, evObj: ev, level: r.g.level, by: 'reem' });
    st.running = false; st.outcome = t('studio.done.published'); render(); toast(t('studio.done.published'));
  }

  /* ---------------- actions ---------------- */
  const A = {
    go: d => go(d.v),
    crisis: () => { S.crisis = !S.crisis; log(S.crisis ? 'crisis_on' : 'crisis_off', { by: 'khalid' }); render(); toast(t(S.crisis ? 'toast.crisisOn' : 'toast.crisisOff')); },
    pop: () => { S.pop = !S.pop; renderTop(); renderPop(); if (S.pop) $('#pop button[aria-pressed="true"]')?.focus(); },
    lang: () => { S.lang = S.lang === 'ar' ? 'en' : 'ar'; savePrefs(); render(); },
    setlang: d => { S.lang = d.v; savePrefs(); render(); },
    mode: d => { S.mode = d.v; savePrefs(); applyPrefs(); renderPop(); },
    palette: d => { S.palette = d.v; savePrefs(); applyPrefs(); renderPop(); },
    radarFilter: d => { S.radarFilter = d.v; render(); },
    dismiss: d => { S.dismissed.add(d.v); render(); toast(t('toast.dismissed')); },
    verify: () => { log('verify', { ev: 'rumor', level: 'low', by: 'fahad' }); toast(t('toast.verifyReq')); },
    corr: () => { S.corrOpen = !S.corrOpen; render(); },
    compose: d => { Object.assign(S.studio, { mode: 'library', eventId: d.v, result: null, steps: [], outcome: null }); go('studio'); },
    smode: d => { S.studio.mode = d.v; S.studio.result = null; S.studio.steps = []; render(); },
    pickEvent: d => { Object.assign(S.studio, { eventId: d.v, result: null, steps: [], outcome: null }); render(); },
    togglePf: d => { const a = S.studio.platforms, i = a.indexOf(d.v); i < 0 ? a.push(d.v) : a.splice(i, 1); render(); },
    toggleLang: d => { const a = S.studio.langs, i = a.indexOf(d.v); i < 0 ? a.push(d.v) : a.splice(i, 1); render(); },
    tone: d => { S.studio.tone = d.v; S.studio.edits = {}; render(); },
    tab: d => { S.studio.tab = d.v; render(); },
    run: () => run(),
    libPick: () => toast(t('lib.picked')),
    publish: () => { const r = S.studio.result; log('approved', { ev: r.ev.id === 'free' ? null : r.ev.id, evObj: r.ev, level: r.g.level, by: 'reem' }); publishFromStudio(); },
    schedule: () => {
      const r = S.studio.result, ev = r.ev, now = nowMin(), base = BEST[ev.cat] === 'now' ? now : toMin(BEST[ev.cat]), m = safeSlot(base);
      const day = m < now ? 1 : 0, time = hhmm(m);
      let evId = ev.id; if (ev.id === 'free') { evId = 'free-' + uid(); EV[evId] = { ...ev, id: evId }; }
      S.schedule.push({ id: uid(), day, time, from: m !== base ? hhmm(base) : null, prayer: m !== base ? quietAt(base) : null, ev: evId, status: 'scheduled', cadence: 'once', pfs: [...S.studio.platforms], level: r.g.level });
      log('approved', { ev: ev.id === 'free' ? null : ev.id, evObj: ev, level: r.g.level, by: 'reem' });
      log('scheduled', { ev: ev.id === 'free' ? null : ev.id, evObj: ev, level: r.g.level, by: 'reem' });
      S.studio.outcome = t('studio.done.scheduled', { t: time }); render(); toast(S.studio.outcome);
    },
    submit: () => {
      const st = S.studio, r = st.result, ev = r.ev, id = uid();
      if (ev.id === 'free') EV['free-' + id] = { ...ev, id: 'free-' + id };
      const evId = ev.id === 'free' ? 'free-' + id : ev.id;
      const texts = {}; for (const p of st.platforms) for (const l of st.langs) { const x = textFor(ev, p, l); if (x != null) texts[p + '|' + l] = x; }
      S.approvals.unshift({ id, ev: evId, texts, g: r.g, sla: slaFor(r.g.level, ev.cat), at: Date.now(), status: 'pending', pfs: [...st.platforms], langs: st.langs.filter(l => ev[l]), chain: r.chain.map((ro, i) => ({ role: ro, status: i ? 'waiting' : 'current', at: null })) });
      S.selApproval = id; log('submitted', { ev: evId, level: r.g.level, by: 'reem' });
      st.outcome = t('studio.done.submitted'); render(); toast(st.outcome);
    },
    openApproval: d => { S.selApproval = d.v; S.rejecting = false; go('approvals'); },
    selApproval: d => { S.selApproval = d.v; S.rejecting = false; render(); },
    approve: () => {
      { const x = S.approvals.find(y => y.id === S.selApproval); if (S.crisis && x && EV[x.ev].cat !== 'crisis') { toast(t('studio.blocked.crisis')); return; } }
      const a = S.approvals.find(x => x.id === S.selApproval), i = a.chain.findIndex(c => c.status === 'current'); if (i < 0) return;
      a.chain[i].status = 'done'; a.chain[i].at = Date.now(); const who = ROLE_OF[a.chain[i].role];
      if (a.chain[i + 1]) { a.chain[i + 1].status = 'current'; log('step', { ev: a.ev, level: a.g.level, by: who }); render(); toast(t('toast.approvedStep', { r: L(ROLE_NAME[a.chain[i + 1].role]) })); return; }
      a.status = 'approved'; const ev = EV[a.ev];
      for (const p of a.pfs) for (const l of a.langs) { const txt = (a.texts && a.texts[p + '|' + l]) ?? variant(ev, l, p); if (txt) S.ledger.unshift({ id: uid(), at: Date.now(), pf: p, lang: l, ev: a.ev, text: txt, mode: connOf(p) === 'connected' ? 'preview' : 'draft', level: a.g.level, by: who, img: ev.img }); }
      log('approved', { ev: a.ev, level: a.g.level, by: who }); render(); toast(t('toast.approvedAll'));
    },
    reject: () => { S.rejecting = true; render(); $('#rejReason')?.focus(); },
    cancelReject: () => { S.rejecting = false; render(); },
    confirmReject: () => {
      const v = ($('#rejReason')?.value || '').trim(); if (!v) { toast(t('toast.needReason')); $('#rejReason')?.focus(); return; }
      const a = S.approvals.find(x => x.id === S.selApproval), cur = a.chain.find(c => c.status === 'current');
      a.status = 'rejected'; a.reason = v; S.rejecting = false; log('rejected', { ev: a.ev, level: a.g.level, by: ROLE_OF[cur.role] }); render(); toast(t('toast.rejected'));
    },
    inboxFilter: d => { S.inboxFilter = d.v; render(); },
    selInbox: d => { S.selInbox = d.v; render(); },
    sendReply: () => { const m = S.inbox.find(x => x.id === S.selInbox); m.status = 'replied'; log('reply', { note: { ar: m.who, en: m.who }, by: 'fahad' }); render(); toast(t('toast.sent')); },
    escalate: () => { const m = S.inbox.find(x => x.id === S.selInbox); m.status = 'escalated'; log('escalated', { note: { ar: m.who, en: m.who }, by: 'fahad' }); render(); toast(t('toast.escalated')); },
    handoff: () => { const m = S.inbox.find(x => x.id === S.selInbox); m.status = 'escalated'; log('escalated', { note: { ar: m.who + ' · 1966', en: m.who + ' · 1966' }, by: 'fahad' }); render(); toast(t('toast.handoff')); },
    ledgerTab: d => { S.ledgerTab = d.v; render(); },
    rmTerm: d => { const x = S.terms[d.k].splice(+d.v, 1)[0]; log('rule', { note: { ar: '− ' + x.t, en: '− ' + x.t }, by: 'khalid' }); render(); toast(t('toast.termRemoved')); },
    addTerm: d => { const el = $('#term-' + d.k), v = (el?.value || '').trim(); if (!v) { el?.focus(); return; } S.terms[d.k].push({ t: v, src: 'new' }); log('rule', { note: { ar: '+ ' + v, en: '+ ' + v }, by: 'khalid' }); render(); toast(t('toast.termAdded')); $('#term-' + d.k)?.focus(); },
    addSource: () => { const n = ($('#srcName')?.value || '').trim(); if (!n) { $('#srcName')?.focus(); return; } S.sources.push({ id: 'u' + uid(), ar: n, en: n, trust: $('#srcTrust').value }); render(); toast(t('toast.sourceAdded')); },
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (!el) { if (S.pop && !e.target.closest('#pop')) { S.pop = false; renderTop(); renderPop(); } return; }
    if (el.disabled) return;
    const fn = A[el.dataset.a]; if (fn) { e.preventDefault(); fn(el.dataset, el); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && S.pop) { S.pop = false; renderTop(); renderPop(); $('[data-a="pop"]')?.focus(); }
    if (e.key === 'Enter' && e.target.dataset && e.target.dataset.enter) { e.preventDefault(); A[e.target.dataset.enter](e.target.dataset); }
  });
  document.addEventListener('input', e => {
    const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
    const st = S.studio;
    if (k === 'free.title' || k === 'free.details') { st.free[k.split('.')[1]] = el.value; const b = $('[data-a="run"]'); if (b) b.disabled = st.running || !st.free.title.trim() || !st.platforms.length || !st.langs.length; }
    else if (k === 'edit') { st.edits[el.dataset.k] = el.value; const p = el.dataset.k.split('|')[0], lim = PLATFORMS[p].limit, n = [...el.value].length, c = $('#cnt-' + p); if (c) { c.textContent = `${n} / ${lim}` + (n > lim ? ' · ' + t('studio.overLimit') : ''); c.classList.toggle('over', n > lim); } }
    else if (k === 'alt') st.alt = el.value;
    else if (k === 'reply') { const m = S.inbox.find(x => x.id === el.dataset.k); if (m) m.edit = el.value; }
    else if (k === 'ledgerQ') { S.ledgerQ = el.value; const pos = el.selectionStart; render(); const n = $('#lgQ'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }
    else if (k === 'test') { S.testText = el.value; const g = el.value.trim() ? classify(el.value, '') : null; $('#testOut').innerHTML = g ? `<div class="row">${lvChip(g.level)}<span>${esc(reasonText(g))}</span></div>` : ''; }
  });
  document.addEventListener('change', e => {
    const el = e.target, k = el.dataset && el.dataset.ch; if (!k) return;
    if (k.startsWith('free.')) { S.studio.free[k.split('.')[1]] = el.value; S.studio.result = null; }
    else if (k === 'ledgerPf') { S.ledgerPf = el.value; render(); }
  });
  const tipEl = document.createElement('div'); tipEl.className = 'tip'; tipEl.hidden = true; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl);
  document.addEventListener('pointerover', e => { const el = e.target.closest('[data-tip]'); if (!el) { tipEl.hidden = true; return; } tipEl.textContent = el.dataset.tip; tipEl.hidden = false; });
  document.addEventListener('pointermove', e => { if (tipEl.hidden) return; const w = tipEl.offsetWidth, h = tipEl.offsetHeight; tipEl.style.left = Math.min(innerWidth - w - 8, Math.max(8, e.clientX - w / 2)) + 'px'; tipEl.style.top = Math.max(8, e.clientY - h - 14) + 'px'; });
  document.addEventListener('pointerout', e => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-tip]')) tipEl.hidden = true; });
  window.addEventListener('hashchange', route);
  setInterval(() => { if (S.view === 'today' && !document.querySelector('#view :focus')) render(); }, 60000);

  loadPrefs(); seed(); route();
})();
