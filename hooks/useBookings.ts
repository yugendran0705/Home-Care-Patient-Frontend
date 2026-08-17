import axiosInstance from "@/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";

export interface Payment {
  id: string;
  booking_id: string;
  patient_id: string;
  amount: string;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  transaction_id: string | null;
  gateway_order_id: string | null;
  failure_reason: string | null;
  refund_id: string | null;
  refunded_amount: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  parent_booking_id: string | null;
  scheduled_start_time: string;
  scheduled_end_time: string;
  booking_time: string;
  total_amount: string;
  booking_status: string;
  payment_status: string;
  notes: string | null;
  service: {
    service_name: string;
    base_price: string;
    duration: number;
    duration_type: string;
    schedule_type: string;
    shift_duration_hours: number | null;
  };
  nurse: {
    first_name: string;
    last_name: string;
    phone_number: string;
    license_number: string;
    years_of_experience: number;
    average_rating: string;
    is_verified: boolean;
  };
  booking_address: {
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment: Payment | null;
}

const BOOKINGS_CACHE_KEY = "bookings";

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/bookings/me");
      setBookings(response.data);
      await AsyncStorage.setItem(
        BOOKINGS_CACHE_KEY,
        JSON.stringify(response.data),
      );
    } catch (e: any) {
      setError("Failed to fetch bookings. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromAsyncStorage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const cached = await AsyncStorage.getItem(BOOKINGS_CACHE_KEY);
      if (cached) {
        setBookings(JSON.parse(cached));
        setLoading(false);
      } else {
        await fetchData();
      }
    } catch (e: any) {
      console.error("Failed to load bookings from AsyncStorage:", e);
      setError("Failed to load bookings.");
      setLoading(false);
    }
  }, [fetchData]);

  return { bookings, loading, error, fetchData, loadFromAsyncStorage };
}
