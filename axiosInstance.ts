import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import urlData from './config.js';

// Create a dedicated Axios instance
const axiosInstance = axios.create({
  baseURL: urlData.apiUrl
});

// --- Request Interceptor ---
// This runs before every request is sent
axiosInstance.interceptors.request.use(
  async (config) => {
    const tokenString = await AsyncStorage.getItem('access_token');
    if (tokenString) {
      // Parse the token and add it to the Authorization header
      const token = JSON.parse(tokenString).access_token;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
// This runs for every response that comes back from the API
axiosInstance.interceptors.response.use(
  (response) => response, // Directly return successful responses
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 (Unauthorized) and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark it as a retry to prevent infinite loops

      try {
        const refreshTokenString = await AsyncStorage.getItem('refresh_token');
        if (!refreshTokenString) throw new Error("No refresh token found");
        
        const refreshToken = JSON.parse(refreshTokenString).refresh_token;

        // Call the refresh token endpoint
        const { data } = await axios.post(`${urlData.apiUrl}/users/refresh`, {
          refresh_token: refreshToken,
        });

        // Store the new tokens
        await AsyncStorage.setItem('access_token', JSON.stringify({ access_token: data.access_token }));
        await AsyncStorage.setItem('refresh_token', JSON.stringify({ refresh_token: data.refresh_token }));

        // Update the header of the original request with the new token
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;

        // Retry the original request with the new token
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        // If refresh fails, logout the user
        console.error('Token refresh failed:', refreshError);
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        router.replace('/sign-in');
        return Promise.reject(refreshError);
      }
    }

    // For all other errors, just reject the promise
    return Promise.reject(error);
  }
);

export default axiosInstance;
