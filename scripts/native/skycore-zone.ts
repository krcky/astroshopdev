/**
 * Mesto po vremenskoj zoni — za satove (Apple Watch, Wear OS), koji su ZASEBNE aplikacije
 * i mesto posmatranja ne dobijaju od telefona. Svaka zona u tz bazi ima svoj grad sa
 * koordinatama (`zone.tab`, javno vlasnistvo; kopija sa macOS-a je uz ovu skriptu):
 * sat uzme grad svoje zone, bez dozvole za lokaciju, a korisnik moze rucno da izabere drugi.
 *
 *   tsx scripts/native/skycore-zone.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

/** "+4450+02030" ili "+404251-0740023" -> stepeni. */
function koordinate(s: string): [number, number] {
  const m = s.match(/^([+-])(\d{2})(\d{2})(\d{2})?([+-])(\d{3})(\d{2})(\d{2})?$/);
  if (!m) throw new Error(`koordinate: ${s}`);
  const lat = (Number(m[2]) + Number(m[3]) / 60 + Number(m[4] ?? 0) / 3600) * (m[1] === '-' ? -1 : 1);
  const lon = (Number(m[6]) + Number(m[7]) / 60 + Number(m[8] ?? 0) / 3600) * (m[5] === '-' ? -1 : 1);
  return [Number(lat.toFixed(4)), Number(lon.toFixed(4))];
}

const zone = fs.readFileSync(path.join(__dirname, 'zone.tab'), 'utf8')
  .split('\n').filter((r) => r && !r.startsWith('#'))
  .map((r) => r.split('\t'))
  .map(([, koord, ime]) => ({ ime, k: koordinate(koord) }))
  .sort((a, b) => a.ime.localeCompare(b.ime));

/** Uvek sa decimalom: Kotlin ceo broj ne prima kao Double. */
const d = (x: number) => (Number.isInteger(x) ? `${x}.0` : String(x));

const zaglavlje = '// GENERISANO — `tsx scripts/native/skycore-zone.ts` iz tz baze (zone.tab). Ne menjati rucno.\n'
  + '// Grad svake vremenske zone: sirina i duzina u stepenima (+ sever, + istok).\n';

fs.writeFileSync(
  path.join(__dirname, '../../native/SkyCore/Sources/SkyCore/Zone.generated.swift'),
  `${zaglavlje}let ZONE_PLACES: [(String, Double, Double)] = [\n${zone.map((z) => `  ("${z.ime}", ${d(z.k[0])}, ${d(z.k[1])}),`).join('\n')}\n]\n`
);
fs.writeFileSync(
  path.join(__dirname, '../../modules/nebo-widget/android/src/main/java/rs/astroshop/nebo/core/Zone.generated.kt'),
  `${zaglavlje}package rs.astroshop.nebo.core\n\nclass ZonePlace(val id: String, val latitude: Double, val longitude: Double)\n\nval ZONE_PLACES = listOf(\n${zone.map((z) => `    ZonePlace("${z.ime}", ${d(z.k[0])}, ${d(z.k[1])}),`).join('\n')}\n)\n`
);
console.log(`upisano ${zone.length} zona (Swift i Kotlin)`);
