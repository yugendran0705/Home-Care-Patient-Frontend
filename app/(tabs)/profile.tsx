import { Link, router } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Animated,
  ScrollView,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@/axiosInstance';
import { Colors } from '../../constants/Colors';
import { Text } from '@/components/ui/text';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { CalendarDays, Edit, LocationEdit, LogOut, Mars, Phone, Venus } from 'lucide-react-native';
import { Divider } from '@/components/ui/divider';
import { Icon } from "@/components/ui/icon";
import { Button, ButtonIcon } from '@/components/ui/button';

// --- TypeScript Interfaces ---
interface User {
  id: string;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface Address {
  id: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_primary: boolean;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  id: string;
  user: User;
}


const ProfileScreen = () => {

  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const fetchData = useCallback(async () => {
    try {
      // Fetch profile and addresses in parallel
      const [profileResponse, addressResponse] = await Promise.all([
        axiosInstance.get('/patients/me'),
        axiosInstance.get('/addresses/me'),
      ]);
      setProfile(profileResponse.data);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      setAddresses(addressResponse.data);
      setError(''); // Clear error on success
    } catch (e: any) {
      setError('Failed to fetch data. Please try again.');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadInitialData();
  }, [fetchData]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    router.replace('/sign-in');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <Box className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#4c8bf5" />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box className="flex-1 justify-center items-center bg-black">
        <Text className="text-white text-center text-[16px] mb-[20px]">{error}</Text>
        <Pressable onPress={() => router.replace('/sign-in')}>
          <Text className="text-[16px] text-white font-medium">Go to Sign In</Text>
        </Pressable>
      </Box>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.primaryBackground }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000']} // for Android
              tintColor={'#fff'} // for iOS
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Box className="items-center mb-[30px]">
              <Box className="w-[100px] h-[100px] rounded-full bg-white/20 justify-center items-center mb-[15px] border-[3px] border-white">
                <Text style={{ fontFamily: "Sen-Bold" }} className="text-white text-[40px]">{profile.first_name.charAt(0)}{profile.last_name.charAt(0)}</Text>
              </Box>
              <Text style={{ fontFamily: "Sen-Bold" }} className="text-[26px] text-white">{profile.first_name} {profile.last_name}</Text>
              <Text style={{ fontFamily: "Sen-Regular", color: colors.textMutedInverted  }} className="text-[16px] text-white/80 mt-[4px]">{profile.user.email}</Text>
            </Box>

            <VStack space="lg" style={{backgroundColor: colors.surface}} className="rounded-[12px] p-6 mb-4">
              <Box className="flex-row justify-between items-center mb-1">
                <Text
                  style={{ fontFamily: "Sen-Bold", color:colors.text }}
                  className="text-[18px]"
                >
                  Personal Details
                </Text>
                <Link href="/edit-personal-details" asChild>
                  <Pressable>
                    <Icon as={Edit} style={{color: colors.accent }} size="lg" />
                  </Pressable>
                </Link>
              </Box>
              <Divider style={{backgroundColor: colors.icon}} />
              <Box className="flex-row items-center gap-4">
                <Icon as={Phone} style={{color: colors.icon }} />
                <Text style={{ fontFamily: "Sen-Regular", color: colors.text }} className="text-lg">
                  {profile.phone_number}
                </Text>
              </Box>


              <Box className="flex-row items-center gap-4">
                <Icon as={CalendarDays} style={{color: colors.icon }} />
                <Text style={{ fontFamily: "Sen-Regular", color: colors.text }} className="text-lg">
                  {new Date(profile.date_of_birth).toLocaleDateString()}
                </Text>
              </Box>

              <Box className="flex-row items-center gap-4">
                <Icon as={profile.gender === "Male" ? Mars : Venus} style={{color: colors.icon}} />
                <Text style={{ fontFamily: "Sen-Regular", color: colors.text }} className="text-lg">
                  {profile.gender}
                </Text>
              </Box>
            </VStack>

            <VStack space="lg" style={{backgroundColor: colors.surface}} className="rounded-[12px] p-6 mb-4">
              <Box className="flex-row justify-between items-center mb-1">
                <Text
                  style={{ fontFamily: "Sen-Bold", color: colors.text  }}
                  className="text-[18px]"
                >
                  My Addresses
                </Text>
                <Link href="/manage-addresses" asChild>
                  <Pressable>
                    <Text style={{ fontFamily: "Sen-Regular", color: colors.accent }} className="text-[14px]">
                      Manage
                    </Text>
                  </Pressable>
                </Link>
              </Box>
              <Divider style={{backgroundColor: colors.icon}} />

              {addresses.map((addr) => (
                <Box key={addr.id} className="flex-row items-start gap-4 mb-2">
                  <Icon as={LocationEdit} style={{color: colors.icon}} className=" mt-1" />
                  <VStack className="flex-1">
                    <Text style={{ fontFamily: "Sen-Regular", color: colors.text  }} className="text-[16px]">
                      {addr.address_line_1}, {addr.city}
                    </Text>
                    <Text style={{ fontFamily: "Sen-Regular", color: colors.textSecondary  }} className="text-[14px]">
                      {addr.pincode}
                    </Text>
                  </VStack>
                  {addr.is_primary && (
                    <Box style={{backgroundColor: colors.success}} className="rounded-[10px] px-2 py-1">
                      <Text style={{fontFamily: "Sen-Bold"}} className="text-white text-[10px]">Primary</Text>
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>

            <Button
              className="py-4 rounded-xl h-15 mt-6 mb-10"
              onPress={handleLogout}
              style={{backgroundColor: colors.error}}
            >
              <ButtonIcon as={LogOut} className="text-white mr-2" />
              <Text
                style={{ fontFamily: "Sen-Bold" }}
                className="text-white text-[18px]"
              >
                Log Out
              </Text>
            </Button>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ProfileScreen;