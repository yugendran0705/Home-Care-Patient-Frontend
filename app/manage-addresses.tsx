import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import React, { useCallback, useState } from "react";
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
import axiosInstance from "../axiosInstance";
interface Address {
  id: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  is_primary: boolean;
}

const ManageAddressesScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const loadFromAsyncStorage = useCallback(async () => {
    try {
      const response = await AsyncStorage.getItem("addresses");
      if (response) {
        const data = JSON.parse(response);
        setAddresses([...data].reverse());
      } else {
        const response = await axiosInstance.get("/addresses/me");
        setAddresses([...response.data].reverse());
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      Alert.alert("Error", "Failed to fetch addresses.");
      console.error(e);
    }
  }, [fadeAnim]);

  const fetchData = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/addresses/me");
      setAddresses([...response.data].reverse());
      await AsyncStorage.setItem("addresses", JSON.stringify(response.data));
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      Alert.alert("Error", "Failed to fetch addresses.");
      console.error(e);
    }
  }, [fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      const initialLoad = async () => {
        setLoading(true);
        await loadFromAsyncStorage();
        setLoading(false);
      };
      initialLoad();
    }, [loadFromAsyncStorage]),
  );

  const handleSetPrimary = async (addressId: string) => {
    Alert.alert(
      "Set Primary Address",
      "Are you sure you want to set this address as primary?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "default",

          onPress: async () => {
            setLoading(true);
            try {
              await axiosInstance.patch(`/addresses/set_primary/${addressId}`);
              Alert.alert("Success", "Primary address updated.");
              await fetchData();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.response?.data?.detail ??
                  "Failed to update primary address.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
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

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <Box className="flex-row gap-4 items-center px-3 mt-5">
            <Pressable onPress={() => router.back()} className="ml-2">
              <Icon as={ArrowLeft} size="xl" color={colors.textInverted} />
            </Pressable>
            <Text
              className="text-2xl font-semibold "
              style={{ fontFamily: "Sen-Bold", color: colors.textInverted }}
            >
              Manage Addresses
            </Text>
          </Box>
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#000"]}
                tintColor={"#fff"}
              />
            }
          >
            {addresses.map((addr) => (
              <VStack
                key={addr.id}
                style={{ backgroundColor: colors.secondaryBackground }}
                className="rounded-[14px] p-[20px] mb-[20px] relative"
              >
                <Box>
                  <Text
                    style={{ fontFamily: "Sen-Bold", color: colors.text }}
                    className="text-[16px] mb-[4px]"
                  >
                    {addr.address_line_1}, {addr.address_line_2}
                  </Text>
                  <Text
                    style={{ fontFamily: "Sen-Regular", color: colors.text }}
                    className="text-[14px]"
                  >
                    {addr.city}, {addr.pincode}
                  </Text>
                </Box>

                {addr.is_primary && (
                  <Box className="absolute top-[15px] right-[15px] bg-[#4CAF50] rounded-[10px] px-[8px] py-[4px]">
                    <Text
                      style={{ fontFamily: "Sen-Bold", color: colors.text }}
                      className=" text-[12px]"
                    >
                      Primary
                    </Text>
                  </Box>
                )}

                <Divider className="bg-gray-300 my-2" />

                <Box className="flex-row justify-end pt-[15px]">
                  {!addr.is_primary && (
                    <Button
                      className="px-[15px] py-[8px] ml-[10px] rounded-[8px] active:opacity-70"
                      style={{ backgroundColor: colors.background }}
                      onPress={() => handleSetPrimary(addr.id)}
                    >
                      <ButtonText
                        style={{
                          fontFamily: "Sen-Bold",
                          color: colors.text,
                        }}
                      >
                        Set as Primary
                      </ButtonText>
                    </Button>
                  )}
                  <Button
                    className="px-[15px] py-[8px] ml-[10px] bg-[#192f6a] rounded-[8px] active:opacity-70"
                    style={{ backgroundColor: colors.background }}
                    onPress={() =>
                      router.push({
                        pathname: "/address-form",
                        params: { addressId: addr.id },
                      })
                    }
                  >
                    <ButtonText
                      style={{
                        fontFamily: "Sen-Bold",
                        color: colors.text,
                      }}
                    >
                      Edit
                    </ButtonText>
                  </Button>
                </Box>
              </VStack>
            ))}

            <Button
              className="flex-row py-[15px] rounded-[14px] items-center justify-center mt-[10px] h-auto active:opacity-70"
              style={{
                backgroundColor: colors.secondaryBackgroundGradient,
              }}
              onPress={() => router.push("/address-form")}
            >
              <ButtonIcon as={Plus} className="mr-[10px]" color={colors.text} />
              <ButtonText
                style={{ fontFamily: "Sen-Bold", color: colors.text }}
                className=" text-[18px]"
              >
                Add New Address
              </ButtonText>
            </Button>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ManageAddressesScreen;
