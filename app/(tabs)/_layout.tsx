import { router, Tabs } from "expo-router";
import { CalendarCheck, Search } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { PURPLE, PURPLE_DARK } from "@/constants/serviceTheme";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <TabNavigator />
    </SafeAreaProvider>
  );
}

function TabNavigator() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PURPLE_DARK,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontFamily: "Sen-Bold",
          fontSize: 11,
        },
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            backgroundColor: colors.background,
            borderTopWidth: 0,
            height: 56 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -2 },
          },
          default: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: PURPLE + "22",
            height: 56 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom,
            elevation: 8,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/services");
          },
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) => <CalendarCheck size={24} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push("/bookings");
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
