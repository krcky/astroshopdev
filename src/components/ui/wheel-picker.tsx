import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * Native tockic za datum/vreme.
 *
 * iOS   — tocak se prikazuje ODMAH u toku, bez dodirivanja (display="spinner").
 * Android — dugme koje otvara sistemski dijalog; Android nema ugradjeni inline tocak.
 * Web   — sopstvena polja, jer paket ne postoji na vebu. Sluzi i za nasu proveru.
 */

type Props = {
  mode: 'date' | 'time';
  value: Date;
  onChange: (d: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
};

const MESECI = ['januar','februar','mart','april','maj','jun','jul','avgust','septembar','oktobar','novembar','decembar'];
const pad = (n: number) => String(n).padStart(2, '0');

export function WheelPicker({ mode, value, onChange, maximumDate, minimumDate }: Props) {
  if (Platform.OS === 'web') {
    return <WebFallback mode={mode} value={value} onChange={onChange} />;
  }

  if (Platform.OS === 'ios') {
    return (
      <View className="items-center">
        <DateTimePicker
          value={value}
          mode={mode}
          display="spinner"
          // 24-casovni format: rodjenje u 3 ujutru i 3 popodne nisu ista karta.
          is24Hour
          locale="sr-RS"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(_e: DateTimePickerEvent, d?: Date) => d && onChange(d)}
        />
      </View>
    );
  }

  return <AndroidField mode={mode} value={value} onChange={onChange}
                       maximumDate={maximumDate} minimumDate={minimumDate} />;
}

function AndroidField({ mode, value, onChange, maximumDate, minimumDate }: Props) {
  const [open, setOpen] = React.useState(false);
  const label = mode === 'date'
    ? `${value.getDate()}. ${MESECI[value.getMonth()]} ${value.getFullYear()}`
    : `${pad(value.getHours())}:${pad(value.getMinutes())}`;

  return (
    <View className="items-center">
      <Pressable onPress={() => setOpen(true)} className="px-4 py-3 active:opacity-60">
        <Text variant="display" className="text-center">{label}</Text>
        <View className="mt-2 h-px w-full bg-border" />
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(e: DateTimePickerEvent, d?: Date) => {
            setOpen(false);
            if (e.type === 'set' && d) onChange(d);
          }}
        />
      )}
    </View>
  );
}

/** Web nema native tockic — tri odnosno dva polja u istom centriranom stilu. */
function WebFallback({ mode, value, onChange }: Pick<Props, 'mode' | 'value' | 'onChange'>) {
  const set = (part: 'd' | 'm' | 'y' | 'h' | 'min', raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    const d = new Date(value);
    if (part === 'd') d.setDate(n);
    if (part === 'm') d.setMonth(n - 1);
    if (part === 'y') d.setFullYear(n);
    if (part === 'h') d.setHours(n);
    if (part === 'min') d.setMinutes(n);
    onChange(d);
  };

  const fields: [string, string, (v: string) => void, number][] =
    mode === 'date'
      ? [['dan', String(value.getDate()), (v) => set('d', v), 2],
         ['mesec', String(value.getMonth() + 1), (v) => set('m', v), 2],
         ['godina', String(value.getFullYear()), (v) => set('y', v), 4]]
      : [['sat', pad(value.getHours()), (v) => set('h', v), 2],
         ['minut', pad(value.getMinutes()), (v) => set('min', v), 2]];

  return (
    <View className="flex-row items-end justify-center gap-4">
      {fields.map(([label, val, onText, max]) => (
        <View key={label} className="items-center">
          <WebInput value={val} onChangeText={onText} maxLength={max} />
          <Text variant="label" className="mt-2 text-[10px]">{label}</Text>
        </View>
      ))}
    </View>
  );
}

function WebInput({ value, onChangeText, maxLength }: {
  value: string; onChangeText: (v: string) => void; maxLength: number;
}) {
  const { TextInput } = require('react-native');
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="number-pad"
      maxLength={maxLength}
      className={cn(
        'border-b border-border pb-1 text-center text-3xl text-foreground',
        maxLength === 4 ? 'w-24' : 'w-16'
      )}
    />
  );
}
