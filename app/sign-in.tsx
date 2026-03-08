import { Link, router } from 'expo-router'; // Using Link for navigation with Expo Router
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  View,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import data from '../config.js';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Box } from '@/components/ui/box';
import { Image } from '@/components/ui/image';
import { Text } from '@/components/ui/text';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Input, InputField, InputSlot, InputIcon } from '@/components/ui/input';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
} from '@/components/ui/form-control';
import { AlertCircleIcon, LockIcon, MailIcon } from '@/components/ui/icon';
import logoImage from '../assets/images/HC_logo.png';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icon';
import { VStack } from '@/components/ui/vstack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const SignInScreen = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // State for the input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in both fields.');
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
      await AsyncStorage.setItem('access_token', JSON.stringify({ access_token }));
      await AsyncStorage.setItem('refresh_token', JSON.stringify({ refresh_token }));

      // Navigate to the main part of the app on success
      router.push('/(tabs)/profile'); // Adjust this path based on your app structure

    } catch (e: any) {
      // Set a user-friendly error message
      const errorMessage = (e.response && e.response.data && (e.response.data.message || e.response.data.error)) ||
        'Invalid credentials or network error.';
      setError(errorMessage);
      console.error(e); // Log the full error for debugging
    } finally {
      // Ensure loading is always turned off
      setLoading(false);
    }
  };


  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' style={{ backgroundColor: colors.primaryBackground}}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            <VStack className='items-center flex-1 mx-5'>
              {/* Top Section / Logo */}
              <Animated.View
                className="items-center"
                style={headerAnimatedStyle}
              >
                <Box className='justify-center items-center py-20'>
                  <Box className="w-24 h-24 mb-4">
                    <Image
                      source={logoImage}
                      className="w-full h-full"
                      alt="HomeCare Logo"
                      resizeMode="contain"
                    />
                  </Box>
                  <Text
                    className='text-5xl font-bold text-white text-center'
                    style={{ fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed' }}
                  >
                    HomeCare
                  </Text>
                  <Text style={{ fontFamily: "Sen-Regular" }}
                    className="text-[18px] text-white/70 mt-[20px] mb-[20px] w-full text-center"
                  >
                    Welcome back, please sign in
                  </Text>
                </Box>
              </Animated.View>
              {/* Form Section */}

              <VStack space="lg" style={{ backgroundColor: colors.surfaceSecondary }} className="w-full mt-5 px-8 py-10 rounded-3xl items-center">
                <FormControl size="lg" className="w-full text-red-500" isInvalid={!!error}  >
                  <Animated.View
                    className="w-full mb-[16px]"
                    style={formAnimatedStyle}
                  >
                    {/* Email Field */}
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{ fontFamily: "Sen-Regular", color: colors.text }} className=" uppercase leading-10"
                      >
                        Email Address
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input className="my-1 rounded-xl h-14 pl-4 border-0" size="md" style={{ backgroundColor: colors.surface }}>
                      <InputSlot>
                        <InputIcon as={MailIcon} color={colors.icon} />
                      </InputSlot>
                      <InputField
                        type="text"
                        placeholder="example@gmail.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={{ fontFamily: "Sen-Regular", color: colors.text }}
                      />
                    </Input>

                    {/* Password Input Field */}
                    <FormControlLabel>
                      <FormControlLabelText
                        style={{ fontFamily: "Sen-Regular", color: colors.text }} className=" uppercase leading-10"
                      >
                        Password
                      </FormControlLabelText>
                    </FormControlLabel>
                    <Input
                      style={{ backgroundColor: colors.surface }}
                      className="my-1 rounded-xl h-14 pl-4 pr-4 border-0"
                      size="md"
                    >
                      <InputSlot>
                        <InputIcon as={LockIcon} color={colors.icon}/>
                      </InputSlot>
                      <InputField
                        style={{ fontFamily: "Sen-Regular", color: colors.text }}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <InputSlot onPress={handleState}>
                        <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                      </InputSlot>
                    </Input>

                    {/* Error Message */}
                    <FormControlError className="mt-2">
                      <FormControlErrorIcon as={AlertCircleIcon} />
                      <FormControlErrorText style={{ color: colors.error}}>{error}</FormControlErrorText>
                    </FormControlError>

                    {/* Submit Button */}
                    <Button
                      style={{ backgroundColor: colors.accent }}
                      className="w-full rounded-xl h-14 mt-8"
                      onPress={handleSignIn}
                      isDisabled={loading}
                    >
                      {loading ? (
                        <ButtonSpinner color="white" />
                      ) : (
                        <ButtonText
                          style={{ fontFamily: "Sen-Bold" }}
                          className="text-white text-xl"
                        >Sign In</ButtonText>
                      )}
                    </Button>

                    {/* Sign Up Link */}
                    <Animated.View style={footerAnimatedStyle}>
                      <Box className='flex-row justify-center mt-8'>
                        <Text style={{ fontFamily: "Sen-Regular", color: colors.text }} className='text-black'>Don&apos;t have an account? </Text>
                        <Link href="/sign-up" asChild>
                          <Pressable>
                            <Text style={{ fontFamily: "Sen-Bold", color: colors.accent}}>Sign Up</Text>
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
