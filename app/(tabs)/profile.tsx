import axiosInstance from "@/axiosInstance";
import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { PURPLE_DARK } from "@/constants/serviceTheme";
import { useAlert } from "@/hooks/useAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router, useFocusEffect } from "expo-router";
import {
  CalendarDays,
  Edit,
  LocationEdit,
  LogOut,
  Mars,
  Phone,
  Venus,
} from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

// --- TypeScript Interfaces ---
interface User {
  id: string;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface Address {
  id: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_primary: boolean;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  id: string;
  user: User;
}

const ProfileScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const showAlert = useAlert();
  const isFirstMount = useRef(true);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      // Fetch profile and addresses in parallel
      const [profileResponse, addressResponse] = await Promise.all([
        axiosInstance.get("/patients/me"),
        axiosInstance.get("/addresses/me"),
      ]);
      setProfile(profileResponse.data);
      setAddresses(addressResponse.data);

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        "profile",
        JSON.stringify(profileResponse.data),
      );
      await AsyncStorage.setItem(
        "addresses",
        JSON.stringify(addressResponse.data),
      );

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      setError("");
    } catch (e: any) {
      setError("Failed to fetch data. Please try again.");
      console.error(e);
    }
  }, [fadeAnim]);

  const loadFromAsyncStorage = useCallback(async () => {
    try {
      const profileData = await AsyncStorage.getItem("profile");
      const addressesData = await AsyncStorage.getItem("addresses");

      if (profileData) {
        setProfile(JSON.parse(profileData));
      }
      if (addressesData) {
        setAddresses(JSON.parse(addressesData));
      }

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      setError("");
    } catch (e: any) {
      console.error("Failed to load from AsyncStorage:", e);
      setError("Failed to load data.");
    }
  }, [fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        if (isFirstMount.current) {
          // First mount: fetch from API
          await fetchData();
          isFirstMount.current = false;
        } else {
          // Subsequent mounts: load from AsyncStorage
          await loadFromAsyncStorage();
        }
        setLoading(false);
      };
      loadData();
    }, [fetchData, loadFromAsyncStorage]),
  );

  const handleLogout = () => {
    showAlert("Confirm Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("access_token");
          await AsyncStorage.removeItem("refresh_token");
          await AsyncStorage.removeItem("profile");
          await AsyncStorage.removeItem("addresses");
          router.replace("/sign-in");
        },
      },
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <Box
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={PURPLE_DARK} />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ThemedText
          type="default"
          className="text-center mb-xl"
          style={{ color: colors.text, fontSize: 18 }}
        >
          {error}
        </ThemedText>
        <Pressable onPress={() => router.replace("/sign-in")}>
          <ThemedText
            type="default"
            style={{ color: colors.text, fontSize: 18 }}
          >
            Go to Sign In
          </ThemedText>
        </Pressable>
      </Box>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#000"]} // for Android
              tintColor={"#fff"} // for iOS
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Box className="items-center mb-[30px]">
              <Box
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.secondaryBackground,
                }}
                className="w-[100px] h-[100px] rounded-full justify-center items-center mb-[15px] border-[3px]"
              >
                <ThemedText
                  type="title"
                  style={{ color: colors.textSecondary, fontSize: 48 }}
                >
                  {profile.first_name.charAt(0)}
                  {profile.last_name.charAt(0)}
                </ThemedText>
              </Box>
              <ThemedText type="heading" style={{ color: colors.text }}>
                {profile.first_name} {profile.last_name}
              </ThemedText>
              <ThemedText
                type="small"
                className="mt-1"
                style={{ color: colors.textSecondary }}
              >
                {profile.user.email}
              </ThemedText>
            </Box>

            <VStack
              space="lg"
              style={{ backgroundColor: colors.secondaryBackground }}
              className="rounded-xl p-6 mb-4"
            >
              <Box className="flex-row justify-between items-center mb-1">
                <ThemedText
                  type="subtitle"
                  style={{ color: colors.text, fontSize: 18 }}
                >
                  Personal Details
                </ThemedText>
                <Link href="/edit-personal-details" asChild>
                  <Pressable>
                    <Icon as={Edit} style={{ color: colors.text }} size="lg" />
                  </Pressable>
                </Link>
              </Box>
              <Divider style={{ backgroundColor: colors.text }} />
              <Box className="flex-row items-center gap-4">
                <Icon as={Phone} style={{ color: colors.text }} />
                <ThemedText type="default" style={{ color: colors.text }}>
                  {profile.phone_number}
                </ThemedText>
              </Box>

              <Box className="flex-row items-center gap-4">
                <Icon as={CalendarDays} style={{ color: colors.text }} />
                <ThemedText type="default" style={{ color: colors.text }}>
                  {profile.date_of_birth
                    ? (() => {
                        const dob = new Date(profile.date_of_birth);
                        return isNaN(dob.getTime())
                          ? "Not provided"
                          : dob.toLocaleDateString();
                      })()
                    : "Not provided"}{" "}
                </ThemedText>
              </Box>

              <Box className="flex-row items-center gap-4">
                <Icon
                  as={profile.gender === "Male" ? Mars : Venus}
                  style={{ color: colors.text }}
                />
                <ThemedText type="default" style={{ color: colors.text }}>
                  {profile.gender}
                </ThemedText>
              </Box>
            </VStack>

            <VStack
              space="lg"
              style={{ backgroundColor: colors.secondaryBackground }}
              className="rounded-[12px] p-6 mb-4"
            >
              <Box className="flex-row justify-between items-center mb-1">
                <ThemedText
                  type="subtitle"
                  style={{ color: colors.text, fontSize: 18 }}
                >
                  My Addresses
                </ThemedText>
                <Link href="/manage-addresses" asChild>
                  <Pressable>
                    <Icon as={Edit} style={{ color: colors.text }} size="lg" />
                  </Pressable>
                </Link>
              </Box>
              <Divider style={{ backgroundColor: colors.text }} />
              <Box style={{ maxHeight: 250 }}>
                <ScrollView
                  // showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                  nestedScrollEnabled
                >
                  {addresses?.map((address) => (
                    <Box
                      key={address.id}
                      className="flex-row items-start gap-4 p-2 rounded-lg"
                      style={{
                        backgroundColor: colors.secondaryBackgroundGradient,
                        borderWidth: address.is_primary ? 2 : 0,
                        borderColor: colors.primaryBackground,
                      }}
                    >
                      <Icon as={LocationEdit} style={{ color: colors.text }} />
                      <Box className="flex-1 flex-row items-start justify-between">
                        <ThemedText type="default" style={{ color: colors.text }}>
                          {address.address_line_1
                            ? `${address.address_line_1},\n`
                            : ""}
                          {address.address_line_2
                            ? `${address.address_line_2},\n`
                            : ""}
                          {address.city},{"\n"}
                          {address.state},{"\n"}
                          {address.pincode}.
                        </ThemedText>
                      </Box>
                      {address.is_primary && (
                        <Box
                          style={{ backgroundColor: "#FBBF24" }}
                          className="rounded-[10px] px-2 py-1"
                        >
                          <ThemedText
                            type="captionBold"
                            style={{ color: colors.textPrimary }}
                          >
                            Primary
                          </ThemedText>
                        </Box>
                      )}
                    </Box>
                  ))}
                </ScrollView>
              </Box>
            </VStack>

            <Button
              className="py-4 rounded-xl h-15 mt-6 mb-6 active:opacity-70"
              onPress={handleLogout}
              style={{ backgroundColor: colors.error }}
            >
              <ButtonIcon
                as={LogOut}
                className=" mr-2"
                style={{ color: colors.text }}
              />
              <ThemedText
                type="subtitle"
                style={{ color: colors.text, fontSize: 18 }}
              >
                Log Out
              </ThemedText>
            </Button>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ProfileScreen;
