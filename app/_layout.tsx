import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";

import { useColorScheme } from "@/hooks/useColorScheme";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    "Sen-Regular": require("../assets/fonts/Sen-Regular.ttf"),
    "Sen-Bold": require("../assets/fonts/Sen-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  return (
    <GluestackUIProvider mode={colorScheme === "dark" ? "dark" : "light"}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* This option will hide the header for all screens */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen
            name="manage-addresses"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="edit-personal-details"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="address-form" options={{ headerShown: false }} />
          <Stack.Screen name="services" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
