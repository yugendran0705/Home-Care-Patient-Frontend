import { Box } from "@/components/ui/box";
import { Button, ButtonIcon, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosInstance';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from "react-native";
import { Plus } from "lucide-react-native";
import { Divider } from "@/components/ui/divider";
interface Address {
  id: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  is_primary: boolean;
}

const ManageAddressesScreen = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/addresses/me');
      setAddresses(response.data);
      setError('');
    } catch (e) {
      setError('Failed to fetch addresses.');
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const initialLoad = async () => {
        setLoading(true);
        await loadData();
        setLoading(false);
      };
      initialLoad();
    }, [loadData])
  );

  const handleSetPrimary = async (addressId: string) => {
    try {
      await axiosInstance.patch(`/addresses/set_primary/${addressId}`);
      Alert.alert('Success', 'Primary address updated.');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Could not update primary address.');
      console.error(error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) {
    return (
      <Box className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#4c8bf5" />
      </Box>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.primaryBackground }}>
        <Box className="flex-row items-center justify-between px-[10px] mt-[20px]">
          <Pressable onPress={() => router.back()} className="p-[10px]">
            <Feather name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <Text style={{ fontFamily: "Sen-Bold" }} className="text-[22px] text-white">Manage Addresses</Text>
          <Box className="w-[40px]" />
        </Box>
        <ScrollView
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000']}
              tintColor={'#fff'}
            />
          }
        >
          {addresses.map((addr) => (
            <VStack key={addr.id} style={{backgroundColor: colors.surface}} className="rounded-[14px] p-[20px] mb-[20px] relative">
              <Box>
                <Text style={{ fontFamily: "Sen-Bold", color: colors.text }} className="text-[16px] mb-[4px]">{addr.address_line_1}, {addr.address_line_2}</Text>
                <Text style={{ fontFamily: "Sen-Regular", color: colors.text }} className="text-[14px] text-white/80">{addr.city}, {addr.pincode}</Text>
              </Box>

              {addr.is_primary && (
                <Box className="absolute top-[15px] right-[15px] bg-[#4CAF50] rounded-[10px] px-[8px] py-[4px]">
                  <Text style={{ fontFamily: "Sen-Bold" }} className="text-white text-[12px]">Primary</Text>
                </Box>
              )}

              <Divider style={{ backgroundColor: colors.icon }} className="my-3" />

              <Box className="flex-row justify-end pt-[15px]">
                {!addr.is_primary && (
                  <Button
                    className="px-[15px] py-[8px] ml-[10px] rounded-[8px]" style={{backgroundColor: colors.accent}}
                    onPress={() => handleSetPrimary(addr.id)}
                  >
                    <ButtonText style={{ fontFamily: "Sen-Bold" }} className="text-white">Set as Primary</ButtonText>
                  </Button>
                )}
                <Button
                  className="px-[15px] py-[8px] ml-[10px] bg-[#192f6a] rounded-[8px]" style={{backgroundColor: colors.accent}}
                  onPress={() => router.push({ pathname: '/address-form', params: { addressId: addr.id } })}
                >
                  <ButtonText style={{ fontFamily: "Sen-Bold" }} className="text-white" >Edit</ButtonText>
                </Button>
              </Box>
            </VStack>
          ))}

          <Button
            className="flex-row bg-white py-[15px] rounded-[14px] items-center justify-center mt-[10px] h-auto"
            onPress={() => router.push('/address-form')}
          >
            <ButtonIcon as={Plus} className="text-black mr-[10px]" />
            <ButtonText style={{ fontFamily: "Sen-Bold" }} className="text-black text-[18px]">Add New Address</ButtonText>
          </Button>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default ManageAddressesScreen;