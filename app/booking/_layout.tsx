import { Stack } from "expo-router";

import "@/global.css";

export default function BookingFlowLayout() {
  return (
    <Stack>
      {/* This option will hide the header for all screens */}
      <Stack.Screen name="schedule" options={{ headerShown: false }} />
      <Stack.Screen name="nurses" options={{ headerShown: false }} />
      <Stack.Screen name="summary" options={{ headerShown: false }} />
    </Stack>
  );
}
