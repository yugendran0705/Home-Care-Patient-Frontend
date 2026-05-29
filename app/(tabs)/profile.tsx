import axiosInstance from "@/axiosInstance";
import { Box } from "@/components/ui/box";
import { Button, ButtonIcon } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, router } from "expo-router";
import {
  CalendarDays,
  Edit,
  LocationEdit,
  LogOut,
  Mars,
  Phone,
  Venus,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchData = useCallback(async () => {
    try {
      // Fetch profile and addresses in parallel
      const [profileResponse, addressResponse] = await Promise.all([
        axiosInstance.get("/patients/me"),
        axiosInstance.get("/addresses/me"),
      ]);
      setProfile(profileResponse.data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      setAddresses([...addressResponse.data].reverse());
      setError("");
    } catch (e: any) {
      setError("Failed to fetch data. Please try again.");
      console.error(e);
    }
  }, [fadeAnim]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
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
      <Box className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#4c8bf5" />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text
          className="text-center text-[16px] mb-[20px]"
          style={{ color: colors.text }}
        >
          {error}
        </Text>
        <Pressable onPress={() => router.replace("/sign-in")}>
          <Text className="text-[16px] medium" style={{ color: colors.text }}>
            Go to Sign In
          </Text>
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
              <Box className="w-[100px] h-[100px] rounded-full bg-white/20 justify-center items-center mb-[15px] border-[3px] border-white">
                <Text
                  style={{ fontFamily: "Sen-Bold" }}
                  className="text-white text-[40px]"
                >
                  {profile.first_name.charAt(0)}
                  {profile.last_name.charAt(0)}
                </Text>
              </Box>
              <Text
                style={{ fontFamily: "Sen-Bold", color: colors.text }}
                className="text-[26px] "
              >
                {profile.first_name} {profile.last_name}
              </Text>
              <Text
                style={{
                  fontFamily: "Sen-Regular",
                  color: colors.textMutedInverted,
                }}
                className="text-[16px] text-white/80 mt-[4px]"
              >
                {profile.user.email}
              </Text>
            </Box>

            <VStack
              space="lg"
              style={{ backgroundColor: colors.secondaryBackground }}
              className="rounded-[12px] p-6 mb-4"
            >
              <Box className="flex-row justify-between items-center mb-1">
                <Text
                  style={{ fontFamily: "Sen-Bold", color: colors.text }}
                  className="text-[18px]"
                >
                  Personal Details
                </Text>
                <Link href="/edit-personal-details" asChild>
                  <Pressable>
                    <Icon as={Edit} style={{ color: colors.text }} size="lg" />
                  </Pressable>
                </Link>
              </Box>
              <Divider style={{ backgroundColor: colors.text }} />
              <Box className="flex-row items-center gap-4">
                <Icon as={Phone} style={{ color: colors.text }} />
                <Text
                  style={{ fontFamily: "Sen-Regular", color: colors.text }}
                  className="text-lg"
                >
                  {profile.phone_number}
                </Text>
              </Box>

              <Box className="flex-row items-center gap-4">
                <Icon as={CalendarDays} style={{ color: colors.text }} />
                <Text
                  style={{ fontFamily: "Sen-Regular", color: colors.text }}
                  className="text-lg"
                >
                  {profile.date_of_birth
                    ? (() => {
                        const dob = new Date(profile.date_of_birth);
                        return isNaN(dob.getTime())
                          ? "Not provided"
                          : dob.toLocaleDateString();
                      })()
                    : "Not provided"}{" "}
                </Text>
              </Box>

              <Box className="flex-row items-center gap-4">
                <Icon
                  as={profile.gender === "Male" ? Mars : Venus}
                  style={{ color: colors.text }}
                />
                <Text
                  style={{ fontFamily: "Sen-Regular", color: colors.text }}
                  className="text-lg"
                >
                  {profile.gender}
                </Text>
              </Box>
            </VStack>

            <VStack
              space="lg"
              style={{ backgroundColor: colors.secondaryBackground }}
              className="rounded-[12px] p-6 mb-4"
            >
              <Box className="flex-row justify-between items-center mb-1">
                <Text
                  style={{ fontFamily: "Sen-Bold", color: colors.text }}
                  className="text-[18px]"
                >
                  My Addresses
                </Text>
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
                  {addresses.map((addr) => (
                    <Box
                      key={addr.id}
                      className="flex-row items-start gap-4 p-2 rounded-lg"
                      style={{
                        backgroundColor: colors.secondaryBackgroundGradient,
                      }}
                    >
                      <Icon
                        as={LocationEdit}
                        style={{ color: colors.text }}
                        className=" mt-1"
                      />
                      <Box className="flex-1 flex-row items-start justify-between">
                        <Text
                          style={{
                            fontFamily: "Sen-Regular",
                            color: colors.text,
                          }}
                          className="text-lg"
                        >
                          {addr.address_line_1
                            ? `${addr.address_line_1},\n`
                            : ""}
                          {addr.city},{"\n"}
                          {addr.state},{"\n"}
                          {addr.pincode}.
                        </Text>
                        {addr.is_primary && (
                          <Box
                            style={{ backgroundColor: colors.success }}
                            className="rounded-[10px] px-2 py-1"
                          >
                            <Text
                              style={{ fontFamily: "Sen-Bold" }}
                              className="text-white text-[10px]"
                            >
                              Primary
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}
                </ScrollView>
              </Box>
            </VStack>

            <Button
              className="py-4 rounded-xl h-15 mt-6 mb-10 active:opacity-70"
              onPress={handleLogout}
              style={{ backgroundColor: colors.error }}
            >
              <ButtonIcon
                as={LogOut}
                className=" mr-2"
                style={{ color: colors.text }}
              />
              <Text
                style={{ fontFamily: "Sen-Bold", color: colors.text }}
                className=" text-[18px]"
              >
                Log Out
              </Text>
            </Button>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ProfileScreen;
