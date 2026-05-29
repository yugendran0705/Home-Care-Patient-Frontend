import data from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import axios from "axios";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/Colors";
import { ArrowLeft, ArrowRight, Mars, Venus } from "lucide-react-native";
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const initialFormData = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  date_of_birth: "",
  gender: "",
  address: {
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    latitude: 13.0403,
    longitude: 80.2336,
  },
};

const SignUpScreen = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  // --- State for the Date Picker ---
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const scale = useSharedValue(1);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleButtonPressIn = () => {
    scale.value = withSpring(0.95);
  };
  const handleButtonPressOut = () => {
    scale.value = withSpring(1);
  };

  const actionButtonShadow = {
    backgroundColor: colors.secondaryBackgroundGradient,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  };

  useEffect(() => {
    const getLocation = async () => {
      if (
        formData.address.latitude !== 13.0403 ||
        formData.address.longitude !== 80.2336
      ) {
        return;
      }
      setIsFetchingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access location was denied");
        handleAddressChange("latitude", 13.0403);
        handleAddressChange("longitude", 80.2336);
        setIsFetchingLocation(false);
        return;
      }
      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        handleAddressChange("latitude", currentLocation.coords.latitude);
        handleAddressChange("longitude", currentLocation.coords.longitude);
      } catch (e: any) {
        console.log(e);
        setError("Could not fetch location. Please select it on the map.");
        handleAddressChange("latitude", 13.0403);
        handleAddressChange("longitude", 80.2336);
      } finally {
        setIsFetchingLocation(false);
      }
    };
    if (step === 2) {
      getLocation();
    }
  }, [formData.address.latitude, formData.address.longitude, step]);

  // --- Handler for the Date Picker ---
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // On iOS, the picker can be persistent
    if (selectedDate) {
      const currentDate = selectedDate || date;
      setDate(currentDate);

      // Format the date to YYYY-MM-DD for the API
      let tempDate = new Date(currentDate);
      let fDate = `${tempDate.getFullYear()}-${(tempDate.getMonth() + 1).toString().padStart(2, "0")}-${tempDate.getDate().toString().padStart(2, "0")}`;
      handleFormChange("date_of_birth", fDate);
    }
  };

  const handleAddressChange = (field: string, value: string | number) => {
    setError("");
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleFormChange = (field: string, value: string) => {
    setError("");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
  };

  const handleNextStep = () => {
    scale.value = withSpring(1);
    if (step === 1) {
      if (
        !formData.email ||
        !formData.password ||
        !formData.first_name ||
        !formData.last_name ||
        !formData.date_of_birth ||
        !formData.phone_number ||
        !formData.gender
      ) {
        setError("Please fill all required fields.");
        return;
      }
      if (formData.phone_number.length !== 10) {
        setError("Phone number must be 10 digits.");
        return;
      }
      if (!validateEmail(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!validatePassword(formData.password)) {
        setError(
          "Password must be at least 8 characters, include at least one letter, one number, and one special character.",
        );
        return;
      }
    }

    setError("");
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError("");
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      router.back();
    }
  };

  const handleSignUp = async () => {
    if (loading) return;
    setError("");

    if (
      !formData.address.address_line_1 ||
      !formData.address.city ||
      !formData.address.pincode
    ) {
      setError("Please fill all required address fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${data.apiUrl}/patients/`, formData);
      const { access_token, refresh_token } = response.data;
      await AsyncStorage.setItem(
        "access_token",
        JSON.stringify({ access_token }),
      );
      await AsyncStorage.setItem(
        "refresh_token",
        JSON.stringify({ refresh_token }),
      );

      Alert.alert(
        "Success!",
        "Your account has been created. Please sign in.",
        [{ text: "OK", onPress: () => router.push("/(tabs)/profile") }],
      );
    } catch (e: any) {
      const errorMessage = e.response
        ? e.response.data.detail
        : "Registration failed. Please try again.";
      setError(errorMessage);
      // console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLocation = async () => {
    if (isGeocoding) return;
    setIsGeocoding(true);
    setError("");
    try {
      const geocoded = await Location.reverseGeocodeAsync({
        latitude: formData.address.latitude,
        longitude: formData.address.longitude,
      });

      if (geocoded.length > 0) {
        const geo = geocoded[0];
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            address_line_1:
              `${geo.streetNumber || ""} ${geo.street || ""}`.trim(),
            city: geo.city || "",
            state: geo.region || "",
            pincode: geo.postalCode || "",
            country: geo.country || "India",
          },
        }));
      }
      setStep(3); // Move to the form step
    } catch (e: any) {
      console.warn("Reverse geocoding error: ", e?.response?.data || e.message);
      Alert.alert(
        "Error",
        "Could not determine address from location. Please enter it manually.",
      );
      setStep(3);
    } finally {
      setIsGeocoding(false);
    }
  };

  const renderStepOne = () => (
    <>
      <Text
        style={{ fontFamily: "Sen-Bold", color: colors.text }}
        className="text-2xl font-semibold  mb-5 text-center"
      >
        Step 1: Personal Details
      </Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            className="text-md uppercase font-Sen-Regular"
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
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            placeholder="eg: Dhruva"
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            value={formData.first_name}
            onChangeText={(text) => handleFormChange("first_name", text)}
            type="text"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            className="text-md uppercase font-Sen-Regular"
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
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            placeholder="eg: U R"
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            value={formData.last_name}
            onChangeText={(text) => handleFormChange("last_name", text)}
            type="text"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            className="text-md uppercase font-Sen-Regular"
          >
            Email
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
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            placeholder="eg: example@gmail.com"
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            value={formData.email}
            onChangeText={(text) => handleFormChange("email", text)}
            autoCapitalize="none"
            type="text"
            keyboardType="email-address"
          />
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            className="text-md uppercase font-Sen-Regular"
          >
            Password
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
          className="my-1 rounded-xl h-16 pl-2 pr-4 border-0"
          size="md"
        >
          <InputField
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            // type={isPasswordVisible ? "text" : "password"}
            secureTextEntry={!isPasswordVisible}
            placeholder="eg: ********"
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            value={formData.password}
            onChangeText={(text) => handleFormChange("password", text)}
          />
          <InputSlot onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <InputIcon
              color={colors.text}
              as={isPasswordVisible ? EyeIcon : EyeOffIcon}
            />
          </InputSlot>
        </Input>
      </FormControl>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            className="text-md uppercase font-Sen-Regular"
          >
            Phone
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
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            placeholder="eg: 9876543210"
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            value={formData.phone_number}
            onChangeText={(text) => handleFormChange("phone_number", text)}
            keyboardType="phone-pad"
            type="text"
          />
        </Input>
      </FormControl>

      <Pressable onPress={() => setShowDatePicker(true)}>
        <Text
          style={{ fontFamily: "Sen-Regular", color: colors.text }}
          className="text-md uppercase font-Sen-Regular mb-2"
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
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
            className="text-md"
          >
            {formData.date_of_birth || "Select date of birth"}
          </Text>
        </Box>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}
      <Text
        style={{ fontFamily: "Sen-Regular", color: colors.text }}
        className="text-md uppercase font-Sen-Regular mb-2"
      >
        Gender
      </Text>
      <Box className="flex-row justify-between gap-4 mb-[15px]">
        {["Male", "Female"].map((g) => {
          const isActive = formData.gender === g;

          return (
            <Button
              key={g}
              onPress={() => handleFormChange("gender", g)}
              className={`h-16 flex-1 rounded-xl flex-row items-center justify-center bg-transparent border border-white/50`}
              variant="solid"
              style={{
                backgroundColor: !isActive
                  ? colors.background
                  : colors.secondaryBackground,
              }}
            >
              <ButtonIcon
                as={g === "Male" ? Mars : Venus}
                className={`mr-2 `}
                style={{ color: colors.text }}
              />

              <ButtonText
                style={{ fontFamily: "Sen-Regular", color: colors.text }}
                className={`text-[16px] font-medium `}
              >
                {g}
              </ButtonText>
            </Button>
          );
        })}
      </Box>
    </>
  );

  const renderStepThree = () => (
    <>
      <Text
        style={{ fontFamily: "Sen-Bold", color: colors.text }}
        className="text-2xl font-semibold mb-5 text-center"
      >
        Step 3: Address
      </Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase"
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
          >
            Address Line 1
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
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Address Line 1"
            value={formData.address.address_line_1}
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            onChangeText={(v) => handleAddressChange("address_line_1", v)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase "
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
          >
            Address Line 2 (Optional)
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
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Address Line 2"
            value={formData.address.address_line_2}
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            onChangeText={(v) => handleAddressChange("address_line_2", v)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase"
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
          >
            City
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
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="City"
            value={formData.address.city}
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            onChangeText={(v) => handleAddressChange("city", v)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase"
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
          >
            State
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
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="State"
            value={formData.address.state}
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            onChangeText={(v) => handleAddressChange("state", v)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase "
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
          >
            Pincode
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
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Pincode"
            value={formData.address.pincode}
            maxLength={6}
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            onChangeText={(v) => handleAddressChange("pincode", v)}
            keyboardType="number-pad"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase"
            style={{ fontFamily: "Sen-Regular", color: colors.text }}
          >
            Country
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
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Country"
            placeholderTextColor={colors.textSecondary}
            cursorColor={colors.textSecondary}
            value={formData.address.country}
            onChangeText={(v) => handleAddressChange("country", v)}
          />
        </Input>
      </FormControl>
    </>
  );

  const renderStepTwo = () => (
    <Box className="flex-1 min-h-[500px]">
      <Text
        style={{ fontFamily: "Sen-Bold", color: colors.text }}
        className="text-2xl font-semibold mb-5 text-center"
      >
        Step 2: Pin Your Location
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
        className="flex-1 rounded-[14px] overflow-hidden justify-center items-center mb-5"
      >
        <MapView
          style={{ width: "100%", height: "100%" }}
          region={{
            latitude: formData.address.latitude,
            longitude: formData.address.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => {
            // let user drop pin by tapping the map
            handleAddressChange("latitude", e.nativeEvent.coordinate.latitude);
            handleAddressChange(
              "longitude",
              e.nativeEvent.coordinate.longitude,
            );
          }}
        >
          <Marker
            draggable
            coordinate={{
              latitude: formData.address.latitude,
              longitude: formData.address.longitude,
            }}
            onDragEnd={(e) => {
              handleAddressChange(
                "latitude",
                e.nativeEvent.coordinate.latitude,
              );
              handleAddressChange(
                "longitude",
                e.nativeEvent.coordinate.longitude,
              );
            }}
          />
        </MapView>
        {(isFetchingLocation || isGeocoding) && (
          <Box
            className="absolute inset-0 items-center justify-center "
            style={{ backgroundColor: colors.secondaryBackground }}
          >
            <ActivityIndicator size="large" color={colors.text} />
          </Box>
        )}
      </Box>
      <Button
        style={{
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 4,
          backgroundColor: colors.secondaryBackgroundGradient,
        }}
        className="h-[55px] rounded-[14px] items-center justify-center mt-[10px]"
        onPress={handleConfirmLocation}
        isDisabled={isFetchingLocation || isGeocoding}
      >
        {isGeocoding ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text
            style={{ fontFamily: "Sen-Bold", color: colors.text }}
            className="text-[18px]"
          >
            Confirm Location
          </Text>
        )}
      </Button>
    </Box>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ backgroundColor: colors.background }}
        className="flex-1 h-full"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 40,
              justifyContent: "center",
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              className="flex-1"
              key={step}
              entering={FadeInRight.duration(500)
                .delay(200)
                .easing(Easing.out(Easing.exp))}
              exiting={FadeOutLeft.duration(200).easing(Easing.in(Easing.exp))}
            >
              <View
                className={`flex-row items-center justify-center mb-5 relative min-h-[50px] ${Platform.OS === "android" ? "mt-5" : "mt-0"}`}
              >
                <Text
                  className="text-[28px] text-center"
                  style={{ fontFamily: "Sen-Bold", color: "#fff" }}
                >
                  Create Account
                </Text>
              </View>

              {step === 1 && renderStepOne()}
              {step === 2 && renderStepTwo()}
              {step === 3 && renderStepThree()}

              {error ? (
                <Box className="bg-white/70 rounded-2xl border border-white/20">
                  <Text
                    style={{ fontFamily: "Sen-Regular", color: colors.error }}
                    className="text-red-500 text-center my-[10px] text-[14px]"
                  >
                    {error}
                  </Text>
                </Box>
              ) : null}

              <Animated.View className="mt-5" style={buttonAnimatedStyle}>
                <Box className="flex-row justify-center gap-10">
                  <Button
                    className="h-[55px] w-[120px] rounded-[14px] items-center active:opacity-70"
                    style={actionButtonShadow}
                    onPress={handlePrevStep}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                  >
                    <ButtonIcon color={colors.text} as={ArrowLeft} />
                    <ButtonText
                      style={{ fontFamily: "Sen-Bold", color: colors.text }}
                      size="xl"
                    >
                      Prev
                    </ButtonText>
                  </Button>
                  {step < 3 ? (
                    <Button
                      className="h-[55px] rounded-[14px] items-center w-[120px] active:opacity-70"
                      style={actionButtonShadow}
                      isDisabled={loading || isGeocoding}
                      onPress={handleNextStep}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                    >
                      <ButtonText
                        style={{ fontFamily: "Sen-Bold", color: colors.text }}
                        size="xl"
                      >
                        Next
                      </ButtonText>
                      <ButtonIcon color={colors.text} as={ArrowRight} />
                    </Button>
                  ) : (
                    <Button
                      className=" h-[55px] w-[120px] rounded-[14px] items-center active:opacity-70"
                      style={actionButtonShadow}
                      isDisabled={loading}
                      onPress={handleSignUp}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.text} />
                      ) : (
                        <ButtonText
                          style={{ fontFamily: "Sen-Bold", color: colors.text }}
                          className="text-xl"
                        >
                          Sign Up
                        </ButtonText>
                      )}
                    </Button>
                  )}
                </Box>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default SignUpScreen;
