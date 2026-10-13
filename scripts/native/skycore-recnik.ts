/**
 * Recnik za Astrodial (sat): imena znakova, planeta i Mesecevih faza iz RECNIKA APLIKACIJE
 * (`src/i18n`, pravilo 26), na svih sest jezika, plus nekoliko natpisa koje ima samo sat.
 * Tako sat i aplikacija zovu Skorpiju isto, a nov jezik u aplikaciji stize i na sat.
 *
 *   tsx scripts/native/skycore-recnik.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import '../../src/i18n';
import { JEZICI, recnikZa, type Jezik } from '../../src/i18n/jezik';
import { BODIES } from '../../src/lib/astro';
import { SIGNS } from '../../src/lib/zodiac';

/** Natpisi koje ima samo sat. Kratki: staju u red na satu od 40 mm. */
const SAT: Record<string, Record<Jezik, string>> = {
  'ui.hour': { en: 'Hour', sr: 'Sat', hr: 'Sat', bs: 'Sat', sl: 'Ura', mk: 'Час' },
  'ui.next': { en: 'Next', sr: 'Sledeće', hr: 'Sljedeće', bs: 'Sljedeće', sl: 'Naslednje', mk: 'Следно' },
  'ui.voc': { en: 'Void of course', sr: 'Bez kursa', hr: 'Bez kursa', bs: 'Bez kursa', sl: 'Brez smeri', mk: 'Без курс' },
  'ui.planetaryHour': { en: 'Planetary hour', sr: 'Planetarni sat', hr: 'Planetarni sat', bs: 'Planetarni sat', sl: 'Planetarna ura', mk: 'Планетарен час' },
  'ui.until': { en: 'until', sr: 'do', hr: 'do', bs: 'do', sl: 'do', mk: 'до' },
  'ui.then': { en: 'then', sr: 'zatim', hr: 'zatim', bs: 'zatim', sl: 'nato', mk: 'потоа' },
  'ui.place': { en: 'Place', sr: 'Mesto', hr: 'Mjesto', bs: 'Mjesto', sl: 'Kraj', mk: 'Место' },
  'ui.followWatch': { en: 'Follow the watch', sr: 'Prati sat', hr: 'Prati sat', bs: 'Prati sat', sl: 'Sledi uri', mk: 'Следи го часовникот' },
  // Delovi sveta u izboru mesta (imena iz tz baze).
  'region.Africa': { en: 'Africa', sr: 'Afrika', hr: 'Afrika', bs: 'Afrika', sl: 'Afrika', mk: 'Африка' },
  'region.America': { en: 'Americas', sr: 'Amerika', hr: 'Amerika', bs: 'Amerika', sl: 'Amerika', mk: 'Америка' },
  'region.Antarctica': { en: 'Antarctica', sr: 'Antarktik', hr: 'Antarktika', bs: 'Antarktik', sl: 'Antarktika', mk: 'Антарктик' },
  'region.Arctic': { en: 'Arctic', sr: 'Arktik', hr: 'Arktik', bs: 'Arktik', sl: 'Arktika', mk: 'Арктик' },
  'region.Asia': { en: 'Asia', sr: 'Azija', hr: 'Azija', bs: 'Azija', sl: 'Azija', mk: 'Азија' },
  'region.Atlantic': { en: 'Atlantic', sr: 'Atlantik', hr: 'Atlantik', bs: 'Atlantik', sl: 'Atlantik', mk: 'Атлантик' },
  'region.Australia': { en: 'Australia', sr: 'Australija', hr: 'Australija', bs: 'Australija', sl: 'Avstralija', mk: 'Австралија' },
  'region.Europe': { en: 'Europe', sr: 'Evropa', hr: 'Europa', bs: 'Evropa', sl: 'Evropa', mk: 'Европа' },
  'region.Indian': { en: 'Indian Ocean', sr: 'Indijski okean', hr: 'Indijski ocean', bs: 'Indijski okean', sl: 'Indijski ocean', mk: 'Индиски Океан' },
  'region.Pacific': { en: 'Pacific', sr: 'Pacifik', hr: 'Pacifik', bs: 'Pacifik', sl: 'Pacifik', mk: 'Пацифик' },
  'ui.noSun': { en: 'No sunrise here today', sr: 'Sunce danas ovde ne izlazi', hr: 'Sunce danas ovdje ne izlazi', bs: 'Sunce danas ovdje ne izlazi', sl: 'Sonce tu danes ne vzide', mk: 'Сонцето денес тука не изгрева' },
};

const tabela: Record<Jezik, Record<string, string>> = {} as never;
for (const j of JEZICI) {
  const r = recnikZa(j);
  const t: Record<string, string> = {};
  SIGNS.forEach((s, i) => { t[`sign.${i}`] = r.nebo.znaci[s.key as keyof typeof r.nebo.znaci].ime; });
  for (const b of BODIES) t[`planet.${b.key}`] = r.nebo.tela[b.key];
  r.nebo.fazeMeseca.forEach((f, i) => { t[`phase.${i}`] = f; });
  for (const [k, v] of Object.entries(SAT)) t[k] = v[j];
  tabela[j] = t;
}

const lit = (s: string) => JSON.stringify(s);
const zaglavlje = '// GENERISANO — `tsx scripts/native/skycore-recnik.ts` iz src/i18n. Ne menjati rucno.\n';

fs.writeFileSync(
  path.join(__dirname, '../../native/SkyCore/Sources/SkyCore/Recnik.generated.swift'),
  `${zaglavlje}let RECNIK: [String: [String: String]] = [\n${JEZICI.map((j) => `  ${lit(j)}: [\n${Object.entries(tabela[j]).map(([k, v]) => `    ${lit(k)}: ${lit(v)},`).join('\n')}\n  ],`).join('\n')}\n]\n`
);
fs.writeFileSync(
  path.join(__dirname, '../../modules/nebo-widget/android/src/main/java/rs/astroshop/nebo/core/Recnik.generated.kt'),
  `${zaglavlje}package rs.astroshop.nebo.core\n\nval RECNIK: Map<String, Map<String, String>> = mapOf(\n${JEZICI.map((j) => `    ${lit(j)} to mapOf(\n${Object.entries(tabela[j]).map(([k, v]) => `        ${lit(k)} to ${lit(v).replace(/\$/g, '\\$')},`).join('\n')}\n    ),`).join('\n')}\n)\n`
);
console.log(`upisano ${JEZICI.length} jezika x ${Object.keys(tabela.en).length} natpisa (Swift i Kotlin)`);
