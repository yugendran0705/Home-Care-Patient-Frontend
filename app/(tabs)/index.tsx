import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const AuthGate = () => {
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for the access token in storage
        const accessToken = await AsyncStorage.getItem("access_token");

        // Give a slight delay to avoid screen flicker
        setTimeout(() => {
          if (accessToken) {
            // If token exists, user is logged in.
            router.replace("/(tabs)/profile");
          } else {
            // If no token, send them to the sign-in screen.
            router.replace("/sign-in");
          }
        }, 500);
      } catch (error) {
        // In case of an error, default to the sign-in screen
        console.error("Failed to check auth status:", error);
        router.replace("/sign-in");
      }
    };

    checkAuthStatus();
  }, []); // The empty dependency array ensures this runs only once on mount

  return (
    // Show a loading indicator while we check the auth status
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.container}
    >
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.text}>Checking authentication...</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 16,
    color: "#ffffff",
    fontSize: 16,
  },
});

export default AuthGate;
