import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";

import { useColorScheme } from "@/hooks/useColorScheme";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GluestackUIProvider mode={colorScheme === "dark" ? "dark" : "light"}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* This option will hide the header for all screens */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="[id]" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
