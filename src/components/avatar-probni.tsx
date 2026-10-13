// @ts-nocheck — PROBNO (Ivan, 12.10.2026): 10 zakucanih avatara za gledanje u sredini kruga zivota, dodir menja sledeceg.
// Delovi su prepisani iz skice `files/avatar-skica/planete-foto.html` kao SVG tekst; filtera (zamucenja) nema.
// Nije sistem avatara — izbaciti kad se odluci o stilu.
import * as React from 'react';
import { Image, Pressable, View } from 'react-native';
import Svg, { G, Image as SvgImage, SvgXml } from 'react-native-svg';

const f = (n: number) => Math.round(n * 10) / 10;
const P2 = Math.PI / 180;
function star(cx: number, cy: number, R: number, r: number, n = 5, rot = -90) {
  const p: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (rot + (i * 180) / n) * P2;
    const rad = i % 2 ? r : R;
    p.push(f(cx + rad * Math.cos(a)) + ',' + f(cy + rad * Math.sin(a)));
  }
  return p.join(' ');
}
const mir = (d: string) => d + '<g transform="scale(-1 1)">' + d + '</g>';
const gloss = (d: string, w = 5) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="${w}" stroke-linecap="round"/>`;
const sparkle = (x: number, y: number, R: number, fill: string) => `<polygon points="${star(x, y, R, R * 0.26, 4)}" fill="${fill}"/>`;
function pearls(p0: number[], p1: number[], p2: number[], n: number, r: number) {
  let o = '';
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0];
    const y = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1];
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="url(#Gpearl)"/>`;
  }
  return o;
}
function flower(x: number, y: number, r: number, c: string) {
  let o = '';
  for (let i = 0; i < 5; i++) {
    const a = i * 72 * P2 - 1.2;
    o += `<circle cx="${f(x + r * 0.85 * Math.cos(a))}" cy="${f(y + r * 0.85 * Math.sin(a))}" r="${f(r * 0.62)}" fill="${c}"/>`;
  }
  return o + `<circle cx="${x}" cy="${y}" r="${f(r * 0.42)}" fill="#F2B84B"/>`;
}
const crescent = (x: number, y: number, r: number, fill: string) =>
  `<path d="M${f(x + r * 0.2)} ${f(y - r)} A${r} ${r} 0 1 0 ${f(x + r * 0.2)} ${f(y + r)} A${f(r * 0.78)} ${f(r * 0.78)} 0 1 1 ${f(x + r * 0.2)} ${f(y - r)}Z" fill="${fill}"/>`;
function ring(cx: number, cy: number, rad: number, a0: number, a1: number, n: number, r: number) {
  let o = '';
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * P2;
    o += `<circle cx="${f(cx + rad * Math.cos(a))}" cy="${f(cy + rad * Math.sin(a))}" r="${r}" fill="url(#Ghc)"/>`;
  }
  return o;
}
const lg = (id: string, a: string, b: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const DEFS =
  lg('Ggold', '#FFE98A', '#E3A21A') + lg('Gred', '#FF6A5C', '#C71F2D') + lg('Gpink', '#FF86B8', '#D1286F') + lg('Gblu', '#6FA6FF', '#2F5FD0') +
  lg('Gblk', '#4A4A56', '#0F0F14') + lg('Gsil', '#F4F7FA', '#9AA6B2') + lg('Gcre', '#FFF7E6', '#E6CFA4') + lg('Gwh', '#FFFFFF', '#D5DCE6') +
  lg('Gdk', '#5C5C6A', '#1E1E28') + lg('Gwine', '#A83257', '#5E1530') + lg('Gchamp', '#FBE9BE', '#C79B3F') + lg('Gtan', '#EBC47E', '#B9843A') +
  lg('Gbrn', '#B97C46', '#5E3318') + lg('Gnavy', '#4A66C8', '#1D2E78') + lg('Ggrn', '#7BE8AA', '#14935B') + lg('Gros', '#FFD9E2', '#E7819F') +
  lg('Gtint', '#F6CCDC', '#C98AA6') + lg('Glens', '#4A4650', '#0E0C12') + lg('Gavi', '#F5D3C2', '#BE7357') + lg('Gs_ruza', '#FAD3DE', '#EBA3B8') +
  lg('Geye', '#FFFFFF', '#F1C7C3') + lg('Gmo', '#8A2840', '#F3A4AC') +
  '<radialGradient id="Gpearl" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#F4ECEC"/><stop offset="1" stop-color="#CFC2C6"/></radialGradient>';
const dia = (x: number, y: number, w: number) =>
  `<path d="M${x} ${y - w} l${f(w * 0.9)} ${w} -${f(w * 0.9)} ${w} -${f(w * 0.9)} -${w}Z" fill="url(#Ggrn)"/>`;

/* LICE */
const EYES_M =
  '<g transform="translate(0 -26)">' +
  mir(
    '<g transform="translate(52 -14) scale(1.55) translate(-52 14)"><clipPath id="Gek"><path d="M28 -16 L76 -16 A24 21 0 0 1 28 -16Z"/></clipPath><path d="M28 -16 L76 -16 A24 21 0 0 1 28 -16Z" fill="url(#Geye)"/><g clip-path="url(#Gek)"><circle cx="52" cy="-10" r="10" fill="#0B0807"/><circle cx="48.5" cy="-13" r="2.6" fill="#fff" opacity=".85"/></g><path d="M28 -16 L76 -16" stroke="#1A1210" stroke-width="2.2" stroke-linecap="round"/></g>'
  ) +
  '</g>';
const EYES_F =
  '<g transform="translate(0 -26)">' +
  mir(
    '<g transform="translate(52 -14) scale(1.5) translate(-52 14)"><clipPath id="Gekf"><path d="M28 -13 Q52 -29 76 -13 A24 22 0 0 1 28 -13Z"/></clipPath><path d="M28 -13 Q52 -29 76 -13 A24 22 0 0 1 28 -13Z" fill="url(#Geye)"/><g clip-path="url(#Gekf)"><circle cx="52" cy="-8" r="11.5" fill="#0B0807"/><circle cx="47.5" cy="-12" r="3.4" fill="#fff"/><circle cx="56" cy="-4" r="1.6" fill="#fff" opacity=".8"/></g><path d="M27 -12 Q52 -30 77 -12" fill="none" stroke="#1A1210" stroke-width="3.4" stroke-linecap="round"/><path d="M77 -12 L86 -20" stroke="#1A1210" stroke-width="3" stroke-linecap="round"/><path d="M62 -23 l3 -6 M69 -19 l5 -5 M74 -15 l6 -3" stroke="#1A1210" stroke-width="2" stroke-linecap="round"/></g>'
  ) +
  '</g>';
const MOUTHS = {
  otvorena:
    '<clipPath id="Gcz"><path d="M-62 40 L62 40 A62 48 0 0 1 -62 40Z"/></clipPath><path d="M-62 40 L62 40 A62 48 0 0 1 -62 40Z" fill="url(#Gmo)"/><rect x="-9" y="40" width="18" height="21" fill="#fff" clip-path="url(#Gcz)"/><path d="M-62 40 L62 40" stroke="#5E1A2B" stroke-width="2.4" opacity=".6"/>',
  smirk:
    '<path d="M-34 70 Q0 90 38 52" fill="none" stroke="#4A1822" stroke-width="16" stroke-linecap="round"/><path d="M-30 74 Q2 92 36 58" fill="none" stroke="#B5525F" stroke-width="7" stroke-linecap="round" opacity=".8"/>',
  o: '<ellipse cx="14" cy="64" rx="13" ry="17" transform="rotate(-14 14 64)" fill="url(#Gmo)"/><ellipse cx="14" cy="58" rx="9" ry="9" transform="rotate(-14 14 58)" fill="#5E1A2B" opacity=".55"/>',
};

/* KOSA */
const sideH = (len: number, wid: number) =>
  mir(
    `<path d="M96 -100 C${150 + wid} -64 ${160 + wid} 30 ${142 + wid} ${len - 30} C${134 + wid} ${len} 124 ${len + 10} 112 ${len + 8} C122 ${len - 40} 118 40 114 10Z" fill="url(#Ghc)"/>`
  );
const CAPF = '<path d="M-136 -34 C-142 -180 142 -180 136 -34 C112 -86 40 -108 0 -104 C-40 -108 -112 -86 -136 -34Z" fill="url(#Ghc)"/>' + gloss('M-96 -100 C-56 -134 44 -134 92 -104', 6) + '<path d="M0 -104 L0 -142" stroke="#000" stroke-opacity=".22" stroke-width="3"/>';
const CAPM = '<path d="M-136 -34 C-142 -180 142 -180 136 -34 C124 -64 96 -92 70 -102 C40 -114 -40 -114 -70 -102 C-96 -92 -124 -64 -136 -34Z" fill="url(#Ghc)"/>' + gloss('M-92 -112 C-50 -142 40 -142 88 -116', 6);
const SLEEK = '<path d="M-136 -34 C-142 -180 142 -180 136 -34 C112 -90 40 -114 0 -112 C-40 -114 -112 -90 -136 -34Z" fill="url(#Ghc)"/>';
const HAIR: Record<string, [string, string]> = {
  duga: [sideH(128, 16), CAPF],
  bob: [sideH(84, 0), CAPF],
  kratka: ['', CAPM],
  kvif: ['', CAPM + '<path d="M-112 -108 C-122 -196 44 -226 112 -150 C92 -152 62 -142 30 -130 C0 -122 -60 -118 -112 -108Z" fill="url(#Ghc)"/>' + gloss('M-80 -150 C-40 -196 30 -200 80 -166', 6)],
  afro: [ring(0, -30, 140, -180, 0, 12, 36) + '<circle cx="0" cy="-20" r="150" fill="url(#Ghc)"/>', '<path d="M-134 -38 C-140 -150 140 -150 134 -38 C108 -74 60 -92 0 -92 C-60 -92 -108 -74 -134 -38Z" fill="url(#Ghc)"/>'],
  pundja: ['', SLEEK + '<circle cx="0" cy="-174" r="32" fill="url(#Ghc)"/>' + gloss('M-16 -186 Q4 -200 20 -184', 5)],
  rep: ['', SLEEK + '<path d="M40 -134 C128 -176 198 -120 176 -34 C166 8 144 26 132 50 C154 -8 150 -84 100 -102 C80 -108 60 -108 40 -106Z" fill="url(#Ghc)"/><ellipse cx="46" cy="-126" rx="9" ry="13" fill="url(#Ggold)"/>'],
  bodljikava: [
    '',
    CAPM +
      [-4, -3, -2, -1, 0, 1, 2, 3, 4]
        .map((i) => {
          const x = i * 24;
          const h = 46 + (4 - Math.abs(i)) * 8;
          return `<path d="M${x - 13} -128 L${x} ${-128 - h} L${x + 13} -128Z" fill="url(#Ghc)"/>`;
        })
        .join(''),
  ],
};
/* DLAKE */
const FH: Record<string, [string, number]> = {
  zavrnuti: ['<path d="M0 36 C-14 24 -40 26 -58 42 C-66 49 -78 48 -80 38 C-81 31 -72 27 -66 32 C-70 40 -60 42 -52 38 C-34 32 -14 38 0 46 C14 38 34 32 52 38 C60 42 70 40 66 32 C72 27 81 31 80 38 C78 48 66 49 58 42 C40 26 14 24 0 36Z" fill="url(#Ghc)"/>', 4],
  cetkasti: ['<path d="M0 30 C-20 24 -52 26 -66 42 C-52 52 -20 48 0 48 C20 48 52 52 66 42 C52 26 20 24 0 30Z" fill="url(#Ghc)"/>' + gloss('M-40 34 Q0 28 40 34', 3.5), 4],
  brada: ['<path d="M-124 0 C-122 92 -70 142 0 142 C70 142 122 92 124 0 C114 58 80 104 0 108 C-80 104 -114 58 -124 0Z" fill="url(#Ghc)"/>' + gloss('M-90 70 Q-50 120 0 124', 5), 2],
  kozja: ['<ellipse cx="0" cy="112" rx="30" ry="28" fill="url(#Ghc)"/>' + gloss('M-14 100 Q0 94 14 100', 4), 2],
};
/* SESIRI */
const HAT: Record<string, string> = {
  kruna:
    '<path d="M-46 -124 Q-40 -158 0 -154 Q40 -158 46 -124Z" fill="url(#Gred)"/><path d="M-54 -116 L-60 -178 L-30 -150 L0 -186 L30 -150 L60 -178 L54 -116Z" fill="url(#Ggold)"/><rect x="-57" y="-134" width="114" height="24" rx="6" fill="url(#Ggold)"/>' +
    gloss('M-48 -127 H48', 4) + dia(-34, -122, 8) + dia(0, -122, 8) + dia(34, -122, 8),
  viking:
    '<path d="M-68 -110 C-72 -178 72 -178 68 -110 Q0 -96 -68 -110Z" fill="url(#Gsil)"/>' + gloss('M-48 -142 Q-30 -166 -4 -170', 5) +
    '<path d="M-70 -112 Q0 -94 70 -112 L70 -98 Q0 -80 -70 -98Z" fill="#7F8B98"/>' +
    mir('<path d="M64 -116 Q110 -126 102 -192 Q92 -156 58 -148Z" fill="url(#Gcre)"/>') +
    '<circle cx="-40" cy="-102" r="4" fill="#CFD6DE"/><circle cx="0" cy="-96" r="4" fill="#CFD6DE"/><circle cx="40" cy="-102" r="4" fill="#CFD6DE"/>',
  cilindar:
    '<ellipse cx="0" cy="-116" rx="82" ry="16" fill="url(#Gblk)"/><rect x="-46" y="-196" width="92" height="82" rx="8" fill="url(#Gblk)"/><ellipse cx="0" cy="-196" rx="46" ry="9" fill="#5C5C6A"/><rect x="-46" y="-144" width="92" height="16" fill="url(#Gred)"/>' + gloss('M-30 -186 V-150', 5),
  silterica:
    '<path d="M-70 -108 C-74 -178 74 -178 70 -108Z" fill="url(#Gblu)"/><path d="M-64 -112 Q0 -88 64 -112 Q44 -78 0 -76 Q-44 -78 -64 -112Z" fill="url(#Gnavy)"/><circle cx="0" cy="-176" r="7" fill="#9DBBFF"/>' + gloss('M-46 -142 Q-26 -168 4 -168', 5),
  kapa:
    '<path d="M-70 -112 C-72 -190 72 -190 70 -112Z" fill="url(#Gred)"/><rect x="-76" y="-126" width="152" height="28" rx="14" fill="url(#Gcre)"/><circle cx="0" cy="-190" r="16" fill="url(#Gwh)"/>' + gloss('M-46 -150 Q-30 -176 -2 -178', 5),
  kaubojski:
    '<path d="M-48 -108 C-52 -170 -20 -180 0 -164 C20 -180 52 -170 48 -108Z" fill="url(#Gtan)"/><path d="M-120 -126 Q-70 -86 0 -88 Q70 -86 120 -126 Q82 -106 0 -104 Q-82 -106 -120 -126Z" fill="url(#Gtan)"/><path d="M-50 -112 Q0 -96 50 -112 L50 -124 Q0 -108 -50 -124Z" fill="#6E4524"/>',
  mornar:
    '<path d="M-72 -108 C-76 -172 76 -172 72 -108Z" fill="url(#Gwh)"/><path d="M-72 -108 Q0 -90 72 -108 L72 -126 Q0 -108 -72 -126Z" fill="url(#Gnavy)"/><circle cx="0" cy="-168" r="7" fill="url(#Gnavy)"/>',
  tijara:
    '<path d="M-76 -116 Q0 -170 76 -116" fill="none" stroke="#EBC04F" stroke-width="13" stroke-linecap="round"/><path d="M-32 -146 L-24 -176 L-10 -152Z M10 -152 L24 -176 L32 -146Z M-9 -156 L0 -190 L9 -156Z" fill="url(#Ggold)"/><circle cx="0" cy="-194" r="7" fill="url(#Gpearl)"/><circle cx="-25" cy="-180" r="5.5" fill="url(#Gpearl)"/><circle cx="25" cy="-180" r="5.5" fill="url(#Gpearl)"/><path d="M0 -156 l8 9 -8 9 -8 -9Z" fill="url(#Gpink)"/>',
  slamnati:
    '<ellipse cx="0" cy="-104" rx="120" ry="25" fill="url(#Gtan)"/><path d="M-56 -108 C-58 -170 58 -170 56 -108Z" fill="url(#Gtan)"/><path d="M-57 -112 Q0 -98 57 -112 L56 -130 Q0 -116 -56 -130Z" fill="url(#Gred)"/>' + gloss('M-36 -146 Q-20 -162 0 -162', 4),
  beret:
    '<path d="M-78 -108 C-96 -150 -42 -182 20 -176 C74 -172 96 -142 78 -108 Q0 -92 -78 -108Z" fill="url(#Gwine)"/>' + gloss('M-62 -126 C-40 -156 20 -166 62 -138', 5) + '<circle cx="24" cy="-178" r="7" fill="#4A0F26"/>',
  cvetni: (() => {
    let o = '';
    const cols = ['#FFFFFF', '#FF9DB8', '#FFD36E'];
    for (let i = 0; i < 9; i++) {
      const a = (-165 + i * 15) * P2;
      const x = f(132 * Math.cos(a));
      const y = f(132 * Math.sin(a));
      o += `<ellipse cx="${x}" cy="${y}" rx="13" ry="6" transform="rotate(${f(-165 + i * 15 + 90)} ${x} ${y})" fill="#4FC27A"/>`;
    }
    for (let i = 0; i < 8; i++) {
      const b = (-158 + i * 16) * P2;
      o += flower(f(140 * Math.cos(b)), f(140 * Math.sin(b)), i % 3 === 1 ? 14 : 11, cols[i % 3]);
    }
    return o;
  })(),
};
/* NAOCARE (preko ociju) */
const GL: Record<string, string> = {
  macka:
    mir('<path d="M84 -34 Q58 -22 22 -22 Q20 8 42 14 Q70 18 84 -34Z" fill="url(#Gtint)" fill-opacity=".55" stroke="#2A1A14" stroke-width="5" stroke-linejoin="round"/><path d="M22 -22 Q58 -20 84 -34" stroke="#2A1A14" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="82" cy="-32" r="3.6" fill="url(#Gchamp)"/>') +
    '<path d="M-22 -18 Q0 -27 22 -18" stroke="#2A1A14" stroke-width="5" fill="none" stroke-linecap="round"/>',
  okrugle:
    mir('<circle cx="50" cy="-8" r="31" fill="#fff" fill-opacity=".12" stroke="url(#Gchamp)" stroke-width="4"/><path d="M30 -20 Q36 -30 46 -33" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>') +
    '<path d="M-19 -14 Q0 -24 19 -14" stroke="url(#Gchamp)" stroke-width="4" fill="none" stroke-linecap="round"/>',
  velike:
    mir('<rect x="16" y="-38" width="70" height="58" rx="24" fill="url(#Glens)" stroke="#0E0C12" stroke-width="4"/><path d="M26 -8 L48 -30" stroke="#fff" stroke-opacity=".4" stroke-width="6" stroke-linecap="round"/>') +
    '<path d="M-18 -16 Q0 -26 18 -16" stroke="#0E0C12" stroke-width="7" fill="none" stroke-linecap="round"/>',
  avijator:
    mir('<path d="M20 -34 Q56 -44 84 -26 Q88 8 54 20 Q20 14 20 -34Z" fill="url(#Gavi)" fill-opacity=".7" stroke="url(#Gchamp)" stroke-width="3.6" stroke-linejoin="round"/><path d="M34 -22 Q48 -32 64 -32" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>') +
    '<path d="M-20 -26 Q0 -34 20 -26 M-18 -14 Q0 -22 18 -14" stroke="url(#Gchamp)" stroke-width="3" fill="none" stroke-linecap="round"/>',
};
/* NAKIT */
const EAR: Record<string, string> = {
  biser: mir('<circle cx="140" cy="12" r="4" fill="url(#Gchamp)"/><circle cx="140" cy="26" r="10" fill="url(#Gpearl)"/>'),
  obruc: mir('<circle cx="146" cy="40" r="22" fill="none" stroke="#E3B24A" stroke-width="6"/>'),
  zvezda: mir(`<polygon points="${star(140, 16, 14, 6, 5)}" fill="url(#Gchamp)"/>`),
  kristal: mir('<circle cx="140" cy="12" r="3.6" fill="url(#Gchamp)"/><path d="M140 16 V26" stroke="#C79B3F" stroke-width="2.5"/><path d="M140 26 C128 40 128 54 140 60 C152 54 152 40 140 26Z" fill="url(#Gros)" stroke="#C79B3F" stroke-width="2"/>'),
};
/* VRAT */
const SCD = 'M-102 84 Q0 134 102 84 L74 124 Q0 160 -74 124Z';
const band = (id: string, fill: string, deco: string) =>
  `<clipPath id="Gsc_${id}"><path d="${SCD}"/></clipPath><path d="${SCD}" fill="${fill}"/><g clip-path="url(#Gsc_${id})">${deco}</g>` + gloss('M-96 90 Q0 138 96 90', 3.5);
const stripes = (c: string, w: number, gap: number) => {
  let o = '';
  for (let i = -110; i <= 110; i += gap) o += `<rect x="${i}" y="70" width="${w}" height="100" fill="${c}"/>`;
  return o;
};
const NECK: Record<string, string> = {
  prugasti: band('pr', 'url(#Gred)', stripes('#fff', 14, 32)),
  leptir: '<path d="M0 108 L-40 88 L-40 128Z M0 108 L40 88 L40 128Z" fill="url(#Gred)"/><rect x="-10" y="95" width="20" height="26" rx="6" fill="#A11A2A"/>' + gloss('M-32 98 L-12 106', 3),
  kravata: '<path d="M-14 88 L14 88 L9 110 L-9 110Z" fill="url(#Gnavy)"/><path d="M-9 110 L9 110 L18 148 L0 156 L-18 148Z" fill="url(#Gnavy)"/>' + gloss('M-3 114 L-7 144', 3),
  svila: band('sv', 'url(#Gs_ruza)', (() => { let o = ''; for (let i = -90; i <= 90; i += 30) o += flower(i, 102 + (i % 60 ? 14 : 0), 6, '#fff'); return o; })()),
  bisere: pearls([-88, 94], [0, 170], [88, 94], 14, 6.6),
};

type Cfg = {
  ime: string; slika: any; W: number; H: number; cx: number; cy: number; r: number; S: number;
  oci: 'M' | 'F'; usta: keyof typeof MOUTHS; kosa?: string; boja: [string, string];
  sesir?: string; naocare?: string; dlaka?: string; minj?: string; vrat?: string; ogr?: string;
};
const SI = {
  sun: require('../../assets/images/planete/sun.png'), moon: require('../../assets/images/planete/moon.png'), venus: require('../../assets/images/planete/venus.png'),
  mars: require('../../assets/images/planete/mars.png'), jupiter: require('../../assets/images/planete/jupiter.png'), saturn: require('../../assets/images/planete/saturn.png'),
  uranus: require('../../assets/images/planete/uranus.png'), neptune: require('../../assets/images/planete/neptune.png'), pluto: require('../../assets/images/planete/pluto.png'),
  earth: require('../../assets/images/planete/earth.png'),
};
const K: [string, string] = ['#8A5A44', '#4A281C'], CR: [string, string] = ['#4A4552', '#17131D'], PL: [string, string] = ['#F5D08C', '#CC9244'];
const BK: [string, string] = ['#E08A4E', '#A4481F'], SV: [string, string] = ['#F1F1F4', '#B9BDC8'], LJ: [string, string] = ['#B58CF0', '#6B3FC4'];
export const AVATARI: Cfg[] = [
  { ime: 'Sunce', slika: SI.sun, W: 255, H: 255, cx: 127, cy: 127, r: 127, S: 1, oci: 'M', usta: 'otvorena', boja: K, sesir: 'kaubojski', naocare: 'velike', dlaka: 'cetkasti' },
  { ime: 'Mesec', slika: SI.moon, W: 256, H: 256, cx: 128, cy: 128, r: 128, S: 1, oci: 'F', usta: 'smirk', kosa: 'duga', boja: SV, sesir: 'tijara', naocare: 'okrugle', minj: 'biser', ogr: 'bisere' },
  { ime: 'Venera', slika: SI.venus, W: 229, H: 229, cx: 114.5, cy: 114.5, r: 114.5, S: 1, oci: 'F', usta: 'otvorena', kosa: 'bob', boja: PL, sesir: 'slamnati', naocare: 'macka', minj: 'obruc', vrat: 'svila' },
  { ime: 'Mars', slika: SI.mars, W: 233, H: 233, cx: 116.5, cy: 116.5, r: 116.5, S: 1, oci: 'M', usta: 'smirk', kosa: 'kratka', boja: CR, sesir: 'viking', dlaka: 'brada', vrat: 'prugasti' },
  { ime: 'Jupiter', slika: SI.jupiter, W: 229, H: 229, cx: 114.5, cy: 114.5, r: 114.5, S: 1, oci: 'M', usta: 'otvorena', kosa: 'afro', boja: CR, sesir: 'kruna', naocare: 'okrugle', vrat: 'leptir' },
  { ime: 'Saturn', slika: SI.saturn, W: 494, H: 492, cx: 244, cy: 243, r: 101, S: 0.66, oci: 'F', usta: 'o', kosa: 'pundja', boja: BK, sesir: 'cvetni', minj: 'zvezda' },
  { ime: 'Uran', slika: SI.uranus, W: 351, H: 361, cx: 177, cy: 177, r: 103, S: 0.8, oci: 'M', usta: 'smirk', kosa: 'kvif', boja: PL, sesir: 'silterica', naocare: 'velike', dlaka: 'kozja' },
  { ime: 'Neptun', slika: SI.neptune, W: 226, H: 226, cx: 113, cy: 113, r: 113, S: 1, oci: 'F', usta: 'otvorena', kosa: 'duga', boja: LJ, sesir: 'mornar', minj: 'kristal', ogr: 'bisere' },
  { ime: 'Pluton', slika: SI.pluto, W: 229, H: 229, cx: 114.5, cy: 114.5, r: 114.5, S: 1, oci: 'M', usta: 'o', kosa: 'bodljikava', boja: SV, sesir: 'cilindar', dlaka: 'zavrnuti', vrat: 'kravata' },
  { ime: 'Zemlja', slika: SI.earth, W: 256, H: 256, cx: 128, cy: 128, r: 128, S: 1, oci: 'F', usta: 'smirk', kosa: 'rep', boja: BK, sesir: 'kapa', naocare: 'avijator', minj: 'obruc' },
];

function sastavi(c: Cfg) {
  const [kb, kf] = c.kosa ? HAIR[c.kosa] : ['', ''];
  const dl = c.dlaka ? FH[c.dlaka] : null;
  const grad = `<linearGradient id="Ghc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.boja[0]}"/><stop offset="1" stop-color="${c.boja[1]}"/></linearGradient>`;
  const wrap = (inner: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-200 -200 400 400"><defs>${DEFS}${grad}</defs><g transform="scale(${c.S})">${inner}</g></svg>`;
  const back = wrap(kb);
  const front = wrap(
    (dl && dl[1] === 2 ? dl[0] : '') +
      MOUTHS[c.usta] +
      (dl && dl[1] === 4 ? dl[0] : '') +
      (c.oci === 'M' ? EYES_M : EYES_F) +
      (c.naocare ? `<g transform="translate(0 -21)">${GL[c.naocare]}</g>` : '') +
      (c.minj ? EAR[c.minj] : '') +
      kf +
      (c.vrat ? NECK[c.vrat] : '') +
      (c.sesir ? HAT[c.sesir] : '') +
      (c.ogr ? NECK[c.ogr] : '')
  );
  return { back, front };
}

export function AvatarProbni({ size, index = 0 }: { size: number; index?: number }) {
  const c = AVATARI[index % AVATARI.length];
  const { back, front } = React.useMemo(() => sastavi(c), [c]);
  const q = 140 / c.r;
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <SvgXml xml={back} width={size} height={size} />
      </View>
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <Svg width={size} height={size} viewBox="-200 -200 400 400">
          <G transform={`scale(${c.S})`}>
            <SvgImage href={c.slika} x={-c.cx * q} y={-c.cy * q} width={c.W * q} height={c.H * q} />
          </G>
        </Svg>
      </View>
      <View style={{ position: 'absolute', left: 0, top: 0 }}>
        <SvgXml xml={front} width={size} height={size} />
      </View>
    </View>
  );
}

export const SLIKE = [
  require('../probni-avatari/01.png'), require('../probni-avatari/02.png'), require('../probni-avatari/03.png'), require('../probni-avatari/04.png'),
  require('../probni-avatari/05.png'), require('../probni-avatari/06.png'), require('../probni-avatari/07.png'), require('../probni-avatari/08.png'),
  require('../probni-avatari/09.png'), require('../probni-avatari/10.png'), require('../probni-avatari/11.png'), require('../probni-avatari/12.png'),
];

/** Dodir menja sledeceg: 10 astro avatara, pa 12 slika iz `files/meseci` (kopije u `src/probni-avatari/`). */
export function AvatarProbaDodir({ size }: { size: number }) {
  const [i, setI] = React.useState(0);
  const ukupno = AVATARI.length + SLIKE.length;
  return (
    <Pressable onPress={() => setI((x) => (x + 1) % ukupno)} accessibilityRole="button" accessibilityLabel="Probni avatar. Dodir menja." style={{ width: size, height: size }}>
      {i < AVATARI.length ? (
        <AvatarProbni size={size} index={i} />
      ) : (
        <Image source={SLIKE[i - AVATARI.length]} style={{ width: size, height: size }} resizeMode="contain" accessibilityIgnoresInvertColors />
      )}
    </Pressable>
  );
}
