import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosInstance'; 
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const initialAddressState = {
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    latitude: 13.0403, // fallback default (Chennai)
    longitude: 80.2336,
};

const AddressFormScreen = () => {
    const params = useLocalSearchParams();
    const addressId = params.addressId as string | undefined;
    const isEditMode = !!addressId;

    const [address, setAddress] = useState(initialAddressState);
    const [loading, setLoading] = useState(true);
    const [isGeocoding, setIsGeocoding] = useState(false);
    
    // Step 1: Map, Step 2: Form
    const [step, setStep] = useState(isEditMode ? 2 : 1);

    useEffect(() => {
        const setupInitialLocation = async () => {
            if (isEditMode) {
                try {
                    const response = await axiosInstance.get(`/addresses/one/${addressId}`);
                    setAddress(response.data);
                } catch (error) {
                    Alert.alert('Error', 'Could not fetch address details.');
                    router.back();
                } finally {
                    setLoading(false);
                }
            } else {
                // Get current GPS location for the map in "add" mode
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Location permission is required to set address location.');
                    setLoading(false);
                    return;
                }
                const loc = await Location.getCurrentPositionAsync({});
                setAddress(prev => ({
                    ...prev,
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                }));
                setLoading(false);
            }
        };
        setupInitialLocation();
    }, [addressId, isEditMode]);

    const handleAddressChange = (field: string, value: string | number) => {
        setAddress(prev => ({ ...prev, [field]: value }));
    };

    const handleConfirmLocation = async () => {
        setIsGeocoding(true);
        try {
            const geocoded = await Location.reverseGeocodeAsync({
                latitude: address.latitude,
                longitude: address.longitude,
            });

            if (geocoded.length > 0) {
                const geo = geocoded[0];
                setAddress(prev => ({
                    ...prev,
                    address_line_1: `${geo.streetNumber || ''} ${geo.street || ''}`.trim(),
                    city: geo.city || '',
                    state: geo.region || '',
                    pincode: geo.postalCode || '',
                    country: geo.country || 'India',
                }));
            }
            setStep(2); // Move to the form step
        } catch (error) {
            Alert.alert('Error', 'Could not determine address from location. Please enter it manually.');
            setStep(2); // Still move to form so user can enter manually
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            if (isEditMode) {
                await axiosInstance.put(`/addresses/${addressId}`, address);
                Alert.alert('Success', 'Address updated successfully.');
            } else {
                await axiosInstance.post('/addresses', address);
                Alert.alert('Success', 'New address added.');
            }
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Could not save address.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditMode) return;
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await axiosInstance.delete(`/addresses/${addressId}`);
                            Alert.alert('Success', 'Address deleted successfully.');
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Could not delete address.');
                            console.error(error);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
          <View style={[styles.gradientBackground, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        );
    }

    const renderMapStep = () => (
        <View style={{ flex: 1 }}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: Number(address.latitude),
                    longitude: Number(address.longitude),
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
                    coordinate={{ latitude: Number(address.latitude), longitude: Number(address.longitude) }}
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
    );

    const renderFormStep = () => (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <TextInput style={styles.input} placeholder="Address Line 1" value={address.address_line_1} onChangeText={v => handleAddressChange('address_line_1', v)} />
            <TextInput style={styles.input} placeholder="Address Line 2" value={address.address_line_2} onChangeText={v => handleAddressChange('address_line_2', v)} />
            <TextInput style={styles.input} placeholder="City" value={address.city} onChangeText={v => handleAddressChange('city', v)} />
            <TextInput style={styles.input} placeholder="State" value={address.state} onChangeText={v => handleAddressChange('state', v)} />
            <TextInput style={styles.input} placeholder="Pincode" value={address.pincode} onChangeText={v => handleAddressChange('pincode', v)} keyboardType="number-pad"/>
            
            {isEditMode && (
                <Pressable style={styles.changeLocationButton} onPress={() => setStep(1)}>
                    <Feather name="map-pin" size={16} color="#fff" />
                    <Text style={styles.changeLocationButtonText}>Change Pin Location</Text>
                </Pressable>
            )}

            <Pressable style={styles.saveButton} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#192f6a" /> : <Text style={styles.saveButtonText}>Save Address</Text>}
            </Pressable>

            {isEditMode && (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete Address</Text>
              </Pressable>
            )}
        </ScrollView>
    );

    return (
        <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.gradientBackground}>
          <SafeAreaProvider>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable onPress={() => step === 2 ? setStep(1) : router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </Pressable>
                    <Text style={styles.title}>{step === 1 ? 'Set Location' : (isEditMode ? 'Edit Address' : 'Confirm Address')}</Text>
                    <View style={{ width: 40 }} />
                </View>
                {step === 1 ? renderMapStep() : renderFormStep()}
            </SafeAreaView>
          </SafeAreaProvider>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradientBackground: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 20 },
    backButton: { padding: 10 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    scrollContainer: { padding: 20 },
    input: { height: 55, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 14, paddingHorizontal: 15, fontSize: 16, color: '#fff', marginBottom: 15 },
    map: { ...StyleSheet.absoluteFillObject },
    confirmButton: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#fff', paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
    confirmButtonText: { color: '#192f6a', fontSize: 18, fontWeight: 'bold' },
    changeLocationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: 12, borderRadius: 14, marginBottom: 20 },
    changeLocationButtonText: { color: '#fff', fontSize: 16, fontWeight: '500', marginLeft: 10 },
    saveButton: { backgroundColor: '#fff', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#192f6a', fontSize: 18, fontWeight: 'bold' },
    deleteButton: { backgroundColor: '#d9534f', paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 10 },
    deleteButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AddressFormScreen;
