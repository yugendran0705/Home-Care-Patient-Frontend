import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosInstance';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Mars, Venus } from 'lucide-react-native';
import { FormControl, FormControlLabel, FormControlLabelText } from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Box } from '@/components/ui/box';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

interface PersonalDetails {
    first_name: string;
    last_name: string;
    phone_number: string;
    date_of_birth: string;
    gender: string;
}

const EditPersonalDetailsScreen = () => {
    const colorScheme = useColorScheme() ?? 'light';
    const colors = Colors[colorScheme];

    const [details, setDetails] = useState<PersonalDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // Date Picker States
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        const fetchCurrentDetails = async () => {
            try {
                const response = await axiosInstance.get('/patients/me');
                const fetchedDetails = {
                    first_name: response.data.first_name,
                    last_name: response.data.last_name,
                    phone_number: response.data.phone_number,
                    date_of_birth: response.data.date_of_birth,
                    gender: response.data.gender,
                };
                setDetails(fetchedDetails);

                if (response.data.date_of_birth) {
                    setDate(new Date(response.data.date_of_birth));
                }
            } catch (error) {
                Alert.alert('Error', 'Could not fetch your details.');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentDetails();
    }, []);

    const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
            const fDate = selectedDate.toISOString().split('T')[0];
            handleDetailsChange('date_of_birth', fDate);
        }
    };

    const handleDetailsChange = (field: keyof PersonalDetails, value: string) => {
        setDetails(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = async () => {
        if (!details) return;
        setLoading(true);
        try {
            await axiosInstance.put('/patients/me', details);
            Alert.alert('Success', 'Your details have been updated.');
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Could not update your details.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !details) {
        return (
            <Box className="flex-1 justify-center items-center bg-black">
                <ActivityIndicator size="large" color="#4c8bf5" />
            </Box>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView className="flex-1" style={{ backgroundColor: colors.primaryBackground }}>
                <View className="flex-row items-center justify-between px-3 mt-5">
                    <Pressable onPress={() => router.back()} className="p-3">
                        <Feather name="arrow-left" size={24} color="#fff" />
                    </Pressable>
                    <Text className="text-2xl font-semibold text-center text-white" style={{ fontFamily: "Sen-Bold" }}>Edit Personal Details</Text>
                    <View className="w-10" />
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }}>

                    <FormControl size="lg" className="w-full mb-2">
                        <FormControlLabel>
                            <FormControlLabelText className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}>
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
                            className="my-1 rounded-xl h-16 pl-2 border-0"
                            size="md"
                        >
                            <InputField
                                style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                                value={details.first_name}
                                onChangeText={v => handleDetailsChange('first_name', v)}
                            />
                        </Input>
                    </FormControl>

                    <FormControl size="lg" className="w-full mb-2">
                        <FormControlLabel>
                            <FormControlLabelText className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}>
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
                            className="my-1 rounded-xl h-16 pl-2 border-0"
                            size="md"
                        >
                            <InputField
                                style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                                value={details.last_name}
                                onChangeText={v => handleDetailsChange('last_name', v)}
                            />
                        </Input>
                    </FormControl>

                    <FormControl size="lg" className="w-full mb-2">
                        <FormControlLabel>
                            <FormControlLabelText className="text-md uppercase text-white" style={{ fontFamily: "Sen-Regular" }}>
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
                                backgroundColor: colors.surface,
                            }}
                            className="my-1 rounded-xl h-16 pl-2 border-0"
                            size="md"
                        >
                            <InputField
                                style={{ color: colors.text, fontFamily: "Sen-Regular" }}
                                value={details.phone_number}
                                onChangeText={v => handleDetailsChange('phone_number', v)}
                                keyboardType="phone-pad"
                            />
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
                            className="h-16 rounded-[14px] px-[15px] mb-[15px] mt-1 justify-center"
                        >
                            <Text style={{ fontFamily: "Sen-Regular", color: colors.textSecondary }}>
                                {details.date_of_birth || "Select Date of Birth"}
                            </Text>
                        </Box>
                    </Pressable>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode={'date'}
                            display="default"
                            onChange={onChangeDate}
                            maximumDate={new Date()}
                        />
                    )}

                    {/* Gender Selection */}
                    <Text
                        style={{ fontFamily: "Sen-Regular" }}
                        className="text-white text-md uppercase mb-2"
                    >
                        Gender
                    </Text>
                    <Box className="flex-row justify-between gap-4 mb-6">
                        {["Male", "Female"].map((g) => {
                            const isActive = details.gender === g;
                            return (
                                <Box key={g} className="flex-1 rounded-[16px] p-[3px]">
                                    <Button
                                        onPress={() => handleDetailsChange('gender', g)}
                                        className={`h-[50px] rounded-[14px] flex-row items-center justify-center ${isActive ? "bg-white/50" : "bg-transparent border border-white/20"}`}
                                        variant="solid"
                                    >
                                        <ButtonIcon
                                            as={g === "Male" ? Mars : Venus}
                                            className={`mr-[8px] ${isActive ? "text-black" : "text-white/70"}`}
                                        />
                                        <ButtonText
                                            style={{ fontFamily: "Sen-Regular" }}
                                            className={`text-[16px] font-medium ${isActive ? "text-black" : "text-white/70"}`}
                                        >
                                            {g}
                                        </ButtonText>
                                    </Button>
                                </Box>
                            );
                        })}
                    </Box>

                    <Button
                        onPress={handleSave}
                        className="bg-white h-16 rounded-[14px] items-center shadow-lg"
                        isDisabled={loading}>
                        {loading ? (
                            <ButtonSpinner color="black" />
                        ) : (
                            <ButtonText
                                style={{ fontFamily: "Sen-Bold" }}
                                className="text-xl text-black"
                            >Save Changes</ButtonText>
                        )}
                    </Button>
                </ScrollView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

export default EditPersonalDetailsScreen;