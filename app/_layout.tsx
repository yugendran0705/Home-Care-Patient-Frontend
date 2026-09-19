import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AlertProvider } from "@/hooks/useAlert";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Registered under the "Sen-*" names because that's what every screen's
  // `fontFamily` styles reference — swapping the font here (Plus Jakarta
  // Sans, a cleaner/more professional typeface than the old Sen font)
  // avoids having to touch every file that references those names.
  const [fontsLoaded] = useFonts({
    "Sen-Regular": PlusJakartaSans_400Regular,
    "Sen-Bold": PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GluestackUIProvider mode={colorScheme === "dark" ? "dark" : "light"}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {/* Colors.dark renders a white background/black text in this app
            (constants/Colors.ts has light/dark swapped from the OS-reported
            scheme), so the status bar icon color is inverted to match. */}
        <StatusBar style={colorScheme === "dark" ? "dark" : "light"} />
        <AlertProvider>
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
            <Stack.Screen
              name="address-form"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="services" options={{ headerShown: false }} />
            <Stack.Screen name="bookings" options={{ headerShown: false }} />
            <Stack.Screen name="booking" options={{ headerShown: false }} />
            <Stack.Screen
              name="notifications"
              options={{ headerShown: false }}
            />
          </Stack>
        </AlertProvider>
      </ThemeProvider>
    </GluestackUIProvider>
  );
}
