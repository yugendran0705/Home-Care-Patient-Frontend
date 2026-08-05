import { Stack } from "expo-router";

import "@/global.css";

export default function RootLayout() {
  return (
    <Stack>
      {/* This option will hide the header for all screens */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
