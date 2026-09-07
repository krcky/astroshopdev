import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        // Nazad gestom je iskljucen: koraci imaju sopstvenu strelicu, a
        // preskakanje unazad gestom bi ostavilo draft u nedoslednom stanju.
        gestureEnabled: false,
      }}
    />
  );
}
