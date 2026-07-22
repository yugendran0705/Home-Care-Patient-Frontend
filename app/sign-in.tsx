import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "@/components/ui/icon";
import { Image } from "@/components/ui/image";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Link, router } from "expo-router"; // Using Link for navigation with Expo Router
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import logoImage from "../assets/images/HC_logo.png";
import data from "../config.js";
import { Colors } from "../constants/Colors";

const SignInScreen = () => {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // State for the input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(50);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const footerOpacity = useSharedValue(0);
  const footerTranslateY = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withTiming(0, { duration: 600 });

    formOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(200, withTiming(0, { duration: 600 }));

    footerOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    footerTranslateY.value = withDelay(600, withTiming(0, { duration: 600 }));
  }, [
    footerOpacity,
    footerTranslateY,
    formOpacity,
    formTranslateY,
    headerOpacity,
    headerTranslateY,
  ]);

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

  const handleSignIn = async () => {
    // Prevent multiple presses while loading
    if (loading) return;

    // Reset previous errors
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${data.apiUrl}/users/login`, {
        email,
        password,
      });
      // Assuming the response body has access_token and refresh_token
      const { access_token, refresh_token } = response.data;
      // Securely store the tokens
      await AsyncStorage.setItem(
        "access_token",
        JSON.stringify({ access_token }),
      );
      await AsyncStorage.setItem(
        "refresh_token",
        JSON.stringify({ refresh_token }),
      );

      // Navigate to the main part of the app on success
      router.push("/(tabs)/profile"); // Adjust this path based on your app structure
    } catch (e: any) {
      // Set a user-friendly error message
      const errorMessage =
        (e.response &&
          e.response.data &&
          (e.response.data.message || e.response.data.error)) ||
        "Invalid credentials or network error.";
      setError(errorMessage);
    } finally {
      // Ensure loading is always turned off
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          // keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          // style={{ flex: 1 }} // Use explicit style here instead of className
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              // paddingBottom: 40
            }} // Added paddingBottom for extra keyboard clearance
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <VStack className="items-center flex-1 mx-5">
              {/* Top Section / Logo */}
              <Animated.View
                className="items-center"
                style={headerAnimatedStyle}
              >
                <Box className="justify-center items-center py-20">
                  <Box className="w-24 h-24 mb-4">
                    <Image
                      source={logoImage}
                      className="w-full h-full"
                      alt="HomeCare Logo"
                      resizeMode="contain"
                    />
                  </Box>
                  <ThemedText
                    type="title"
                    className="text-center"
                    style={{
                      fontSize: 48,
                      fontFamily:
                        Platform.OS === "ios"
                          ? "Avenir Next"
                          : "sans-serif-condensed",
                      color: colors.text,
                    }}
                  >
                    HomeCare
                  </ThemedText>
                  <ThemedText
                    type="default"
                    style={{ color: colors.text, fontSize: 18 }}
                    className="mt-[20px] mb-[20px] w-full text-center"
                  >
                    Welcome back, please sign in
                  </ThemedText>
                </Box>
              </Animated.View>
              {/* Form Section */}

              <VStack
                space="lg"
                style={{ backgroundColor: colors.secondaryBackground }}
                className="w-full mt-5 px-8 py-10 rounded-3xl items-center"
              >
                <FormControl
                  size="lg"
                  className="w-full text-red-500"
                  isInvalid={!!error}
                >
                  <Animated.View
                    className="w-full mb-[16px]"
                    style={formAnimatedStyle}
                  >
                    {/* Email Field */}
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{
                          fontFamily: "Sen-Regular",
                          color: colors.text,
                        }}
                        className=" uppercase leading-10"
                      >
                        Email Address
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      className="my-1 rounded-xl h-14 pl-4 border-0"
                      size="md"
                      style={{ backgroundColor: colors.background }}
                    >
                      <InputSlot>
                        <InputIcon as={MailIcon} color={colors.text} />
                      </InputSlot>
                      <InputField
                        placeholder="example@gmail.com"
                        placeholderTextColor={colors.textSecondary}
                        cursorColor={colors.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{
                          fontFamily: "Sen-Regular",
                          color: colors.text,
                        }}
                      />
                    </Input>

                    {/* Password Input Field */}
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{
                          fontFamily: "Sen-Regular",
                          color: colors.text,
                        }}
                        className=" uppercase leading-10"
                      >
                        Password
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      style={{ backgroundColor: colors.background }}
                      className="my-1 rounded-xl h-14 pl-4 pr-4 border-0"
                      size="md"
                    >
                      <InputSlot>
                        <InputIcon as={LockIcon} color={colors.text} />
                      </InputSlot>
                      <InputField
                        style={{
                          fontFamily: "Sen-Regular",
                          color: colors.text,
                        }}
                        placeholder="********"
                        placeholderTextColor={colors.textSecondary}
                        cursorColor={colors.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <InputSlot onPress={handleState}>
                        <InputIcon
                          as={showPassword ? EyeIcon : EyeOffIcon}
                          color={colors.text}
                        />
                      </InputSlot>
                    </Input>

                    {/* Error Message */}
                    {!!error && (
                      <Box className="w-full min-h-[44px] rounded-xl bg-red-50 px-3 py-2 justify-center mt-2">
                        <ThemedText
                          type="caption"
                          className="text-red-600"
                          style={{ fontSize: 13, lineHeight: 20 }}
                        >
                          {error}
                        </ThemedText>
                      </Box>
                    )}

                    {/* Submit Button */}
                    <Button
                      style={{
                        backgroundColor: colors.secondaryBackgroundGradient,
                      }}
                      className="w-full rounded-xl h-14 mt-8 active:opacity-70"
                      onPress={handleSignIn}
                      isDisabled={loading}
                    >
                      {loading ? (
                        <ButtonSpinner color="white" />
                      ) : (
                        <ButtonText
                          style={{ fontFamily: "Sen-Bold", color: colors.text }}
                          className=" text-xl"
                        >
                          Sign In
                        </ButtonText>
                      )}
                    </Button>

                    {/* Sign Up Link */}
                    <Animated.View style={footerAnimatedStyle}>
                      <Box className="flex-row justify-center mt-8">
                        <ThemedText type="default" style={{ color: colors.text }}>
                          Don&apos;t have an account?{" "}
                        </ThemedText>
                        <Link href="/sign-up" asChild>
                          <Pressable>
                            <ThemedText
                              type="defaultBold"
                              style={{ color: colors.text }}
                            >
                              Sign Up
                            </ThemedText>
                          </Pressable>
                        </Link>
                      </Box>
                    </Animated.View>
                  </Animated.View>
                </FormControl>
              </VStack>
            </VStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default SignInScreen;
