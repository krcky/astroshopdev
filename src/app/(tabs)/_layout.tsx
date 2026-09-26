import { Tabs } from 'expo-router';
import { CircleDot, House, Orbit, Sparkles, UserRound } from 'lucide-react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';

/*
 * Imena tabova (26.9.2026): Danas · Tranziti · Ti · Nebo · Profil.
 * "Ti" je natalna karta — ono sto se ne menja; "Nebo" je stanje neba sada.
 * Ekrani u kodu zadrzavaju stara imena fajlova (daily, chart, sky).
 */
export default function TabsLayout() {
  return (
    <Tabs
      // Traka lebdi iznad sadrzaja, pa se crta rucno. Ekrani zato moraju da
      // ostave `TAB_BAR_SPACE` praznog prostora na dnu.
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Danas', tabBarIcon: ({ color, size }) => <House size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="daily"
        options={{ title: 'Tranziti', tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="chart"
        options={{ title: 'Ti', tabBarIcon: ({ color, size }) => <CircleDot size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="sky"
        options={{ title: 'Nebo', tabBarIcon: ({ color, size }) => <Orbit size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} /> }}
      />
    </Tabs>
  );
}
