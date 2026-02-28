import { Link, router } from 'expo-router'; // Using Link for navigation with Expo Router
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
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
import { useFonts } from 'expo-font';
import { VStack } from '@/components/ui/vstack';

const SignInScreen = () => {
  // State for the input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

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

  const [fontsLoaded] = useFonts({
    'Sen-Regular': require('../assets/fonts/Sen-Regular.ttf'),
    'Sen-Bold': require('../assets/fonts/Sen-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1 bg-[#369BFF]/80'>
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

              {/* Form Section */}
              <VStack space="lg" className="bg-white w-full mt-5 px-8 py-10 rounded-3xl items-center">
                <FormControl size="lg" className="w-full text-red-500" isInvalid={!!error} isRequired>

                  {/* Email Field */}
                  <FormControlLabel>
                    <FormControlLabelText
                      style={{ fontFamily: "Sen-Regular" }}
                      className="text-gray-800 uppercase leading-10"
                    >
                      Email Address
                    </FormControlLabelText>
                  </FormControlLabel>
                  <Input className="my-1 rounded-xl h-14 bg-[#F0F5FA] pl-4 border-0" size="md">
                    <InputSlot>
                      <InputIcon as={MailIcon} />
                    </InputSlot>
                    <InputField
                      type="text"
                      placeholder="example@gmail.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className='text-gray-800'
                    />
                  </Input>

                  {/* Password Input Field */}
                  <FormControlLabel>
                      <FormControlLabelText
                        style={{ fontFamily: "Sen-Regular" }}
                        className="text-gray-800 uppercase leading-10"
                      >
                        Password
                      </FormControlLabelText>
                  </FormControlLabel>
                    <Input
                      className="my-1 rounded-xl h-14 bg-[#F0F5FA] pl-4 pr-4 border-0"
                      size="md"
                    >
                    <InputSlot>
                      <InputIcon as={LockIcon} />
                    </InputSlot>
                    <InputField
                      style={{ fontFamily: "Sen-Regular" }}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      className='text-gray-800'
                    />
                    <InputSlot onPress={handleState}>
                      <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                    </InputSlot>
                  </Input>

                  {/* Error Message */}
                  <FormControlError className="mt-2">
                    <FormControlErrorIcon as={AlertCircleIcon} />
                    <FormControlErrorText>{error}</FormControlErrorText>
                  </FormControlError>

                  {/* Submit Button */}
                  <Button
                    className="w-full bg-[#369BFF] rounded-xl h-14 mt-8"
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
                  <Box className='flex-row justify-center mt-8'>
                    <Text style={{ fontFamily: "Sen-Regular" }} className='text-black'>Don&apos;t have an account? </Text>
                    <Link href="/sign-up" asChild>
                      <Pressable>
                        <Text style={{ fontFamily: "Sen-Bold" }} className='text-[#369BFF]'>Sign Up</Text>
                      </Pressable>
                    </Link>
                  </Box>

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
