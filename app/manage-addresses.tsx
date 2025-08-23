import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import axiosInstance from '../axiosInstance'; 

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

  // useFocusEffect will refetch data every time the screen comes into view
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
        // The backend handles the logic of setting others to false
        await axiosInstance.patch(`/addresses/set_primary/${addressId}`);
        Alert.alert('Success', 'Primary address updated.');
        await loadData(); // Refresh the list
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
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.gradientBackground}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#fff" />
                </Pressable>
                <Text style={styles.title}>Manage Addresses</Text>
                <View style={{ width: 40 }} />
            </View>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#000']} // for Android
                tintColor={'#fff'} // for iOS
              />
            }
          >
            {addresses.map((addr) => (
              <View key={addr.id} style={styles.card}>
                <View>
                    <Text style={styles.addressText}>{addr.address_line_1}, {addr.address_line_2}</Text>
                    <Text style={styles.addressSubText}>{addr.city}, {addr.pincode}</Text>
                </View>
                {addr.is_primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
                <View style={styles.actionsContainer}>
                    {!addr.is_primary && (
                        <Pressable style={styles.actionButton} onPress={() => handleSetPrimary(addr.id)}>
                            <Text style={styles.actionButtonText}>Set as Primary</Text>
                        </Pressable>
                    )}
                    <Pressable style={styles.actionButton} onPress={() => router.push({ pathname: '/address-form', params: { addressId: addr.id } })}>
                        <Text style={styles.actionButtonText}>Edit</Text>
                    </Pressable>
                </View>
              </View>
            ))}
            <Pressable style={styles.addButton} onPress={() => router.push('/address-form')}>
                <Feather name="plus" size={20} color="#192f6a" />
                <Text style={styles.addButtonText}>Add New Address</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    gradientBackground: { flex: 1 },
    safeArea: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: 20 },
    backButton: { padding: 10 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    scrollContainer: { padding: 20 },
    card: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 14, padding: 20, marginBottom: 20 },
    addressText: { fontSize: 16, color: '#fff', fontWeight: 'bold', marginBottom: 4 },
    addressSubText: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' },
    primaryBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: '#4CAF50', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    primaryText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    actionsContainer: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.2)', marginTop: 15, paddingTop: 15 },
    actionButton: { paddingHorizontal: 15, paddingVertical: 8, marginLeft: 10, backgroundColor: '#192f6a', borderRadius: 8 },
    actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    addButton: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    addButtonText: { color: '#192f6a', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});

export default ManageAddressesScreen;
