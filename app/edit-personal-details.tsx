import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Platform,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import axiosInstance from "../axiosInstance";

import { Box } from "@/components/ui/box";
import {
    Button,
    ButtonIcon,
    ButtonSpinner,
    ButtonText,
} from "@/components/ui/button";
import {
    FormControl,
    FormControlLabel,
    FormControlLabelText,
} from "@/components/ui/form-control";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Colors } from "@/constants/Colors";
import { ArrowLeft, Mars, Venus } from "lucide-react-native";

interface PersonalDetails {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
}

const EditPersonalDetailsScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [details, setDetails] = useState<PersonalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Date Picker States
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchCurrentDetails = async () => {
      try {
        const response = await axiosInstance.get("/patients/me");
        const fetchedDetails = {
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          phone_number: response.data.phone_number,
          date_of_birth: response.data.date_of_birth,
          gender: response.data.gender,
        };
        setDetails(fetchedDetails);

        if (fetchedDetails.date_of_birth) {
          setDate(new Date(fetchedDetails.date_of_birth));
        }
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } catch (e: any) {
        Alert.alert("Error", e?.response?.data.detail);
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentDetails();
  }, [fadeAnim]);

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
      const fDate = selectedDate.toISOString().split("T")[0];
      handleDetailsChange("date_of_birth", fDate);
    }
  };

  const handleDetailsChange = (field: keyof PersonalDetails, value: string) => {
    setDetails((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (
      !details?.date_of_birth ||
      !details?.first_name ||
      !details?.gender ||
      !details?.last_name ||
      !details?.phone_number
    ) {
      setError("Please enter any one of the fields!");
      return;
    }
    Alert.alert(
      "Update Personal Details",
      "Are you sure you want to save this?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          style: "destructive",

          onPress: async () => {
            setLoading(true);
            try {
              await axiosInstance.put("/patients/me", details);
              Alert.alert("Success", "Your details have been updated.");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.response.data.detail);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  if (loading || !details) {
    return (
      <Box className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color={colors.text} />
      </Box>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Box className="flex-row gap-4 items-center px-3 mt-5">
            <Pressable onPress={() => router.back()} className="ml-2">
              <Icon as={ArrowLeft} size="xl" />
            </Pressable>
            <Text
              className="text-2xl"
              style={{ fontFamily: "Sen-Bold", color: colors.text }}
            >
              Edit Personal Details
            </Text>
          </Box>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <FormControl size="lg" className="w-full mb-2">
              <FormControlLabel>
                <FormControlLabelText
                  className="text-md uppercase"
                  style={{ fontFamily: "Sen-Regular", color: colors.text }}
                >
                  First Name
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                style={{
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  backgroundColor: colors.secondaryBackground,
                }}
                className="my-1 rounded-xl h-16 pl-2 border-0"
                size="md"
              >
                <InputField
                  cursorColor={colors.textSecondary}
                  style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                  value={details.first_name}
                  onChangeText={(v) => handleDetailsChange("first_name", v)}
                  placeholder="Enter firstname"
                  placeholderTextColor={colors.textSecondary}
                />
              </Input>
            </FormControl>
            <FormControl size="lg" className="w-full mb-2">
              <FormControlLabel>
                <FormControlLabelText
                  className="text-md uppercase"
                  style={{ fontFamily: "Sen-Regular", color: colors.text }}
                >
                  Last Name
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                style={{
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  backgroundColor: colors.secondaryBackground,
                }}
                className="my-1 rounded-xl h-16 pl-2 border-0"
                size="md"
              >
                <InputField
                  cursorColor={colors.textSecondary}
                  style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                  value={details.last_name}
                  onChangeText={(v) => handleDetailsChange("last_name", v)}
                  placeholder="Enter lastname"
                  placeholderTextColor={colors.textSecondary}
                />
              </Input>
            </FormControl>
            <FormControl size="lg" className="w-full mb-2">
              <FormControlLabel>
                <FormControlLabelText
                  className="text-md uppercase"
                  style={{ fontFamily: "Sen-Regular", color: colors.text }}
                >
                  Phone Number
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                style={{
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  backgroundColor: colors.secondaryBackground,
                }}
                className="my-1 rounded-xl h-16 pl-2 border-0"
                size="md"
              >
                <InputField
                  cursorColor={colors.textSecondary}
                  style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                  value={details.phone_number}
                  onChangeText={(v) => handleDetailsChange("phone_number", v)}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="Enter number"
                  placeholderTextColor={colors.textSecondary}
                />
              </Input>
            </FormControl>
            {/* Date of Birth Picker */}
            <Pressable onPress={() => setShowDatePicker(true)}>
              <Text
                style={{
                  fontFamily: "Sen-Regular",
                  color: colors.textInverted,
                }}
                className="text-md uppercase mb-2"
              >
                Date of birth
              </Text>
              <Box
                style={{
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 4,
                  backgroundColor: colors.secondaryBackground,
                }}
                className="h-16 rounded-[14px] px-[15px] mb-[15px] mt-1 justify-center"
              >
                <Text
                  style={{
                    fontFamily: "Sen-Regular",
                    color: colors.text,
                  }}
                >
                  {details.date_of_birth || "Select Date of Birth"}
                </Text>
              </Box>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode={"date"}
                display="default"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />
            )}
            {/* Gender Selection */}
            <Text
              style={{ fontFamily: "Sen-Regular", color: colors.text }}
              className="text-md uppercase mb-2"
            >
              Gender
            </Text>
            <Box className="flex-row justify-between gap-4 mb-6">
              {["Male", "Female"].map((g) => {
                const isActive = details.gender === g;
                return (
                  <Box key={g} className="flex-1 rounded-[16px] p-[3px]">
                    <Button
                      onPress={() => handleDetailsChange("gender", g)}
                      variant="solid"
                      className="h-[50px] rounded-[14px] flex-row items-center justify-center border border-white/20"
                      style={{
                        backgroundColor: isActive
                          ? colors.secondaryBackground
                          : "transparent",
                        borderWidth: isActive ? 0 : 1,
                        borderColor: "rgba(255,255,255,0.2)",
                      }}
                    >
                      <ButtonIcon
                        as={g === "Male" ? Mars : Venus}
                        className={`mr-[8px]`}
                        style={{ color: colors.text }}
                      />
                      <ButtonText
                        style={{
                          fontFamily: "Sen-Regular",
                          color: colors.text,
                        }}
                        className={`text-[16px] font-medium `}
                      >
                        {g}
                      </ButtonText>
                    </Button>
                  </Box>
                );
              })}
            </Box>
            {error ? (
              <Text
                style={{ color: colors.error, fontFamily: "Sen-Regular" }}
                className="text-center mb-4 bg-white/10 rounded-lg p-2"
              >
                {error}
              </Text>
            ) : null}
            <Button
              onPress={handleSave}
              style={{
                backgroundColor: colors.secondaryBackgroundGradient,
              }}
              className=" h-16 rounded-[14px] items-center shadow-lg active:opacity-70"
              isDisabled={loading}
            >
              {loading ? (
                <ButtonSpinner color={colors.text} />
              ) : (
                <ButtonText
                  style={{ fontFamily: "Sen-Bold", color: colors.text }}
                  className="text-xl"
                >
                  Save Changes
                </ButtonText>
              )}
            </Button>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default EditPersonalDetailsScreen;
