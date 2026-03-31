import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosInstance';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors } from '@/constants/Colors';
import { Button, ButtonSpinner, ButtonText, ButtonIcon } from '@/components/ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import Animated, { Easing, FadeInRight, FadeOutLeft } from 'react-native-reanimated';

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
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const params = useLocalSearchParams();
    const addressId = params.addressId as string | undefined;
    const isEditMode = !!addressId;
    const [error, setError] = useState('');

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
                } catch {
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
        } catch {
            Alert.alert('Error', 'Could not determine address from location. Please enter it manually.');
            setStep(2); // Still move to form so user can enter manually
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSave = async () => {
        setError("")
        if (!address.address_line_1 || !address.city || !address.pincode || !address.state) {
            setError('Please fill all required fields.');
            return;
        }
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
            <Box className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#fff" />
            </Box>
        );
    }

    const renderMapStep = () => (
        <View className="flex-1">
            <MapView
                style={{ flex: 1 }}
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
            <Button
                onPress={handleConfirmLocation}
                className="absolute bottom-10 left-5 right-5 bg-white py-[15px] h-fit rounded-[14px] items-center"
                isDisabled={isGeocoding}>
                {isGeocoding ? (
                    <ButtonSpinner color="black" />
                ) : (
                    <ButtonText
                        style={{ fontFamily: "Sen-Bold" }}
                        className="text-xl text-black"
                    >Confirm Location</ButtonText>
                )}
            </Button>
        </View>
    );

    const renderFormStep = () => (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            <VStack space="md" className="w-full mb-4">
                <FormControl size="lg" className="w-full">
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
                        className="my-1 rounded-xl h-16 pl-2 border-0"
                        size="md"
                    >
                        <InputField
                            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                            placeholder="Address Line 1"
                            value={address.address_line_1}
                            onChangeText={v => handleAddressChange('address_line_1', v)}
                        />
                    </Input>
                </FormControl>

                <FormControl size="lg" className="w-full">
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
                        className="my-1 rounded-xl h-16 pl-2 border-0"
                        size="md"
                    >
                        <InputField
                            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                            placeholder="Address Line 2"
                            value={address.address_line_2}
                            onChangeText={v => handleAddressChange('address_line_2', v)}
                        />
                    </Input>
                </FormControl>

                <FormControl size="lg" className="w-full">
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
                        className="my-1 rounded-xl h-16 pl-2 border-0"
                        size="md"
                    >
                        <InputField
                            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                            placeholder="City"
                            value={address.city}
                            onChangeText={v => handleAddressChange('city', v)}
                        />
                    </Input>
                </FormControl>

                <FormControl size="lg" className="w-full">
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
                        className="my-1 rounded-xl h-16 pl-2 border-0"
                        size="md"
                    >
                        <InputField
                            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                            placeholder="State"
                            value={address.state}
                            onChangeText={v => handleAddressChange('state', v)}
                        />
                    </Input>
                </FormControl>

                <FormControl size="lg" className="w-full">
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
                        className="my-1 rounded-xl h-16 pl-2 border-0"
                        size="md"
                    >
                        <InputField
                            style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                            placeholder="Pincode"
                            value={address.pincode}
                            maxLength={6}
                            onChangeText={v => handleAddressChange('pincode', v)}
                            keyboardType="number-pad"
                        />
                    </Input>
                </FormControl>
            </VStack>

            {error ? (
                <Box className="bg-white/70 rounded-2xl border border-white/20 p-2 mb-4">
                    <Text
                        style={{ fontFamily: "Sen-Regular", color: colors.error }}
                        className="text-center text-[14px]"
                    >
                        {error}
                    </Text>
                </Box>
            ) : null}

            <VStack space="md">
                {isEditMode && (
                    <Button
                        onPress={() => setStep(1)}
                        className="py-3 bg-white/80 rounded-xl h-fit"
                        isDisabled={loading}
                    >
                        <ButtonIcon as={MapPin} color="#000" className="mr-2" />
                        <ButtonText
                            style={{ fontFamily: "Sen-Bold" }}
                            className="text-base text-black"
                        >
                            Change address
                        </ButtonText>
                    </Button>
                )}

                <Button
                    onPress={handleSave}
                    className="bg-white py-4 rounded-xl h-15"
                    isDisabled={loading}
                >
                    {loading ? (
                        <ButtonSpinner color="black" />
                    ) : (
                        <ButtonText
                            style={{ fontFamily: "Sen-Bold" }}
                            className="text-xl text-black"
                        >
                            Save Changes
                        </ButtonText>
                    )}
                </Button>

                {isEditMode && (
                    <Button
                        className="py-4 rounded-xl h-15 mb-10"
                        onPress={handleDelete}
                        style={{ backgroundColor: colors.error }}
                    >
                        <ButtonText
                            style={{ fontFamily: "Sen-Bold" }}
                            className="text-white text-[18px]"
                        >
                            Delete Address
                        </ButtonText>
                    </Button>
                )}
            </VStack>
        </ScrollView>
    );

    return (
        <SafeAreaProvider>
            <SafeAreaView className="flex-1" style={{ backgroundColor: colors.primaryBackground }}>
                <Box className="flex-row items-center justify-between px-4 mt-5 mb-2">
                    <Pressable onPress={() => step === 2 ? setStep(1) : router.back()} className="p-2">
                        <Icon as={ArrowLeft} size="xl" color="#fff" />
                    </Pressable>
                    <Text style={{ fontFamily: "Sen-Bold" }} className="text-[22px] text-white">
                        {step === 1 ? 'Set Location' : (isEditMode ? 'Edit Address' : 'Confirm Address')}
                    </Text>
                    <Box className="w-[40px]" />
                </Box>
                <Animated.View
                    className="flex-1"
                    key={step}
                    entering={FadeInRight.duration(500)
                        .delay(200)
                        .easing(Easing.out(Easing.exp))}
                    exiting={FadeOutLeft.duration(200).easing(Easing.in(Easing.exp))}
                >
                    {step === 1 ? renderMapStep() : renderFormStep()}
                </Animated.View>

            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default AddressFormScreen;