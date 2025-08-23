import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '@/axiosInstance'; 

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

// A reusable component to display a row of profile information

const ProfileRow = ({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string | undefined | null }) => (
  <View style={styles.row}>
    <Feather name={icon} size={20} color="#a0aec0" style={styles.rowIcon} />
    <View style={styles.rowTextContainer}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || 'Not provided'}</Text>
    </View>
  </View>
);

const ProfileScreen = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch profile and addresses in parallel
      const [profileResponse, addressResponse] = await Promise.all([
        axiosInstance.get('/patients/me'),
        axiosInstance.get('/addresses/me'),
      ]);
      setProfile(profileResponse.data);
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
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  if (error || !profile) {
    return (
      <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={() => router.replace('/sign-in')}>
            <Text style={styles.rowValue}>Go to Sign In</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#4c669f', '#3b5998', '#192f6a']} style={styles.gradientBackground}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
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
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.first_name.charAt(0)}{profile.last_name.charAt(0)}</Text>
              </View>
              <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
              <Text style={styles.email}>{profile.user.email}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Personal Details</Text>
                <Link href="/edit-personal-details" asChild>
                    <Pressable>
                        <Feather name="edit-2" size={20} color="#fff" />
                    </Pressable>
                </Link>
              </View>
              <ProfileRow icon="user" label="Gender" value={profile.gender} />
              <ProfileRow icon="calendar" label="Date of Birth" value={profile.date_of_birth} />
              <ProfileRow icon="phone" label="Phone Number" value={profile.phone_number} />
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>My Addresses</Text>
                <Link href="/manage-addresses" asChild>
                    <Pressable>
                        <Text style={styles.manageButton}>Manage</Text>
                    </Pressable>
                </Link>
              </View>
              {addresses.map((addr) => (
                <View key={addr.id} style={styles.addressContainer}>
                  <Feather name="map-pin" size={20} color="#a0aec0" style={styles.rowIcon} />
                  <View style={styles.rowTextContainer}>
                    <Text style={styles.rowValue}>{addr.address_line_1}, {addr.city}</Text>
                    <Text style={styles.rowLabel}>{addr.pincode}</Text>
                  </View>
                  {addr.is_primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
                </View>
              ))}
            </View>

            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Feather name="log-out" size={20} color="#fff" />
              <Text style={styles.logoutButtonText}>Logout</Text>
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
  scrollContainer: { paddingHorizontal: 20, paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  name: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 14, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.2)', paddingBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  manageButton: { color: '#fff', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  rowIcon: { marginRight: 15 },
  rowTextContainer: { flex: 1 },
  rowLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 },
  rowValue: { fontSize: 16, color: '#fff', fontWeight: '500' },
  addressContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15, gap: 10 },
  primaryBadge: { backgroundColor: '#4CAF50', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', backgroundColor: '#d9534f', paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  logoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  errorText: { color: '#ffcdd2', textAlign: 'center', fontSize: 16, marginBottom: 20 },
});

export default ProfileScreen;
