/**
 * Tekst tumacenja -> blokovi za prikaz: pasusi i liste.
 *
 * Izvoz korpusa (`scripts/korpus/liste.py`) svodi svaku stavku liste na jedan
 * oblik, jedna stavka u redu:
 *
 *   • Naslov – tekst      (naslov se podebljava, bullet i tekst ne)
 *   • Tekst stavke        (stavka bez naslova)
 *
 * Blokovi su odvojeni praznim redom. Blok je lista samo ako SVAKI njegov red
 * pocinje sa "• " — inace je pasus, i jedan prelom reda ostaje prelom reda.
 */

export type Stavka = { naslov?: string; tekst: string };
export type Blok = { vrsta: 'pasus'; tekst: string } | { vrsta: 'lista'; stavke: Stavka[] };

const BULLET = '• ';
const CRTA = ' – ';

/** Najduzi naslov pred dvotackom — duze od ovoga je recenica sa dvotackom, ne naslov. */
const MAX_NASLOV_DVOTACKA = 60;

export function stavka(red: string): Stavka {
  const t = red.startsWith(BULLET) ? red.slice(BULLET.length).trim() : red.trim();
  const i = t.indexOf(CRTA);
  if (i > 0) return { naslov: t.slice(0, i), tekst: t.slice(i + CRTA.length) };
  // Drugi oblik iz briefa: "Naslov: tekst".
  const j = t.indexOf(': ');
  if (j > 0 && j <= MAX_NASLOV_DVOTACKA) return { naslov: t.slice(0, j), tekst: t.slice(j + 2) };
  return { tekst: t };
}

export function blokovi(tekst: string): Blok[] {
  return tekst
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Blok => {
      const redovi = b.split('\n').map((r) => r.trim()).filter(Boolean);
      return redovi.every((r) => r.startsWith(BULLET))
        ? { vrsta: 'lista', stavke: redovi.map(stavka) }
        : { vrsta: 'pasus', tekst: redovi.join('\n') };
    });
}

/* ------------------------------------------------------------------------- *
 * TRI ODELJKA DUGE VERZIJE — za karticu "Tvoj dan": Efekat, Pazi, Savet.
 *
 * Duga verzija skoro uvek ima "Pozitivni efekti", "Izazovi" i "Saveti", svaki
 * sa 2—4 stavke. Naslovi odeljaka nisu dosledni ("Pozitivna dejstva",
 * "Pozitivni aspekti", "Izazov", "Savet", "ozitivni efekti"), pa se prepoznaju
 * po korenu. Kad se isti tranzit ponovo prikaze, iz svakog odeljka ide SLEDECA
 * stavka (`n`-ti prikaz -> stavka n mod broj stavki).
 * ------------------------------------------------------------------------- */

export type Odeljak = 'efekat' | 'pazi' | 'savet';

export function vrstaOdeljka(naslov: string): Odeljak | null {
  const n = naslov.trim().toLowerCase();
  if (/^p?ozitiv/.test(n)) return 'efekat';
  if (/^izazov/.test(n)) return 'pazi';
  if (/^savet/.test(n)) return 'savet';
  return null;
}

/**
 * Vrsta sekcije duge verzije — za ikonu uz naslov (Ivan, 28.9.2026). Sedam
 * naslova se ponavlja kroz ceo korpus, pisani na vise nacina, pa ide po korenu
 * kao `vrstaOdeljka`. "Saveti" i "Opste preporuke" su po sadrzaju isto i dele
 * ikonu — ali NE i odeljak kartice "Tvoj dan", zato je ovo zasebna funkcija.
 * Jednokratni naslovi (~20, iz tekstova drugacije grade) vracaju null: bez ikone.
 */
export type VrstaSekcije = 'sustina' | 'dugorocno' | 'sfere' | Odeljak;

export function vrstaSekcije(naslov: string): VrstaSekcije | null {
  const n = naslov.trim().toLowerCase();
  if (/^su[sš]tin/.test(n)) return 'sustina';
  if (/^dugoro[cč]n/.test(n)) return 'dugorocno';
  if (/^specifi[cč]n\S* (sfer|oblast)/.test(n)) return 'sfere';
  if (/^op[sš]t\S* preporuk/.test(n)) return 'savet';
  return vrstaOdeljka(naslov);
}

export type TriOdeljka = Record<Odeljak, Stavka[]>;

/** Stavke liste iz sva tri odeljka. Pasusi (uvod, zavrsna recenica) se preskacu. */
export function triOdeljka(sections: { heading: string; body: string }[]): TriOdeljka {
  const out: TriOdeljka = { efekat: [], pazi: [], savet: [] };
  for (const s of sections) {
    const v = vrstaOdeljka(s.heading);
    if (!v || out[v].length) continue; // prvi odeljak te vrste
    for (const b of blokovi(s.body)) if (b.vrsta === 'lista') out[v].push(...b.stavke);
  }
  return out;
}

/** Stavka za `n`-ti prikaz istog tranzita (0 = prvi). */
export function stavkaZaPrikaz(list: Stavka[], n: number): Stavka | null {
  return list.length ? list[n % list.length] : null;
}

/** Prve 1—2 recenice teksta — sazetak kad tekst nema svoj. */
export function prveRecenice(tekst: string, koliko = 2): string {
  const r = tekst.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+(?=\s|$)/g);
  if (!r) return tekst.trim();
  return r.slice(0, koliko).map((x) => x.trim()).join(' ');
}

/* ------------------------------------------------------------------------- *
 * LUNARNI KALENDAR NA KARTICI "Mesec danas" (Ivan, 27. i 28.9.2026): bez
 * uvodnog pasusa; kartica trazi JEDNU stavku (`koliko = 1`), u Basti "Uradi"
 * i "Izbegavaj" do tri. Ceo tekst je na ekranu Mesec. Dopuna iz uvoda ispod
 * vazi kad se trazi vise stavki nego sto lista ima.
 *
 * Tekst astrologa (`lunar_texts.body`) je uvodni pasus pa lista "• …". Lista
 * ima 1—2 stavke u ~30% tekstova (Kuca cak 46 od 84), pa se do tri DOPUNJAVA
 * poslednjim recenicama uvoda — one su najblize listi i obicno su savet
 * ("Opustite se…"). Sve su astrologove reci, nista se ne dopisuje.
 *
 * Basta: oznake uradi/izbegavaj u podacima nema, pa podela ide po recima
 * (brief): "Ne…", "Nemojte…", "Izbegavajte…" ili "nepovoljn" -> izbegavaj.
 * Zabrana je u Basti cesce u uvodu nego u listi ("Ovo su nepovoljni dani za…"),
 * pa se "Izbegavaj" puni i recenicama uvoda; "Uradi" samo listom. Stavka koja pocinje sa "Ne" a iza
 * nije razmak ("Nega rasada") ostaje u "Uradi", ali ide i u `proveriti`.
 * Red "Odgovarajuci deo biljke: …" se preskace — kartica ga racuna sama
 * (`PLANT_PART`; poklapa se sa tekstom u 83 od 84, jedan tekst ga nema).
 * ------------------------------------------------------------------------- */

export type LunarneStavke = {
  stavke: Stavka[];
  uradi: Stavka[];
  izbegavaj: Stavka[];
  /** Stavke koje pravilo ne svrstava sigurno — za rucnu proveru. */
  proveriti: Stavka[];
  /** Koliko od `stavke` je dopunjeno iz uvoda. */
  izUvoda: number;
};

const IZBEGAVAJ = /^(ne|nemojte|izbegavajte|izbegavati)\s/i;
const DEO_BILJKE = /^odgovaraju[cć]\w* d[ae]o biljke/i;

function zabrana(s: Stavka): boolean {
  const pun = `${s.naslov ? `${s.naslov} ` : ''}${s.tekst}`;
  return IZBEGAVAJ.test(pun) || /nepovolj/i.test(pun); // i "Nepovoljan", ne samo "nepovoljn"
}

export function lunarneStavke(tekst: string, koliko = 3): LunarneStavke {
  const b = blokovi(tekst);
  const lista = b.flatMap((x) => (x.vrsta === 'lista' ? x.stavke : []));
  const uvod: Stavka[] = b
    .flatMap((x) => (x.vrsta === 'pasus' && !DEO_BILJKE.test(x.tekst) ? [x.tekst] : []))
    .join(' ')
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]+/g)?.map((r) => ({ tekst: r.trim() })) ?? [];

  const fali = Math.max(0, koliko - lista.length);
  const dopuna = fali ? uvod.slice(-fali) : [];
  const out: LunarneStavke = {
    stavke: [...lista.slice(0, koliko), ...dopuna],
    uradi: [],
    izbegavaj: [],
    proveriti: [],
    izUvoda: dopuna.length,
  };

  for (const s of lista) {
    if (zabrana(s)) out.izbegavaj.push(s);
    else {
      if (/^ne/i.test(s.tekst)) out.proveriti.push(s);
      out.uradi.push(s);
    }
  }
  // Zabrane iz uvoda idu u "Izbegavaj". "Uradi" se NE dopunjava uvodom: recenica
  // bez zabrane nije zato savet ("…je prilican los period za sve…" bi zavrsila u "Uradi").
  for (const s of uvod) if (zabrana(s) && out.izbegavaj.length < koliko) out.izbegavaj.push(s);
  out.uradi = out.uradi.slice(0, koliko);
  out.izbegavaj = out.izbegavaj.slice(0, koliko);
  return out;
}

/* ------------------------------------------------------------------------- *
 * RASPORED DUGE VERZIJE TRANZITA (Ivan, 1.10.2026, posle UX recenzije):
 *
 *   1. prva recenica — veca i crna (uvod)
 *   2. ostatak prvog pasusa — siv, kao do sada
 *   3. SVI odeljci, redom kako ih je astrolog napisao: Suština, Dugoročni efekti, Specifične
 *      sfere života, Opšte preporuke, pa Pozitivni efekti / Izazovi / Saveti (u korpusu uvek
 *      poslednji), i ~17 jednokratnih naslova ("Mitološke paralele"…). Ivan, 1.10.2026: i
 *      odeljci pre efekata idu gore — do tada su bili u nastavku, na dnu.
 *   4. nastavak: ostali pasusi teksta
 *   5. "Pitaj astrologa" (crta ekran, ne ovaj racun)
 *
 * Do tada su stavke stajale na samom dnu, posle ~300 reci. Korpus (595 dugih,
 * 1.10.2026): svaki tekst pocinje pasusom; prva recenica ima medijanu 103 znaka,
 * samo 8 je duze od `UVOD_MAX` — njima uvod ostaje siv (ceo pasus kao do sada).
 * Recenica se zavrsava na . ! ? IZA KOJIH ide razmak i VELIKO slovo: "U periodu
 * između 83. i 85. godine…" se inace prekidao posle "83.". Nista se ne dopisuje
 * i nista ne brise — samo se menja redosled astrologovih delova.
 * ------------------------------------------------------------------------- */

/** Duza prva recenica ne ide kao veliki uvod — bila bi crni blok od 4—5 redova. */
export const UVOD_MAX = 200;

/** Prva recenica pasusa i ostatak. `null` kad recenica nije nadjena ili je preduga. */
export function prvaRecenica(pasus: string, max = UVOD_MAX): { recenica: string; ostatak: string } | null {
  const t = pasus.replace(/\s+/g, ' ').trim();
  const m = /[.!?…]["“”»]?(?=\s+["„«]?[A-ZČĆŠŽĐ])/.exec(t);
  const kraj = m ? m.index + m[0].length : t.length;
  const recenica = t.slice(0, kraj).trim();
  if (!recenica || recenica.length > max) return null;
  return { recenica, ostatak: t.slice(kraj).trim() };
}

export type RasporedDuge<S extends { heading: string; body: string }> = {
  /** Prva recenica (null: ceo prvi pasus ide u `prviPasus`). */
  uvod: string | null;
  /** Ostatak prvog pasusa (ili ceo pasus kad uvoda nema). Prazno kad je pasus jedna recenica. */
  prviPasus: string;
  /** Svi odeljci, redom kako ih je astrolog napisao (efekti, izazovi i saveti su poslednji). */
  odeljci: S[];
  /** Ostali pasusi `body`-ja (spojeni praznim redom, kao u bazi). */
  nastavakTekst: string;
};

export function rasporedDuge<S extends { heading: string; body: string }>(body: string, sections: S[]): RasporedDuge<S> {
  const pasusi = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const prvi = pasusi[0] ?? '';
  // Prvi pasus koji je lista ("• …") ne deli se na uvod — u korpusu ga nema, ali da ne pukne.
  const deo = prvi && !prvi.startsWith(BULLET) ? prvaRecenica(prvi) : null;
  return {
    uvod: deo?.recenica ?? null,
    prviPasus: deo ? deo.ostatak : prvi,
    odeljci: sections,
    nastavakTekst: pasusi.slice(1).join('\n\n'),
  };
}
