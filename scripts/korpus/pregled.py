"""
Pregled celog korpusa u pregledacu — stablo levo, tekst desno.

    python3 scripts/korpus/izvoz_csv.py     # prvo, da CSV bude svez
    python3 scripts/korpus/pregled.py       # pa otvori pregled.html

Cita transit-texts.csv — isti fajl koji ide u bazu, sa primenjenom lekturom,
pa je ovo tacno ono sto ce korisnik videti. HTML ide pored .docx fajlova, NE u
repo i NE na internet: u njemu je ceo korpus.
"""
import csv
import html
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from parse_docx import PLANETE, ASPEKTI, UGLOVI, NEMOGUCE

IZVOR = Path('/Users/ivankrstic/Desktop/Astroshop App/Tranziti AstroShop')
CSV = IZVOR / 'transit-texts.csv'
CILJ = IZVOR / 'pregled.html'
# Kratke verzije koje sam sazeo iz astrologovih dugih — NISU u bazi dok ih on ne odobri.
NACRTI = IZVOR / 'nacrti-kratkih.json'
# Lunarni kalendar — isti pregled, druga fascikla u stablu.
LUNARNI = Path('/Users/ivankrstic/Desktop/Astroshop App/Lunarni kalendar/lunar-texts.csv')
FAZE = [('new', 'Mlad mesec'), ('waxing', 'Rastući mesec'), ('first_quarter', 'Prva četvrt'),
        ('full', 'Pun mesec'), ('waning_gibbous', 'Opadajući (posle punog)'),
        ('last_quarter', 'Poslednja četvrt'), ('waning_crescent', 'Opadajući (pred mladi)')]
ZNAK_SR = {'aries': 'Ovan', 'taurus': 'Bik', 'gemini': 'Blizanci', 'cancer': 'Rak', 'leo': 'Lav',
           'virgo': 'Devica', 'libra': 'Vaga', 'scorpio': 'Škorpija', 'sagittarius': 'Strelac',
           'capricorn': 'Jarac', 'aquarius': 'Vodolija', 'pisces': 'Ribe'}
OBLAST_SR = [('ljubav', 'Ljubav i odnosi'), ('zdravlje', 'Zdravlje i lepota'),
             ('karijera', 'Karijera i finansije'), ('kuca', 'Kuća'), ('basta', 'Bašta')]

SR = {v: k.capitalize() for k, v in PLANETE.items()} | {'ascendant': 'Ascendent', 'midheaven': 'MC'}
SR_A = {v: k for k, v in ASPEKTI.items()}
TELA = list(PLANETE.values())
METE = TELA + list(UGLOVI.values())
ASP = ['conjunction', 'sextile', 'square', 'trine', 'opposition']


def main():
    tekstovi = {}
    for r in csv.DictReader(open(CSV, encoding='utf-8')):
        r['sections'] = json.loads(r['sections']) if r['sections'] else []
        tekstovi.setdefault(r['key'], {})[r['version']] = r

    nacrti = {x['key']: x for x in json.loads(NACRTI.read_text(encoding='utf-8'))} if NACRTI.exists() else {}
    # Nacrt je u CSV-u (i u bazi) dok ga astrologov tekst ne zameni — oznaka
    # ostaje dok je kratka verzija ista kao nacrt.
    for k, x in nacrti.items():
        s = tekstovi.get(k, {}).get('short')
        if s is None or s['body'].strip() == x['body'].strip():
            tekstovi.setdefault(k, {})['draft'] = s or {**x, 'sections': []}
            tekstovi[k].pop('short', None)

    stablo = []
    for t in TELA:
        aspekti = []
        for a in ASP:
            stavke = []
            for n in METE:
                if (t, a, n) in NEMOGUCE:
                    continue
                k = f'transit.{t}.{a}.natal.{n}'
                stavke.append({'key': k, 'name': f'{SR[t]} {SR_A[a]} {SR[n]}', 'meta': SR[n],
                               'short': 'short' in tekstovi.get(k, {}), 'long': 'long' in tekstovi.get(k, {}),
                               'draft': 'draft' in tekstovi.get(k, {})})
            aspekti.append({'name': SR_A[a], 'items': stavke})
        stablo.append({'name': SR[t], 'aspects': aspekti})

    if LUNARNI.exists():
        lun = {r['key']: r for r in csv.DictReader(open(LUNARNI, encoding='utf-8'))}
        for fk, fn in FAZE:
            znaci = []
            for zk, zn in ZNAK_SR.items():
                stavke = []
                for ok, on in OBLAST_SR:
                    k = f'lunar.{fk}.{zk}.{ok}'
                    if k in lun:
                        tekstovi[k] = {'lunar': {'title': '', 'body': lun[k]['body'], 'sections': []}}
                    stavke.append({'key': k, 'name': f'{fn} u znaku {zn} · {on}', 'meta': on,
                                   'short': False, 'long': False, 'draft': False, 'lunar': k in lun})
                znaci.append({'name': zn, 'items': stavke})
            stablo.append({'name': f'☾ {fn}', 'aspects': znaci, 'lunar': True})

    podaci = json.dumps({'tree': stablo, 'texts': tekstovi}, ensure_ascii=False).replace('</', '<\\/')
    CILJ.write_text(STRANA.replace('/*PODACI*/', podaci), encoding='utf-8')
    print(CILJ)


STRANA = r'''<!doctype html>
<html lang="sr-Latn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Korpus tumačenja</title>
<style>
  :root { --bg:#F6F7F8; --card:#fff; --text:#111; --muted:#6b6f76; --line:#e4e6e9; --accent:#4b3fa8; --soft:#efedfb; --miss:#b9bcc2; --mark:#fff1a8; }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.55 -apple-system, BlinkMacSystemFont, "SF Pro Text", Roboto, sans-serif; color:var(--text); background:var(--bg); }
  .app { display:grid; grid-template-columns:340px 1fr; height:100vh; }
  aside { background:var(--card); border-right:1px solid var(--line); display:flex; flex-direction:column; min-height:0; }
  .top { padding:14px 14px 10px; border-bottom:1px solid var(--line); }
  .top h1 { font-size:15px; margin:0 0 2px; }
  .stat { color:var(--muted); font-size:12px; margin-bottom:10px; }
  input[type=search] { width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:8px; font:inherit; background:var(--bg); }
  .filt { display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
  .filt button { border:1px solid var(--line); background:var(--card); border-radius:999px; padding:3px 10px; font:12px/1.4 inherit; cursor:pointer; color:var(--muted); }
  .filt button.on { background:var(--accent); color:#fff; border-color:var(--accent); }
  nav { overflow:auto; padding:6px 6px 40px; flex:1; }
  details { margin:0; }
  summary { cursor:pointer; list-style:none; padding:5px 8px; border-radius:6px; user-select:none; display:flex; align-items:center; gap:6px; }
  summary::-webkit-details-marker { display:none; }
  summary::before { content:"▸"; color:var(--muted); font-size:11px; width:10px; transition:transform .1s; }
  details[open] > summary::before { transform:rotate(90deg); }
  summary:hover { background:var(--bg); }
  .l1 > summary { font-weight:600; }
  .l2 { margin-left:14px; }
  .l2 > summary { color:#333; }
  .cnt { margin-left:auto; color:var(--muted); font-size:11px; font-weight:400; }
  .item { display:flex; align-items:center; gap:6px; margin-left:30px; padding:4px 8px; border-radius:6px; cursor:pointer; }
  .item:hover { background:var(--bg); }
  .item.sel { background:var(--soft); color:var(--accent); font-weight:600; }
  .item.none { color:var(--miss); }
  .b { font-size:10px; font-weight:600; border-radius:4px; padding:0 4px; line-height:16px; border:1px solid var(--line); color:var(--miss); }
  .b.y { background:#e8f5e9; border-color:#b7dfbb; color:#2e7d32; }
  .b.n { background:#fff4d6; border-color:#f0d58a; color:#8a6400; }
  .card.draft { border:2px dashed #e6c35c; box-shadow:none; }
  .card.draft .ver { color:#8a6400; }
  .badges { margin-left:auto; display:flex; gap:3px; }
  main { overflow:auto; padding:28px 36px 80px; min-height:0; }
  .empty { color:var(--muted); margin-top:30vh; text-align:center; }
  .key { font:12px ui-monospace, Menlo, monospace; color:var(--muted); }
  h2.tr { font-size:26px; margin:4px 0 18px; letter-spacing:-.01em; }
  .card { background:var(--card); border-radius:14px; padding:20px 22px; margin-bottom:18px; box-shadow:0 1px 2px rgba(0,0,0,.04); max-width:760px; }
  .ver { font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); font-weight:600; margin-bottom:6px; }
  .card h3 { font-size:19px; margin:0 0 12px; }
  .card h4 { font-size:13px; text-transform:uppercase; letter-spacing:.04em; color:var(--accent); margin:22px 0 6px; }
  .card p { margin:0 0 10px; }
  .card ul { margin:0 0 10px; padding-left:1.1em; list-style:none; }
  .card li { margin:0 0 6px; position:relative; }
  .card li::before { content:"•"; position:absolute; left:-1em; color:var(--muted); font-weight:400; }
  .fld { margin-top:12px; }
  .fld b { display:block; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--accent); }
  .missing { color:var(--muted); font-style:italic; }
  mark { background:var(--mark); padding:0 1px; border-radius:2px; }
  .notitle { color:var(--muted); font-weight:400; font-style:italic; }
  @media (max-width:760px) { .app { grid-template-columns:1fr; grid-template-rows:45vh 1fr; } main { padding:18px 16px 60px; } aside { border-right:0; border-bottom:1px solid var(--line); } }
</style>
</head>
<body>
<div class="app">
  <aside>
    <div class="top">
      <h1>Korpus tumačenja</h1>
      <div class="stat" id="stat"></div>
      <input type="search" id="q" placeholder="Pretraga po tekstu ili naslovu…" autocomplete="off">
      <div class="filt" id="filt">
        <button data-f="all" class="on">Svi</button>
        <button data-f="long">Ima dugu</button>
        <button data-f="short">Ima kratku</button>
        <button data-f="missing">Fali nešto</button>
        <button data-f="draft">Nacrti</button>
      </div>
    </div>
    <nav id="tree"></nav>
  </aside>
  <main id="view"><div class="empty">Izaberi tranzit levo.</div></main>
</div>
<script>
const D = /*PODACI*/;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let filter = 'all', query = '', selected = null;

function allText(k) {
  const t = D.texts[k] || {}; let s = '';
  for (const v of Object.values(t)) s += [v.title, v.body, v.positive, v.challenge, v.advice, ...v.sections.flatMap(x => [x.heading, x.body])].join(' ') + ' ';
  return s.toLowerCase();
}
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj');
const INDEX = {}; for (const p of D.tree) for (const a of p.aspects) for (const it of a.items) INDEX[it.key] = norm(it.name + ' ' + allText(it.key));

function visible(it) {
  if ('lunar' in it) return filter === 'all' && (!query || INDEX[it.key].includes(norm(query)));
  if (filter === 'long' && !it.long) return false;
  if (filter === 'short' && !it.short) return false;
  if (filter === 'missing' && it.long && it.short) return false;
  if (filter === 'draft' && !it.draft) return false;
  return !query || INDEX[it.key].includes(norm(query));
}

function renderTree() {
  const bilo = new Set([...document.querySelectorAll('#tree details[open]')].map(d => d.dataset.id));
  const openAll = !!query || filter !== 'all';
  let html = '', total = 0;
  for (const p of D.tree) {
    let inner = '', pc = 0, pSel = false;
    for (const a of p.aspects) {
      const items = a.items.filter(visible); if (!items.length) continue;
      pc += items.length;
      const sel = items.some(it => it.key === selected); if (sel) pSel = true;
      inner += `<details class="l2" data-id="${p.name}/${a.name}"${openAll || sel || bilo.has(p.name + '/' + a.name) ? ' open' : ''}><summary>${esc(a.name)}<span class="cnt">${items.length}</span></summary>` +
        items.map(it => `<div class="item${it.key === selected ? ' sel' : ''}${!it.long && !it.short && !it.draft && !it.lunar ? ' none' : ''}" data-k="${it.key}">
          <span>${esc(it.meta)}</span><span class="badges">${'lunar' in it ? `<span class="b${it.lunar ? ' y' : ''}">L</span>` : `<span class="b${it.short ? ' y' : it.draft ? ' n' : ''}" title="${it.draft ? 'nacrt kratke verzije' : ''}">${it.draft ? 'N' : 'K'}</span><span class="b${it.long ? ' y' : ''}">D</span>`}</span></div>`).join('') + '</details>';
    }
    if (!pc) continue; total += pc;
    html += `<details class="l1" data-id="${p.name}"${openAll || pSel || bilo.has(p.name) ? ' open' : ''}><summary>${esc(p.name)}<span class="cnt">${pc}</span></summary>${inner}</details>`;
  }
  $('#tree').innerHTML = html || '<div class="empty" style="margin-top:20px">Nema pogodaka.</div>';
}

function hl(s) {
  const e = esc(s); if (!query) return e;
  const q = query.trim(); if (!q) return e;
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return e.replace(re, m => `<mark>${m}</mark>`);
}
// "• Naslov – tekst": bullet obican, naslov do prve crte podebljan (isto kao transit.tsx).
function stavka(line) {
  const t = line.slice(2), i = t.indexOf(' – ');
  return `<li>${i > 0 ? `<b>${hl(t.slice(0, i))}</b> – ${hl(t.slice(i + 3))}` : hl(t)}</li>`;
}
function para(s) {
  return s.split(/\n\n+/).map(p => {
    const L = p.split('\n');
    return L.every(l => l.startsWith('• ')) ? `<ul>${L.map(stavka).join('')}</ul>` : `<p>${L.map(hl).join('<br>')}</p>`;
  }).join('');
}

function show(k) {
  selected = k; renderTree();
  const it = D.tree.flatMap(p => p.aspects.flatMap(a => a.items)).find(x => x.key === k);
  const t = D.texts[k] || {}; const s = t.short || t.draft, l = t.long;
  if ('lunar' in it) {
    $('#view').innerHTML = `<div class="key">${k}</div><h2 class="tr">${esc(it.name)}</h2><div class="card"><div class="ver">Lunarni kalendar · besplatno</div>` +
      (t.lunar ? para(t.lunar.body) : '<p class="missing">Nema teksta.</p>') + '</div>';
    $('#view').scrollTop = 0; history.replaceState(null, '', '#' + k); return;
  }
  const title = v => v.title ? hl(v.title) : '<span class="notitle">bez podnaslova</span>';
  let h = `<div class="key">${k}</div><h2 class="tr">${esc(it.name)}</h2>`;
  h += `<div class="card${t.draft ? ' draft' : ''}"><div class="ver">${t.draft ? 'Kratka verzija · NACRT — sažeto iz duge, u bazi, čeka potvrdu astrologa' : 'Kratka verzija · besplatno'}</div>` + (s ? `<h3>${title(s)}</h3>${para(s.body)}` +
      [['positive','Pozitivno'],['challenge','Izazov'],['advice','Savet']].filter(([f]) => s[f]).map(([f,n]) => `<div class="fld"><b>${n}</b>${para(s[f])}</div>`).join('')
    : '<p class="missing">Nema teksta.</p>') + '</div>';
  h += `<div class="card"><div class="ver">Duga verzija · plaćeno</div>` + (l ? `<h3>${title(l)}</h3>${para(l.body)}` +
      l.sections.map(x => `<h4>${hl(x.heading)}</h4>${para(x.body)}`).join('')
    : '<p class="missing">Nema teksta.</p>') + '</div>';
  $('#view').innerHTML = h; $('#view').scrollTop = 0;
  history.replaceState(null, '', '#' + k);
}

$('#tree').addEventListener('click', e => { const el = e.target.closest('.item'); if (el) show(el.dataset.k); });
$('#q').addEventListener('input', e => { query = e.target.value; renderTree(); if (selected) show(selected); });
$('#filt').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
  filter = b.dataset.f; document.querySelectorAll('#filt button').forEach(x => x.classList.toggle('on', x === b)); renderTree(); });

const items = D.tree.filter(p => !p.lunar).flatMap(p => p.aspects.flatMap(a => a.items));
$('#stat').textContent = `${items.filter(i => i.short).length} kratkih · ${items.filter(i => i.long).length} dugih · ${items.filter(i => i.draft).length} nacrta · ${items.length} mogućih`;
renderTree();
const k0 = decodeURIComponent(location.hash.slice(1)); if (D.texts[k0]) show(k0);
</script>
</body>
</html>
'''

if __name__ == '__main__':
    main()
