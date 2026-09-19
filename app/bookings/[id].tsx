import axiosInstance from "@/axiosInstance";
import CompletionCodeCard from "@/components/CompletionCodeCard";
import ReviewSection from "@/components/ReviewSection";
import ShiftCarousel from "@/components/ShiftCarousel";
import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import {
  PURPLE,
  PURPLE_DARK,
  PURPLE_DEEP,
  PURPLE_SOFT,
  formatDuration,
  formatPrice,
  statusPalette,
} from "@/constants/serviceTheme";
import { useAlert } from "@/hooks/useAlert";
import { useBookings, type Booking } from "@/hooks/useBookings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

// The handover code only exists once the visit is paid for and confirmed
// (booking_status / payment_status ENUMs in the backend's models.Booking).
const awaitingCompletion = (b: Booking) =>
  b.booking_status === "Confirmed" && b.payment_status === "Paid";

export default function BookingDetailScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const showAlert = useAlert();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings, loading, error, fetchData } = useBookings();
  const [payingNow, setPayingNow] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const booking = bookings.find((b) => b.id === id);

  // A Daily_Shift booking is a billing wrapper; each shift is its own child
  // booking with its own completion code and review. A Continuous booking is
  // a single visit and has no children.
  const shifts = useMemo(
    () =>
      bookings
        .filter((b) => b.parent_booking_id === id)
        .sort(
          (a, b) =>
            new Date(a.scheduled_start_time).getTime() -
            new Date(b.scheduled_start_time).getTime(),
        ),
    [bookings, id],
  );

  const refetchSilently = useCallback(
    () => fetchData({ silent: true }),
    [fetchData],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData({ silent: true });
    setRefreshing(false);
  }, [fetchData]);

  // Quote first (same backend policy code as the cancel itself), so the
  // patient sees exactly what they'll get back before confirming.
  const handleCancelBooking = async () => {
    if (!booking) return;
    const detail = (e: any, fallback: string) =>
      typeof e?.response?.data?.detail === "string" ? e.response.data.detail : fallback;

    setCancelling(true);
    let quote: {
      cancellable: boolean;
      reason: string | null;
      visits_to_cancel: number;
      partial_refund_visits: number;
      refund_amount: string;
      policy: string;
    };
    try {
      ({ data: quote } = await axiosInstance.get(`/bookings/${booking.id}/cancellation`));
    } catch (e: any) {
      showAlert("Couldn't cancel", detail(e, "Please try again."));
      return;
    } finally {
      setCancelling(false);
    }

    if (!quote.cancellable) {
      showAlert("Can't cancel this booking", quote.reason ?? quote.policy);
      return;
    }

    const refund = parseFloat(quote.refund_amount);
    const visits =
      quote.visits_to_cancel > 1 ? `${quote.visits_to_cancel} upcoming visits` : "this visit";
    const refundLine =
      booking.booking_status === "Pending"
        ? "You haven't paid yet, so nothing will be charged."
        : refund > 0
          ? `You'll get ₹${formatPrice(quote.refund_amount)} back` +
            (quote.partial_refund_visits > 0
              ? ` (50% for visits within 12 hours).`
              : " — a full refund.")
          : "No refund applies under the cancellation policy.";

    showAlert("Cancel booking?", `This cancels ${visits}. ${refundLine}\n\n${quote.policy}`, [
      { text: "Keep booking", style: "cancel" },
      {
        text: "Cancel booking",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            await axiosInstance.post(`/bookings/${booking.id}/cancel`);
            await fetchData({ silent: true });
            showAlert(
              "Booking cancelled",
              refund > 0
                ? `A refund of ₹${formatPrice(quote.refund_amount)} is on its way (usually 5–7 working days).`
                : undefined,
            );
          } catch (e: any) {
            showAlert("Couldn't cancel", detail(e, "Please try again."));
            fetchData({ silent: true });
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleCompletePayment = async () => {
    if (!booking?.payment?.gateway_order_id) return;

    setPayingNow(true);
    try {
      let prefillName = "";
      let prefillEmail = "";
      let prefillContact = "";
      try {
        const stored = await AsyncStorage.getItem("profile");
        if (stored) {
          const profile = JSON.parse(stored);
          prefillName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
          prefillEmail = profile.user?.email ?? "";
          prefillContact = profile.phone_number ?? "";
        }
      } catch {
        // Prefill is a nicety, not required — ignore failures.
      }

      const cachedKey = await AsyncStorage.getItem("razorpay_key_id");

      try {
        await RazorpayCheckout.open({
          key: cachedKey ?? process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? "",
          order_id: booking.payment.gateway_order_id,
          amount: Math.round(parseFloat(booking.payment.amount) * 100),
          currency: booking.payment.currency,
          name: "Home Care",
          description: booking.service.service_name,
          prefill: {
            name: prefillName,
            email: prefillEmail,
            contact: prefillContact,
          },
          theme: { color: PURPLE_DARK },
        });
        showAlert("Payment Successful", "Your booking is confirmed.");
      } catch (paymentError: any) {
        showAlert(
          "Payment Not Completed",
          "The payment wasn't completed. You can retry anytime from here.",
        );
      } finally {
        fetchData();
      }
    } finally {
      setPayingNow(false);
    }
  };

  const Header = (
    <Box className="flex-row gap-4 items-center px-3 mt-5">
      <Pressable onPress={() => router.back()} className="ml-2">
        <Icon as={ArrowLeft} size="xl" color={colors.text} />
      </Pressable>
      <ThemedText type="heading" style={{ color: colors.text }}>
        Booking Details
      </ThemedText>
    </Box>
  );

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          {Header}
          <Box className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={PURPLE} />
          </Box>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!booking) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          {Header}
          <Box className="flex-1 justify-center items-center px-6">
            <ThemedText
              type="default"
              className="text-center mb-xl"
              style={{ color: colors.text, fontSize: 18 }}
            >
              {/* The hook keeps the last good list on a failed refetch, so reaching
                  here with an error means we never loaded it - don't claim the
                  booking doesn't exist. */}
              {error
                ? "Couldn't load this booking. Check your connection and try again."
                : "Booking not found."}
            </ThemedText>
            <Pressable onPress={() => fetchData()}>
              <ThemedText type="defaultBold" style={{ color: PURPLE, fontSize: 18 }}>
                Retry
              </ThemedText>
            </Pressable>
          </Box>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const bookingPalette = statusPalette(booking.booking_status);
  const paymentPalette = statusPalette(booking.payment_status);
  const nurseInitials = `${booking.nurse.first_name.charAt(0)}${booking.nurse.last_name.charAt(0)}`;
  const rating = parseFloat(booking.nurse.average_rating);
  const isDailyShift = booking.service.schedule_type === "Daily_Shift";

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        {Header}

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PURPLE]}
              tintColor={PURPLE}
            />
          }
        >
          <VStack space="lg">
            {/* Hero */}
            <VStack space="sm" className="items-start">
              <HStack className="items-center justify-between" style={{ width: "100%" }}>
                <ThemedText
                  type="heading"
                  style={{ color: colors.text, flex: 1, marginRight: 8 }}
                >
                  {booking.service.service_name}
                </ThemedText>
                <Box
                  className="rounded-full px-3 py-1.5"
                  style={{ backgroundColor: bookingPalette.bg }}
                >
                  <ThemedText type="captionBold" style={{ color: bookingPalette.fg }}>
                    {booking.booking_status}
                  </ThemedText>
                </Box>
              </HStack>
              <ThemedText type="defaultBold" style={{ color: PURPLE_DEEP, fontSize: 18 }}>
                ₹{formatPrice(booking.total_amount)}
              </ThemedText>
            </VStack>

            {/* Schedule */}
            <VStack
              space="sm"
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.secondaryBackground }}
            >
              <HStack space="sm" className="items-center">
                <Calendar size={16} color={PURPLE} />
                <ThemedText type="defaultBold" style={{ color: colors.text }}>
                  {formatDateTime(booking.scheduled_start_time)}
                </ThemedText>
              </HStack>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                {formatTime(booking.scheduled_start_time)} – {formatTime(booking.scheduled_end_time)}
              </ThemedText>
            </VStack>

            {/* Completion code + review for a single-visit (Continuous) booking */}
            {!isDailyShift && awaitingCompletion(booking) ? (
              <CompletionCodeCard
                bookingId={booking.id}
                colors={colors}
                onStale={refetchSilently}
              />
            ) : null}

            {!isDailyShift && booking.booking_status === "Completed" ? (
              <VStack space="sm">
                <ThemedText type="defaultBold" style={{ color: colors.text }}>
                  {booking.review ? "Your Review" : "Rate Your Visit"}
                </ThemedText>
                <ReviewSection
                  bookingId={booking.id}
                  review={booking.review}
                  colors={colors}
                  onChanged={refetchSilently}
                />
              </VStack>
            ) : null}

            {/* Info grid */}
            <HStack
              className="justify-around rounded-2xl p-4"
              style={{ backgroundColor: colors.secondaryBackground }}
            >
              <VStack space="xs" className="items-center flex-1">
                <ThemedText type="smallBold" style={{ color: colors.text }}>
                  {formatDuration(
                    booking.service.duration,
                    booking.service.duration_type,
                  )}
                </ThemedText>
                <ThemedText type="caption" className="text-center" style={{ color: colors.textSecondary }}>
                  Duration
                </ThemedText>
              </VStack>
              {booking.service.shift_duration_hours ? (
                <VStack space="xs" className="items-center flex-1">
                  <ThemedText type="smallBold" style={{ color: colors.text }}>
                    {booking.service.shift_duration_hours} hrs
                  </ThemedText>
                  <ThemedText type="caption" className="text-center" style={{ color: colors.textSecondary }}>
                    Shift Duration
                  </ThemedText>
                </VStack>
              ) : null}
            </HStack>

            {/* Shifts of a Daily_Shift booking, each completed/reviewed on its own */}
            {isDailyShift && shifts.length > 0 ? (
              <ShiftCarousel
                shifts={shifts}
                colors={colors}
                awaitingCompletion={awaitingCompletion}
                onChanged={refetchSilently}
              />
            ) : null}

            {/* Nurse */}
            <VStack space="sm">
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                Assigned Nurse
              </ThemedText>
              <HStack
                space="md"
                className="items-center rounded-2xl p-4"
                style={{ backgroundColor: colors.secondaryBackground }}
              >
                <Box
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: PURPLE_SOFT }}
                >
                  <ThemedText type="defaultBold" style={{ color: PURPLE_DEEP }}>
                    {nurseInitials}
                  </ThemedText>
                </Box>
                <VStack className="flex-1" space="xs">
                  <HStack space="xs" className="items-center">
                    <ThemedText type="smallBold" style={{ color: colors.text }}>
                      {booking.nurse.first_name} {booking.nurse.last_name}
                    </ThemedText>
                    {booking.nurse.is_verified && (
                      <ShieldCheck size={14} color={PURPLE} />
                    )}
                  </HStack>
                  <HStack space="xs" className="items-center">
                    <Star size={12} color="#F5A623" fill="#F5A623" />
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      {rating > 0 ? rating.toFixed(1) : "New"} ·{" "}
                      {booking.nurse.years_of_experience} yrs exp.
                    </ThemedText>
                  </HStack>
                  <HStack space="xs" className="items-center">
                    <Phone size={12} color={colors.textSecondary} />
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      {booking.nurse.phone_number}
                    </ThemedText>
                  </HStack>
                </VStack>
              </HStack>
            </VStack>

            {/* Address */}
            <VStack space="sm">
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                Service Address
              </ThemedText>
              <HStack
                space="md"
                className="items-start rounded-2xl p-4"
                style={{ backgroundColor: colors.secondaryBackground }}
              >
                <MapPin size={16} color={PURPLE} style={{ marginTop: 2 }} />
                <ThemedText type="small" style={{ color: colors.text, flex: 1, lineHeight: 20 }}>
                  {booking.booking_address.address_line_1}
                  {booking.booking_address.address_line_2
                    ? `, ${booking.booking_address.address_line_2}`
                    : ""}
                  {"\n"}
                  {booking.booking_address.city}, {booking.booking_address.state}{" "}
                  {booking.booking_address.pincode}
                </ThemedText>
              </HStack>
            </VStack>

            {/* Notes */}
            {booking.notes ? (
              <VStack space="xs">
                <ThemedText type="defaultBold" style={{ color: colors.text }}>
                  Notes
                </ThemedText>
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  {booking.notes}
                </ThemedText>
              </VStack>
            ) : null}

            {/* Payment */}
            <VStack space="sm">
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                Payment
              </ThemedText>
              <VStack
                space="md"
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.secondaryBackground }}
              >
                <HStack className="items-center justify-between">
                  <HStack space="sm" className="items-center">
                    <CreditCard size={16} color={paymentPalette.fg} />
                    <ThemedText type="smallBold" style={{ color: colors.text }}>
                      ₹{formatPrice(booking.total_amount)}
                    </ThemedText>
                  </HStack>
                  <Box
                    className="rounded-full px-2.5 py-1"
                    style={{ backgroundColor: paymentPalette.bg }}
                  >
                    <ThemedText type="captionBold" style={{ color: paymentPalette.fg }}>
                      {booking.payment_status}
                    </ThemedText>
                  </Box>
                </HStack>

                {booking.payment ? (
                  <VStack
                    space="sm"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: PURPLE_SOFT,
                      paddingTop: 12,
                    }}
                  >
                    <HStack className="items-center justify-between">
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>
                        Payment Method
                      </ThemedText>
                      <ThemedText type="smallBold" style={{ color: colors.text }}>
                        {booking.payment.payment_method?.toUpperCase() ?? "—"}
                      </ThemedText>
                    </HStack>
                    <HStack className="items-center justify-between">
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>
                        Transaction ID
                      </ThemedText>
                      <ThemedText type="smallBold" style={{ color: colors.text }}>
                        {booking.payment.transaction_id ?? "—"}
                      </ThemedText>
                    </HStack>
                    <HStack className="items-center justify-between">
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>
                        Paid On
                      </ThemedText>
                      <ThemedText type="smallBold" style={{ color: colors.text }}>
                        {new Date(booking.payment.created_at).toLocaleString(
                          undefined,
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}
                      </ThemedText>
                    </HStack>
                    <HStack className="items-center justify-between">
                      <ThemedText type="small" style={{ color: colors.textSecondary }}>
                        Currency
                      </ThemedText>
                      <ThemedText type="smallBold" style={{ color: colors.text }}>
                        {booking.payment.currency}
                      </ThemedText>
                    </HStack>
                    {booking.payment.failure_reason ? (
                      <HStack className="items-center justify-between">
                        <ThemedText type="small" style={{ color: colors.textSecondary }}>
                          Failure Reason
                        </ThemedText>
                        <ThemedText
                          type="smallBold"
                          style={{ color: colors.error, flexShrink: 1, textAlign: "right" }}
                        >
                          {booking.payment.failure_reason}
                        </ThemedText>
                      </HStack>
                    ) : null}
                    {booking.payment.refunded_amount ? (
                      <HStack className="items-center justify-between">
                        <ThemedText type="small" style={{ color: colors.textSecondary }}>
                          Refunded Amount
                        </ThemedText>
                        <ThemedText type="smallBold" style={{ color: colors.text }}>
                          ₹{formatPrice(booking.payment.refunded_amount)}
                        </ThemedText>
                      </HStack>
                    ) : null}
                  </VStack>
                ) : (
                  <ThemedText
                    type="small"
                    style={{
                      color: colors.textSecondary,
                      borderTopWidth: 1,
                      borderTopColor: PURPLE_SOFT,
                      paddingTop: 12,
                    }}
                  >
                    No payment has been recorded for this booking yet.
                  </ThemedText>
                )}

                {booking.payment_status === "Pending" &&
                booking.payment?.gateway_order_id ? (
                  <Pressable
                    onPress={handleCompletePayment}
                    disabled={payingNow}
                    className="rounded-full py-3 items-center justify-center"
                    style={{
                      backgroundColor: PURPLE_DARK,
                      opacity: payingNow ? 0.7 : 1,
                      marginTop: 4,
                    }}
                  >
                    {payingNow ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <ThemedText
                        type="defaultBold"
                        style={{ color: colors.textInverted }}
                      >
                        Complete Payment
                      </ThemedText>
                    )}
                  </Pressable>
                ) : null}
              </VStack>
            </VStack>

            {/* Cancel: only the whole booking (root record), while it's still open */}
            {!booking.parent_booking_id &&
            (booking.booking_status === "Pending" ||
              booking.booking_status === "Confirmed") ? (
              <Pressable
                onPress={handleCancelBooking}
                disabled={cancelling}
                className="rounded-full items-center justify-center"
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: colors.error,
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? (
                  <ActivityIndicator color={colors.error} />
                ) : (
                  <ThemedText
                    type="defaultBold"
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.3}
                    style={{ color: colors.error }}
                  >
                    Cancel booking
                  </ThemedText>
                )}
              </Pressable>
            ) : null}
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
