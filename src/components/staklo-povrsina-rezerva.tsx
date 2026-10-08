import * as React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

import { OKVIR_DUGMETA } from '@/components/ui/button';
import { shadow } from '@/theme/tokens';

export type StakloPovrsinaProps = {
  children: React.ReactNode;
  /** Zaobljenje uglova. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Povrsina bez stakla (Android, iOS pre 26, veb): bela kartica sa tankom ivicom, kao ostala
 * dugmad bez stakla (`OKVIR_DUGMETA`; na iOS-u mekom senkom).
 */
export function StakloPovrsinaRezerva({ children, radius = 18, style }: StakloPovrsinaProps) {
  return (
    <View
      style={[
        { borderRadius: radius, backgroundColor: '#FFFFFF' },
        Platform.OS === 'android' ? OKVIR_DUGMETA : shadow.soft,
        style,
      ]}>
      {children}
    </View>
  );
}
