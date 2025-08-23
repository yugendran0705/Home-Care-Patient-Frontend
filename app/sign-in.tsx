import { Feather } from '@expo/vector-icons'; // Using Feather icons
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router'; // Using Link for navigation with Expo Router
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import data from '../config.js';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignInScreen = () => {
  // State for the input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    // Prevent multiple presses while loading
    if (loading) return;

    // Reset previous errors
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${data.apiUrl}/users/login`, {
        email,
        password,
      });
      // Assuming the response body has access_token and refresh_token
      const { access_token, refresh_token } = response.data;
      // Securely store the tokens
      await AsyncStorage.setItem('access_token', JSON.stringify({access_token}));
      await AsyncStorage.setItem('refresh_token', JSON.stringify({refresh_token}));
      
      // Navigate to the main part of the app on success
      router.push('/(tabs)/profile'); // Adjust this path based on your app structure

    } catch (e: any) {
      // Set a user-friendly error message
      const errorMessage = e.response ? e.response.data.message : 'Invalid credentials or network error.';
      setError(errorMessage);
      console.error(e); // Log the full error for debugging
    } finally {
      // Ensure loading is always turned off
      setLoading(false);
    }
  };

  return (
    // LinearGradient creates the beautiful background effect
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.gradientBackground}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.innerContainer}>
            {/* App Title */}
            <Text style={styles.title}>HomeCare</Text>
            <Text style={styles.subtitle}>Welcome back, please sign in</Text>

            {/* Email Input Field */}
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#a0aec0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />
            </View>

            {/* Password Input Field */}
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#a0aec0" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#a0aec0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry // Hides password characters
                textContentType="password"
              />
            </View>
            {/* Error Message */}
            {error !== '' && (
              <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
                {error}
              </Text>
            )}
            {/* Sign In Button */}
            <Pressable style={styles.signInButton} onPress={handleSignIn}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
              {/* Use the Link component from expo-router to navigate */}
              <Link href="./sign-up" asChild>
                <Pressable>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 48,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55,
    color: '#fff',
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    // Using Platform.select to apply the correct shadow/elevation style
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  signInButtonText: {
    color: '#192f6a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  signUpText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signUpLink: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SignInScreen;
