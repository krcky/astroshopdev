import { Tabs } from 'expo-router';
import { CircleDot, House, Orbit, Sparkles, UserRound } from 'lucide-react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';

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
        options={{ title: 'Horoskop', tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="chart"
        options={{ title: 'Karta', tabBarIcon: ({ color, size }) => <CircleDot size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="sky"
        options={{ title: 'Trenutno', tabBarIcon: ({ color, size }) => <Orbit size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <UserRound size={size} color={color} /> }}
      />
    </Tabs>
  );
}
