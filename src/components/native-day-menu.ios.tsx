import * as React from 'react';
import { Button, Host, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import { accessibilityLabel as a11yLabel, contentShape, foregroundStyle, frame, shapes, tag, tint } from '@expo/ui/swift-ui/modifiers';

import type { NativeDayMenuProps } from './native-day-menu';

/**
 * Dan-meni kao pravi iOS UIMenu (SwiftUI `Menu` preko `@expo/ui`), za iOS pre 26.
 *
 * Na iOS-u 26 isti meni daje native traka (`unstable_headerRightItems`), ali
 * na starijem iOS-u stavke trake stoje ~5pt iznad loga i ne mogu da se spuste
 * — zato je okidac nas, u redu sa logom, a meni ispod njega sistemski: isto
 * zamucenje, animacija i kvacica kao svuda u iOS-u (Ivan, 27.9.2026).
 *
 * Kvacicu crta sam sistem: izbor je `Picker` unutar `Menu`-a. Stavke su samo
 * "Danas", "Sutra"… bez datuma: podnaslov (dva `Text`-a u stavci) Picker na
 * iOS-u 18 ne prikazuje, a datum u istom redu lomi stavku u dva reda.
 *
 * ZAKLJUCAN DAN (besplatni, Ivan 29.9.2026) nije izbor nego dugme sa katancem koje
 * vodi na paywall: u `Picker`-u bi ga sistem stiklirao pre nego sto kazemo "ne".
 * Uzastopni otkljucani dani ostaju zajedno u jednom `Picker`-u, pa redosled
 * dana ostaje isti.
 */
export function NativeDayMenu({ systemImage, povrsina, accessibilityLabel, color, options, selected, onChange, onZakljucano }: NativeDayMenuProps) {
  // Okidac je ikona kalendara, u svom krugu pored profila (Ivan, 28.9.2026). Dodir
  // hvata ceo krug (`povrsina`), ne samo ikona.
  const okvir = povrsina ? [frame({ width: povrsina, height: povrsina }), contentShape(shapes.circle())] : [];
  type Opcija = NativeDayMenuProps['options'][number];
  const grupe: ({ zakljucana: Opcija } | { izbor: Opcija[] })[] = [];
  for (const o of options) {
    const poslednja = grupe[grupe.length - 1];
    if (o.zakljucano) grupe.push({ zakljucana: o });
    else if (poslednja && 'izbor' in poslednja) poslednja.izbor.push(o);
    else grupe.push({ izbor: [o] });
  }
  return (
    <Host matchContents>
      <Menu
        // `tint` + `foregroundStyle`: bez njih iOS 18 okidac `Menu`-a boji sistemskom
        // plavom, bez obzira na `color` (Ivan, 29.9.2026: "da bude crna").
        modifiers={[a11yLabel(accessibilityLabel), ...(color ? [tint(color)] : [])]}
        label={<Image systemName={systemImage as never} size={19} color={color}
          modifiers={[...(color ? [foregroundStyle(color)] : []), ...okvir]} />}>
        {grupe.map((g) => 'zakljucana' in g ? (
          <Button
            key={g.zakljucana.value}
            label={g.zakljucana.title}
            systemImage="lock"
            onPress={() => onZakljucano?.(g.zakljucana.value)}
          />
        ) : (
          <Picker key={`izbor${g.izbor[0].value}`} selection={selected} onSelectionChange={(v: number) => onChange(v)}>
            {g.izbor.map((o) => (
              <Text key={o.value} modifiers={[tag(o.value)]}>{o.title}</Text>
            ))}
          </Picker>
        ))}
      </Menu>
    </Host>
  );
}
