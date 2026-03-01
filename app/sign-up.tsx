import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import data from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    setFormData(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
  };

  const handleNextStep = () => {
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
    if (step === 3) {
      if (!formData.address.address_line_1 || !formData.address.city || !formData.address.pincode) {
        setError('Please fill all required address fields.');
        return;
      }
    }
    setError('');
    setStep(prev => prev + 1);
  };

  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${data.apiUrl}/patients/`, formData);
      const { access_token, refresh_token } = response.data;
      // Securely store the tokens
      await AsyncStorage.setItem('access_token', JSON.stringify({access_token}));
      await AsyncStorage.setItem('refresh_token', JSON.stringify({refresh_token}));

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
      <Text className="text-[22px] font-semibold text-white/90 mb-5 text-center">Step 1: Personal Details</Text>
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="First Name" value={formData.first_name} onChangeText={v => handleFormChange('first_name', v)} />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="Last Name" value={formData.last_name} onChangeText={v => handleFormChange('last_name', v)} />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="Email Address" value={formData.email} onChangeText={v => handleFormChange('email', v)} keyboardType="email-address" autoCapitalize="none" />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="Password" value={formData.password} onChangeText={v => handleFormChange('password', v)} secureTextEntry />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="Phone Number" value={formData.phone_number} onChangeText={v => handleFormChange('phone_number', v)} keyboardType="phone-pad" />

      {/* Date of Birth Picker */}
      <Pressable onPress={() => setShowDatePicker(true)}>
        <View className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center">
          <Text className={formData.date_of_birth ? "text-[16px] text-white" : "text-[16px] text-[#a0aec0]"}>
            {formData.date_of_birth || 'Date of Birth'}
          </Text>
        </View>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={'date'}
          display="default"
          onChange={onChangeDate}
        />
      )}

      <View className="flex-row justify-between mb-[15px]">
        <Pressable
          className={`flex-1 flex-row items-center justify-center h-[55px] bg-white/20 rounded-[14px] mx-[5px] ${formData.gender === 'Male' ? 'bg-white' : ''}`}
          onPress={() => handleFormChange('gender', 'Male')}
        >
          <Feather name="user" size={20} color={formData.gender === 'Male' ? '#192f6a' : '#fff'} className="mr-[10px]" />
          <Text className={`text-[16px] text-white font-medium ${formData.gender === 'Male' ? 'text-[#192f6a]' : ''}`}>Male</Text>
        </Pressable>
        <Pressable
          className={`flex-1 flex-row items-center justify-center h-[55px] bg-white/20 rounded-[14px] mx-[5px] ${formData.gender === 'Female' ? 'bg-white' : ''}`}
          onPress={() => handleFormChange('gender', 'Female')}
        >
          <Feather name="user" size={20} color={formData.gender === 'Female' ? '#192f6a' : '#fff'} className="mr-[10px]" />
          <Text className={`text-[16px] text-white font-medium ${formData.gender === 'Female' ? 'text-[#192f6a]' : ''}`}>Female</Text>
        </Pressable>
      </View>
    </>
  );

  const renderStepThree = () => (
    <>
      <Text className="text-[22px] font-semibold text-white/90 mb-5 text-center">Step 3: Address</Text>
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="Address Line 1" value={formData.address.address_line_1} onChangeText={v => handleAddressChange('address_line_1', v)} />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="Address Line 2 (Optional)" value={formData.address.address_line_2} onChangeText={v => handleAddressChange('address_line_2', v)} />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="City" value={formData.address.city} onChangeText={v => handleAddressChange('city', v)} />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="State" value={formData.address.state} onChangeText={v => handleAddressChange('state', v)} />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="Pincode" value={formData.address.pincode} onChangeText={v => handleAddressChange('pincode', v)} keyboardType="number-pad" />
      <TextInput className="h-[55px] bg-white/20 rounded-[14px] px-[15px] text-[16px] text-white mb-[15px] justify-center" placeholder="Country" value={formData.address.country} onChangeText={v => handleAddressChange('country', v)} />
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text className="text-[22px] font-semibold text-white/90 mb-5 text-center">Step 2: Pin Your Location</Text>
      <Text className="text-[14px] text-white/70 text-center mb-[15px]">Drag the pin to your exact address</Text>
      {loading && !location ? <ActivityIndicator size="large" color="#fff" /> :
        <View className="flex-1">
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
          <Pressable className="bg-white py-[15px] rounded-[14px] items-center mt-5" onPress={handleConfirmLocation} disabled={isGeocoding}>
            {isGeocoding ? <ActivityIndicator color="#192f6a" /> : <Text className="text-[#192f6a] text-[18px] font-bold">Confirm Location</Text>}
          </Pressable>
        </View>
      }
    </>
  );

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} className="flex-1">
      <SafeAreaProvider>
        <SafeAreaView className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <View className={`flex-row items-center justify-between mb-5 ${Platform.OS === 'android' ? 'mt-5' : 'mt-0'}`}>
              <Pressable onPress={() => step > 1 ? setStep(s => s - 1) : router.back()} className="p-[10px]">
                <Feather name="arrow-left" size={24} color="#fff" />
              </Pressable>
              <Text className="text-[28px] font-bold text-white text-center">Create Account</Text>
              <View className="w-[40px]" />
            </View>

            {step === 1 && renderStepOne()}
            {step === 2 && renderStepTwo()}
            {step === 3 && renderStepThree()}

            {error ? <Text className="text-[#ffcdd2] text-center my-[10px] text-[14px]">{error}</Text> : null}

            <View className="mt-5">
              {step < 3 ? (
                <Pressable className="bg-white py-[18px] rounded-[14px] items-center shadow-lg elevation-5" onPress={handleNextStep}>
                  <Text className="text-[#192f6a] text-[18px] font-bold">Next</Text>
                </Pressable>
              ) : (
                <Pressable className="bg-white py-[18px] rounded-[14px] items-center shadow-lg elevation-5" onPress={handleSignUp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#192f6a" /> : <Text className="text-[#192f6a] text-[18px] font-bold">Sign Up</Text>}
                </Pressable>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </LinearGradient>
  );
};

export default SignUpScreen;