import { Tabs } from 'expo-router';
import { CircleDot, House, Sparkles, UserRound } from 'lucide-react-native';

const INK = '#141414';
const MUTED = '#9A9A9A';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: INK,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E6E6E6' },
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.4 },
      }}>
      <Tabs.Screen
        name="home"
        options={{ title: 'Danas', tabBarIcon: ({ color, size }) => <House size={size - 3} color={color} /> }}
      />
      <Tabs.Screen
        name="daily"
        options={{ title: 'Horoskop', tabBarIcon: ({ color, size }) => <Sparkles size={size - 3} color={color} /> }}
      />
      <Tabs.Screen
        name="chart"
        options={{ title: 'Karta', tabBarIcon: ({ color, size }) => <CircleDot size={size - 3} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <UserRound size={size - 3} color={color} /> }}
      />
    </Tabs>
  );
}
