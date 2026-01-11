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

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
        setError('Please fill all required fields in Step 1.');
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
      setIsGeocoding(true);
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
      <Text style={styles.stepTitle}>Step 1: Personal Details</Text>
      <TextInput style={styles.input} placeholder="First Name" value={formData.first_name} onChangeText={v => handleFormChange('first_name', v)} />
      <TextInput style={styles.input} placeholder="Last Name" value={formData.last_name} onChangeText={v => handleFormChange('last_name', v)} />
      <TextInput style={styles.input} placeholder="Email Address" value={formData.email} onChangeText={v => handleFormChange('email', v)} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={formData.password} onChangeText={v => handleFormChange('password', v)} secureTextEntry />
      <TextInput style={styles.input} placeholder="Phone Number" value={formData.phone_number} onChangeText={v => handleFormChange('phone_number', v)} keyboardType="phone-pad" />
      
      {/* Date of Birth Picker */}
      <Pressable onPress={() => setShowDatePicker(true)}>
        <View style={styles.input}>
          <Text style={formData.date_of_birth ? styles.dateText : styles.placeholderText}>
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

      <View style={styles.genderContainer}>
        <Pressable 
            style={[styles.genderButton, formData.gender === 'Male' && styles.genderButtonSelected]} 
            onPress={() => handleFormChange('gender', 'Male')}
        >
            <Feather name="user" size={20} color={formData.gender === 'Male' ? '#192f6a' : '#fff'} style={styles.genderIcon} />
            <Text style={[styles.genderButtonText, formData.gender === 'Male' && styles.genderButtonTextSelected]}>Male</Text>
        </Pressable>
        <Pressable 
            style={[styles.genderButton, formData.gender === 'Female' && styles.genderButtonSelected]} 
            onPress={() => handleFormChange('gender', 'Female')}
        >
            <Feather name="user" size={20} color={formData.gender === 'Female' ? '#192f6a' : '#fff'} style={styles.genderIcon} />
            <Text style={[styles.genderButtonText, formData.gender === 'Female' && styles.genderButtonTextSelected]}>Female</Text>
        </Pressable>
      </View>
    </>
  );

  const renderStepThree = () => (
    <>
      <Text style={styles.stepTitle}>Step 3: Address</Text>
      <TextInput style={styles.input} placeholder="Address Line 1" value={formData.address.address_line_1} onChangeText={v => handleAddressChange('address_line_1', v)} />
      <TextInput style={styles.input} placeholder="Address Line 2 (Optional)" value={formData.address.address_line_2} onChangeText={v => handleAddressChange('address_line_2', v)} />
      <TextInput style={styles.input} placeholder="City" value={formData.address.city} onChangeText={v => handleAddressChange('city', v)} />
      <TextInput style={styles.input} placeholder="State" value={formData.address.state} onChangeText={v => handleAddressChange('state', v)} />
      <TextInput style={styles.input} placeholder="Pincode" value={formData.address.pincode} onChangeText={v => handleAddressChange('pincode', v)} keyboardType="number-pad" />
      <TextInput style={styles.input} placeholder="Country" value={formData.address.country} onChangeText={v => handleAddressChange('country', v)} />
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text style={styles.stepTitle}>Step 2: Pin Your Location</Text>
      <Text style={styles.mapSubtitle}>Drag the pin to your exact address</Text>
      {loading && !location ? <ActivityIndicator size="large" color="#fff" /> :
      <View style={{ flex: 1 }}>
            <MapView
                style={styles.map}
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
            <Pressable style={styles.confirmButton} onPress={handleConfirmLocation} disabled={isGeocoding}>
                {isGeocoding ? <ActivityIndicator color="#192f6a" /> : <Text style={styles.confirmButtonText}>Confirm Location</Text>}
            </Pressable>
        </View>
      }
    </>
  );

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.gradientBackground}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
                <Pressable onPress={() => step > 1 ? setStep(s => s - 1) : router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.title}>Create Account</Text>
                <View style={{ width: 40 }} />
            </View>

            {step === 1 && renderStepOne()}
            {step === 2 && renderStepTwo()}
            {step === 3 && renderStepThree()}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonContainer}>
              {step < 3 ? (
                <Pressable style={styles.actionButton} onPress={handleNextStep}>
                  <Text style={styles.actionButtonText}>Next</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.actionButton} onPress={handleSignUp} disabled={loading}>
                  {loading ? <ActivityIndicator color="#192f6a" /> : <Text style={styles.actionButtonText}>Sign Up</Text>}
                </Pressable>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'android' ? 20 : 0,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#fff',
    marginBottom: 15,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#a0aec0', // Using a placeholder color
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
  },
  mapContainer: {
    height: 300,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorText: {
    color: '#ffcdd2',
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
      android: { elevation: 5 },
      web: { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }
    }),
  },
  actionButtonText: {
    color: '#192f6a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    marginHorizontal: 5,
  },
  genderButtonSelected: {
    backgroundColor: '#fff',
  },
  genderIcon: {
    marginRight: 10,
  },
  genderButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#192f6a',
  },
  confirmButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#192f6a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#192f6a',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
