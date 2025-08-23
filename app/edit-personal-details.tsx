import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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

// Define a type for the updatable fields
interface PersonalDetails {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
}

const EditPersonalDetailsScreen = () => {
    const [details, setDetails] = useState<PersonalDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentDetails = async () => {
            try {
                const response = await axiosInstance.get('/patients/me');
                setDetails({
                    first_name: response.data.first_name,
                    last_name: response.data.last_name,
                    phone_number: response.data.phone_number,
                    date_of_birth: response.data.date_of_birth,
                    gender: response.data.gender,
                });
            } catch (error) {
                Alert.alert('Error', 'Could not fetch your details.');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentDetails();
    }, []);

    const handleDetailsChange = (field: keyof PersonalDetails, value: string) => {
        setDetails(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = async () => {
        if (!details) return;
        setLoading(true);
        try {
            // Assuming your backend uses a PATCH or PUT request to update
            await axiosInstance.patch('/patients/me', details);
            Alert.alert('Success', 'Your details have been updated.');
            router.back(); // Go back to the profile screen
        } catch (error) {
            Alert.alert('Error', 'Could not update your details.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading || !details) {
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
                    <Text style={styles.title}>Edit Personal Details</Text>
                    <View style={{ width: 40 }} />
                </View>
              <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.label}>First Name</Text>
                <TextInput style={styles.input} value={details.first_name} onChangeText={v => handleDetailsChange('first_name', v)} />
                
                <Text style={styles.label}>Last Name</Text>
                <TextInput style={styles.input} value={details.last_name} onChangeText={v => handleDetailsChange('last_name', v)} />
                
                <Text style={styles.label}>Phone Number</Text>
                <TextInput style={styles.input} value={details.phone_number} onChangeText={v => handleDetailsChange('phone_number', v)} keyboardType="phone-pad" />
                
                {/* Note: In a real app, you'd use a date picker here as well */}
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput style={styles.input} value={details.date_of_birth} onChangeText={v => handleDetailsChange('date_of_birth', v)} placeholder="YYYY-MM-DD" />
                
                <Text style={styles.label}>Gender</Text>
                <TextInput style={styles.input} value={details.gender} onChangeText={v => handleDetailsChange('gender', v)} />

                <Pressable style={styles.saveButton} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="#192f6a" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
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
    label: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 8,
        marginLeft: 5,
    },
    input: { 
        height: 55, 
        backgroundColor: 'rgba(255, 255, 255, 0.2)', 
        borderRadius: 14, 
        paddingHorizontal: 15, 
        fontSize: 16, 
        color: '#fff', 
        marginBottom: 20 
    },
    saveButton: { 
        backgroundColor: '#fff', 
        paddingVertical: 15, 
        borderRadius: 14, 
        alignItems: 'center', 
        marginTop: 20 
    },
    saveButtonText: { 
        color: '#192f6a', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
});

export default EditPersonalDetailsScreen;
