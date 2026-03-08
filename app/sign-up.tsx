import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import data from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import {
  Input,
  InputField,
  InputIcon,
  InputSlot,
} from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { ArrowLeft, ArrowRight, Mars, Venus } from "lucide-react-native";
import Animated, {
  Easing,
  FadeInRight,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

const initialFormData = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  date_of_birth: '',
  gender: '',
  address: {
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    latitude: 13.0403,
    longitude: 80.2336,
  },
};

const SignUpScreen = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  // --- State for the Date Picker ---
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const colorScheme = useColorScheme() ?? 'light';
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  };

  useEffect(() => {
    const getLocation = async () => {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        handleAddressChange('latitude', 13.0403);
        handleAddressChange('longitude', 80.2336);
        return;
      }
      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        handleAddressChange('latitude', currentLocation.coords.latitude);
        handleAddressChange('longitude', currentLocation.coords.longitude);
      } catch (error) {
        setError("Could not fetch location. Please select it on the map.");
        handleAddressChange('latitude', 13.0403);
        handleAddressChange('longitude', 80.2336);
      } finally {
        setLoading(false);
      }
    };
    if (step === 2) {
      getLocation();
      setLoading(false) // Fixed the issue of submit button of step 3 set to load state even when navigating b/w previous pages
    }
  }, [step]);

  // --- Handler for the Date Picker ---
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // On iOS, the picker can be persistent
    if (selectedDate) {
      const currentDate = selectedDate || date;
      setDate(currentDate);

      // Format the date to YYYY-MM-DD for the API
      let tempDate = new Date(currentDate);
      let fDate = `${tempDate.getFullYear()}-${(tempDate.getMonth() + 1).toString().padStart(2, '0')}-${tempDate.getDate().toString().padStart(2, '0')}`;
      handleFormChange('date_of_birth', fDate);
    }
  };

  const handleAddressChange = (field: string, value: string | number) => {
    setError('');
    setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const handleFormChange = (field: string, value: string) => {
    setError('');
    setFormData(prev => ({ ...prev, [field]: value }));
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
      if (!formData.email || !formData.password || !formData.first_name || !formData.last_name || !formData.date_of_birth || !formData.phone_number || !formData.gender) {
        setError('Please fill all required fields.');
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

    setError('');
    setStep(prev => prev + 1);
  };

  const handleSignUp = async () => {
    if (loading) return;
    setError('');

    if (!formData.address.address_line_1 || !formData.address.city || !formData.address.pincode) {
      setError('Please fill all required address fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${data.apiUrl}/patients/`, formData);
      const { access_token, refresh_token } = response.data;
      // Securely store the tokens
      await AsyncStorage.setItem('access_token', JSON.stringify({ access_token }));
      await AsyncStorage.setItem('refresh_token', JSON.stringify({ refresh_token }));

      Alert.alert('Success!', 'Your account has been created. Please sign in.', [
        { text: 'OK', onPress: () => router.push('/(tabs)/profile') },
      ]);
    } catch (e: any) {
      const errorMessage = e.response ? e.response.data.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error(e);
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
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            address_line_1: `${geo.streetNumber || ''} ${geo.street || ''}`.trim(),
            city: geo.city || '',
            state: geo.region || '',
            pincode: geo.postalCode || '',
            country: geo.country || 'India',
          },
        }));
      }
      setStep(3); // Move to the form step
    } catch (error) {
      Alert.alert('Error', 'Could not determine address from location. Please enter it manually.');
      setStep(3); // Still move to form so user can enter manually
    } finally {
      setIsGeocoding(false);
    }
  };

  const renderStepOne = () => (
    <>
      <Text
        className="text-2xl font-semibold text-center mb-5 text-white" style={{ fontFamily: "Sen-Bold" }}>
        Step 1: Personal Details
      </Text>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Your first name"
            value={formData.first_name}
            onChangeText={v => handleFormChange('first_name', v)} />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Your last name"
            value={formData.last_name}
            onChangeText={v => handleFormChange('last_name', v)} />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
          >
            Email Address
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Email Address"
            value={formData.email}
            onChangeText={v => handleFormChange('email', v)}
            keyboardType="email-address"
            autoCapitalize="none" />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 pr-4 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="********"
            value={formData.password}
            onChangeText={v => handleFormChange('password', v)} secureTextEntry />
          <InputSlot onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <InputIcon as={isPasswordVisible ? EyeIcon : EyeOffIcon} color={colors.icon} />
          </InputSlot>
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Your phone number"
            value={formData.phone_number}
            onChangeText={v => handleFormChange('phone_number', v)}
            maxLength={10}
            keyboardType="phone-pad" />
        </Input>
      </FormControl>

      {/* Date of Birth Picker */}
      <Pressable onPress={() => setShowDatePicker(true)}>
        <Text
          style={{ fontFamily: "Sen-Regular", color: colors.textInverted }}
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
            backgroundColor: colors.surface,
          }}
          className="h-16  rounded-[14px] px-[15px] mb-[15px] mt-1 justify-center"
        >
          <Text
            style={{ fontFamily: "Sen-Regular", color: colors.textSecondary }}
          >
            {formData.date_of_birth || "Select Date of Birth"}
          </Text>
        </Box>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={'date'}
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}
      <Text
        style={{ fontFamily: "Sen-Regular" }}
        className="text-white text-md uppercase mb-2"
      >
        Gender
      </Text>
      <Box className="flex-row justify-between gap-4 mb-4">
        {["Male", "Female"].map((g) => {
          const isActive = formData.gender === g;

          return (
            <Box
              key={g}
              className={`flex-1 rounded-[16px] p-[3px]`}
            >
              <Button
                onPress={() => handleFormChange('gender', g)}
                className={`h-[50px] rounded-[14px] flex-row items-center justify-center ${isActive ? "bg-white/50" : ""
                  }`}
                variant="solid"
              >
                <ButtonIcon
                  as={g === "Male" ? Mars : Venus}
                  className={`mr-[8px] ${isActive ? "text-black" : "text-black/70"
                    }`}
                />

                <ButtonText
                  style={{ fontFamily: "Sen-Regular" }}
                  className={`text-[16px] font-medium ${isActive ? "text-black" : "text-black/70"
                    }`}
                >
                  {g}
                </ButtonText>
              </Button>
            </Box>
          );
        })}
      </Box>
    </>
  );

  const renderStepThree = () => (
    <>
      <Text
        style={{ fontFamily: "Sen-Bold" }}
        className="text-2xl font-semibold text-white mb-5 text-center"
      >
        Step 3: Address</Text>
      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Address Line 1"
            value={formData.address.address_line_1}
            onChangeText={v => handleAddressChange('address_line_1', v)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Address Line 2"
            value={formData.address.address_line_2}
            onChangeText={v => handleAddressChange('address_line_2', v)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="City"
            value={formData.address.city}
            onChangeText={v => handleAddressChange('city', v)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="State"
            value={formData.address.state}
            onChangeText={v => handleAddressChange('state', v)}
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Pincode"
            value={formData.address.pincode}
            maxLength={6}
            onChangeText={v => handleAddressChange('pincode', v)} keyboardType="number-pad"
          />
        </Input>
      </FormControl>

      <FormControl size="lg" className="w-full mb-2">
        <FormControlLabel>
          <FormControlLabelText
            className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}
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
            backgroundColor: colors.surface,
          }}
          className="my-1 rounded-xl h-16  pl-2 border-0"
          size="md"
        >
          <InputField
            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
            placeholder="Country"
            value={formData.address.country}
            onChangeText={v => handleAddressChange('country', v)}
          />
        </Input>
      </FormControl>


    </>
  );

  const renderStepTwo = () => (
    <Box className='flex-1 min-h-[500px]'>
      <Text
        style={{ fontFamily: "Sen-Bold" }}
        className="text-2xl font-semibold text-white mb-1 text-center"
      >
        Step 2: Pin Your Location
      </Text>
      <Text
        style={{ fontFamily: "Sen-Regular" }}
        className="text-lg text-white/70 text-center mb-8"
      >
        Drag the pin to your exact address
      </Text>
      {loading && !location ? <ActivityIndicator size="large" color="#fff" /> :
        <Box
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 4,
            backgroundColor: colors.surface,
          }}
          className="flex-1 rounded-[14px] overflow-hidden  justify-center items-center mb-5"
        >
          <MapView
            style={StyleSheet.absoluteFillObject}
            region={{
              latitude: Number(formData.address.latitude),
              longitude: Number(formData.address.longitude),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) => {
              // let user drop pin by tapping the map
              handleAddressChange('latitude', e.nativeEvent.coordinate.latitude);
              handleAddressChange('longitude', e.nativeEvent.coordinate.longitude);
            }}
          >
            <Marker
              draggable
              coordinate={{ latitude: Number(formData.address.latitude), longitude: Number(formData.address.longitude) }}
              onDragEnd={(e) => {
                handleAddressChange('latitude', e.nativeEvent.coordinate.latitude);
                handleAddressChange('longitude', e.nativeEvent.coordinate.longitude);
              }}
            />
          </MapView>
        </Box>
      }
      <Button
        onPress={handleConfirmLocation} disabled={isGeocoding}
        style={{
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 4,
        }}
        isDisabled={loading}
        className="bg-white h-16 rounded-[14px] w-full items-center shadow-lg"
      >
        {isGeocoding ? <ActivityIndicator color="#192f6a" /> : <ButtonText
          style={{ fontFamily: "Sen-Bold" }}
          className="text-xl"
        >Confirm</ButtonText>}
      </Button>
    </Box>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ backgroundColor: colors.primaryBackground }} className="flex-1 h-full">
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
                className={`flex-row items-center justify-center mb-5 relative min-h-[50px] ${Platform.OS === 'android' ? 'mt-5' : 'mt-0'}`}
              >
                <View className="absolute left-0 z-10">
                  <Pressable
                    onPress={() => step > 1 ? setStep(s => s - 1) : router.back()}
                    className="p-2 active:bg-transparent"
                    accessibilityLabel="Go back"
                  >
                    <ArrowLeft size={25} color={colors.textInverted} />
                  </Pressable>
                </View>

                <Text
                  className="text-[28px] text-center"
                  style={{ fontFamily: "Sen-Bold", color: '#fff' }}
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
              <Animated.View className="w-full" style={buttonAnimatedStyle}>
                <Box className="mt-4 w-full">
                  {step < 3 ? (
                    <Button
                      onPress={handleNextStep}
                      className="bg-white h-16 rounded-[14px] items-center shadow-lg"
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      style={actionButtonShadow}
                      isDisabled={loading}>
                      {loading ? (
                        <ButtonSpinner color="black" />
                      ) : (
                        <ButtonText
                          style={{ fontFamily: "Sen-Bold" }}
                          className="text-xl text-black"
                        >Next</ButtonText>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="bg-white h-16 rounded-[14px] w-full items-center shadow-lg"
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      style={actionButtonShadow}
                      onPress={handleSignUp} isDisabled={loading}>
                      {loading ? <ButtonSpinner color="black" /> : <ButtonText style={{ fontFamily: "Sen-Bold" }} className="text-black text-xl">Sign Up</ButtonText>}
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