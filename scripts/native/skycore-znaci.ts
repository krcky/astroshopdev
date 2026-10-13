/**
 * Ikonice znakova za SkyCore: prepisuje `src/lib/znak-oblici.ts` (oblik i boja
 * elementa) u Swift, da widget i sat crtaju ISTE znakove kao aplikacija.
 *
 *   tsx scripts/native/skycore-znaci.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ELEMENT_BOJA, ZNAK_CENTAR, ZNAK_OBLIK, ZNAK_VIEWBOX } from '../../src/lib/znak-oblici';
import { SIGNS } from '../../src/lib/zodiac';

const redovi = SIGNS.map((s) => {
  const o = ZNAK_OBLIK[s.key];
  return `  SignShape(key: "${s.key}", color: 0x${ELEMENT_BOJA[s.element].slice(1)}, evenOdd: ${o.evenodd}, d: "${o.d}"),`;
});

const izlaz = `// GENERISANO — \`tsx scripts/native/skycore-znaci.ts\` iz src/lib/znak-oblici.ts. Ne menjati rucno.
struct SignShape { let key: String; let color: UInt32; let evenOdd: Bool; let d: String }

let SIGN_VIEWBOX = ${ZNAK_VIEWBOX}.0
let SIGN_CENTER = ${ZNAK_CENTAR}

/// Redom od Ovna do Riba.
let SIGN_SHAPES: [SignShape] = [
${redovi.join('\n')}
]
`;
const fajl = path.join(__dirname, '../../native/SkyCore/Sources/SkyCore/Signs.generated.swift');
fs.writeFileSync(fajl, izlaz);

// Isto za Android (widget, Wear OS).
const kt = `// GENERISANO — \`tsx scripts/native/skycore-znaci.ts\` iz src/lib/znak-oblici.ts. Ne menjati rucno.
package rs.astroshop.nebo.core

class SignShape(val key: String, val color: Long, val evenOdd: Boolean, val d: String)

const val SIGN_VIEWBOX = ${ZNAK_VIEWBOX}.0
const val SIGN_CENTER = ${ZNAK_CENTAR}

/** Redom od Ovna do Riba. */
val SIGN_SHAPES = listOf(
${SIGNS.map((s) => `    SignShape("${s.key}", 0xFF${ELEMENT_BOJA[s.element].slice(1)}, ${ZNAK_OBLIK[s.key].evenodd}, "${ZNAK_OBLIK[s.key].d}"),`).join('\n')}
)
`;
fs.writeFileSync(path.join(__dirname, '../../modules/nebo-widget/android/src/main/java/rs/astroshop/nebo/core/Signs.generated.kt'), kt);
console.log(`upisano ${redovi.length} znakova (Swift i Kotlin)`);
