import BookingCard from "@/components/BookingCard";
import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import { PURPLE } from "@/constants/serviceTheme";
import { useBookings } from "@/hooks/useBookings";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, CalendarX2 } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function BookingsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const { bookings, loading, error, fetchData, loadFromAsyncStorage } =
    useBookings();

  useFocusEffect(
    useCallback(() => {
      loadFromAsyncStorage();
    }, [loadFromAsyncStorage]),
  );

  // Each real booking is represented by a root record (parent_booking_id
  // is null) that carries the payment, plus a linked child record with the
  // same details and no payment. Only the root records are shown here so
  // each booking the patient made appears exactly once.
  const rootBookings = useMemo(
    () =>
      bookings
        .filter((b) => !b.parent_booking_id)
        .sort(
          (a, b) =>
            new Date(b.scheduled_start_time).getTime() -
            new Date(a.scheduled_start_time).getTime(),
        ),
    [bookings],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Box className="flex-row gap-4 items-center px-3 mt-5">
          <Pressable onPress={() => router.back()} className="ml-2">
            <Icon as={ArrowLeft} size="xl" color={colors.text} />
          </Pressable>
          <ThemedText type="heading" style={{ color: colors.text }}>
            My Bookings
          </ThemedText>
        </Box>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#000"]}
              tintColor={"#fff"}
            />
          }
        >
          {loading ? (
            <Box className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={PURPLE} />
            </Box>
          ) : error && rootBookings.length === 0 ? (
            <Box className="flex-1 justify-center items-center px-6">
              <ThemedText
                type="default"
                className="text-center mb-xl"
                style={{ color: colors.text, fontSize: 18 }}
              >
                {error}
              </ThemedText>
              <Pressable onPress={() => fetchData()}>
                <ThemedText
                  type="defaultBold"
                  style={{ color: PURPLE, fontSize: 18 }}
                >
                  Retry
                </ThemedText>
              </Pressable>
            </Box>
          ) : rootBookings.length === 0 ? (
            <Box className="flex-1 justify-center items-center px-6">
              <CalendarX2 size={40} color={colors.textSecondary} />
              <ThemedText
                type="default"
                className="text-center mt-3"
                style={{ color: colors.textSecondary }}
              >
                You haven&apos;t made any bookings yet.
              </ThemedText>
            </Box>
          ) : (
            <VStack space="md">
              {error ? (
                <Box className="rounded-xl px-4 py-3" style={{ backgroundColor: colors.secondaryBackground }}>
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                    {error}
                  </ThemedText>
                </Box>
              ) : null}
              {rootBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  colors={colors}
                  onPress={() => router.push(`/bookings/${booking.id}`)}
                />
              ))}
            </VStack>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
