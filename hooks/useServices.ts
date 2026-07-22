import axiosInstance from "@/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";

export interface Service {
  service_name: string;
  description: string;
  base_price: number;
  duration: number;
  duration_type: string;
  is_active: boolean;
  is_qualified: boolean;
  schedule_type: string;
  shift_duration_hours: number;
  id: string;
}

const SERVICES_CACHE_KEY = "services";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/nursing_services/all");
      const activeServices = response.data.filter(
        (service: { is_active: boolean }) => service.is_active,
      );
      setServices(activeServices);
      await AsyncStorage.setItem(
        SERVICES_CACHE_KEY,
        JSON.stringify(activeServices),
      );
    } catch (e: any) {
      setError("Failed to fetch data. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reads the cache first for an instant render; if nothing is cached yet
  // (e.g. a cold app start deep-linked straight into a detail screen),
  // falls back to fetching from the API.
  const loadFromAsyncStorage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const cached = await AsyncStorage.getItem(SERVICES_CACHE_KEY);
      if (cached) {
        setServices(JSON.parse(cached));
        setLoading(false);
      } else {
        await fetchData();
      }
    } catch (e: any) {
      console.error("Failed to load from AsyncStorage:", e);
      setError("Failed to load data.");
      setLoading(false);
    }
  }, [fetchData]);

  return { services, loading, error, fetchData, loadFromAsyncStorage };
}
