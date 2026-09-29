import * as React from 'react';
import { Host, Image, Menu, Picker, Text } from '@expo/ui/swift-ui';
import { accessibilityLabel as a11yLabel, contentShape, frame, shapes, tag } from '@expo/ui/swift-ui/modifiers';

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
 */
export function NativeDayMenu({ systemImage, povrsina, accessibilityLabel, color, options, selected, onChange }: NativeDayMenuProps) {
  // Okidac je ikona kalendara, u svom krugu pored profila (Ivan, 28.9.2026). Dodir
  // hvata ceo krug (`povrsina`), ne samo ikona.
  const okvir = povrsina ? [frame({ width: povrsina, height: povrsina }), contentShape(shapes.circle())] : [];
  return (
    <Host matchContents>
      <Menu
        modifiers={[a11yLabel(accessibilityLabel)]}
        label={<Image systemName={systemImage as never} size={19} color={color} modifiers={okvir} />}>
        <Picker selection={selected} onSelectionChange={(v: number) => onChange(v)}>
          {options.map((o) => (
            <Text key={o.value} modifiers={[tag(o.value)]}>{o.title}</Text>
          ))}
        </Picker>
      </Menu>
    </Host>
  );
}
