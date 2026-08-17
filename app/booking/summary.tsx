import axiosInstance from "@/axiosInstance";
import AddressSelectorSheet, {
  Address,
} from "@/components/AddressSelectorSheet";
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
  formatPrice,
} from "@/constants/serviceTheme";
import { NurseSearchResult } from "@/components/NurseCard";
import { useAlert } from "@/hooks/useAlert";
import { useServices } from "@/hooks/useServices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Info,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  useColorScheme,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const primaryOf = (list: Address[]) =>
  list.find((a) => a.is_primary) ?? list[0] ?? null;

export default function BookingSummaryScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const showAlert = useAlert();
  const { serviceId, requestedStartTime, nurse } = useLocalSearchParams<{
    serviceId: string;
    requestedStartTime: string;
    nurse: string;
  }>();
  const { services, loadFromAsyncStorage } = useServices();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const nurseData: NurseSearchResult | null = useMemo(() => {
    try {
      return nurse ? JSON.parse(nurse) : null;
    } catch {
      return null;
    }
  }, [nurse]);

  const loadAddresses = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("addresses");
      const list: Address[] = stored ? JSON.parse(stored) : [];
      setSavedAddresses(list);
      setSelectedAddress((current) => current ?? primaryOf(list));
    } catch (e) {
      console.error("Failed to load addresses:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFromAsyncStorage();
      loadAddresses();
    }, [loadFromAsyncStorage, loadAddresses]),
  );

  const service = services.find((s) => s.id === serviceId);
  const startDate = requestedStartTime ? new Date(requestedStartTime) : null;

  const handleBookNow = async () => {
    if (!service || !nurseData || !startDate) return;
    if (!selectedAddress) {
      showAlert("Address Needed", "Please select a service address.");
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await axiosInstance.post("/bookings/", {
        nurse_id: nurseData.nurse_id,
        service_id: service.id,
        scheduled_start_time: startDate.toISOString(),
        booking_address_id: selectedAddress.id,
        notes,
      });

      const {
        booking: createdBooking,
        payment,
        razorpay_key_id,
      } = response.data;

      await AsyncStorage.setItem("razorpay_key_id", razorpay_key_id);

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

      const goToBooking = () => router.replace(`/bookings/${createdBooking.id}`);

      try {
        await RazorpayCheckout.open({
          key: razorpay_key_id,
          order_id: payment.gateway_order_id,
          amount: Math.round(parseFloat(payment.amount) * 100),
          currency: payment.currency,
          name: "Home Care",
          description: service.service_name,
          prefill: {
            name: prefillName,
            email: prefillEmail,
            contact: prefillContact,
          },
          theme: { color: PURPLE_DARK },
        });
        showAlert("Payment Successful", "Your booking is confirmed.", [
          { text: "OK", onPress: goToBooking },
        ]);
      } catch (paymentError: any) {
        showAlert(
          "Payment Not Completed",
          "Your booking has been saved, but the payment wasn't completed. You can retry payment from the booking details page.",
          [{ text: "OK", onPress: goToBooking }],
        );
      }
    } catch (error: any) {
      showAlert(
        "Booking Failed",
        error?.response?.data?.detail ??
          "Failed to create the booking. Please try again.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const Header = (
    <Box className="flex-row gap-4 items-center px-3 mt-5">
      <Pressable onPress={() => router.back()} className="ml-2">
        <Icon as={ArrowLeft} size="xl" color={colors.text} />
      </Pressable>
      <ThemedText type="heading" style={{ color: colors.text }}>
        Booking Summary
      </ThemedText>
    </Box>
  );

  if (!service || !nurseData || !startDate) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
        >
          {Header}
          <Box className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={PURPLE} />
          </Box>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const nurseInitials = `${nurseData.first_name.charAt(0)}${nurseData.last_name.charAt(0)}`;
  const nurseRating = parseFloat(nurseData.average_rating);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        {Header}

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <VStack space="lg">
            {/* Service */}
            <VStack
              space="xs"
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.secondaryBackground }}
            >
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                {service.service_name}
              </ThemedText>
              <ThemedText type="defaultBold" style={{ color: PURPLE_DEEP }}>
                ₹{formatPrice(service.base_price)}
              </ThemedText>
            </VStack>

            {/* Date & time */}
            <HStack
              space="sm"
              className="items-center rounded-2xl p-4"
              style={{ backgroundColor: colors.secondaryBackground }}
            >
              <Calendar size={18} color={PURPLE} />
              <ThemedText type="smallBold" style={{ color: colors.text }}>
                {startDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {service.schedule_type === "Continuous"
                  ? ""
                  : ` · ${startDate.toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}`}
              </ThemedText>
            </HStack>

            {service.schedule_type === "Daily_Shift" &&
            service.duration_type === "days" &&
            service.duration > 1 ? (
              <HStack
                space="sm"
                className="items-start rounded-2xl p-4"
                style={{ backgroundColor: PURPLE_SOFT }}
              >
                <Info size={16} color={PURPLE_DEEP} style={{ marginTop: 2 }} />
                <ThemedText
                  type="small"
                  style={{ color: PURPLE_DEEP, flex: 1, lineHeight: 19 }}
                >
                  This visit will repeat daily for {service.duration} days at
                  this same time.
                </ThemedText>
              </HStack>
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
                      {nurseData.first_name} {nurseData.last_name}
                    </ThemedText>
                    <ShieldCheck size={14} color={PURPLE} />
                  </HStack>
                  <HStack space="xs" className="items-center">
                    <Star size={12} color="#F5A623" fill="#F5A623" />
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      {nurseRating > 0 ? nurseRating.toFixed(1) : "New"}{" "}
                      · {nurseData.years_of_experience} yrs exp.
                    </ThemedText>
                  </HStack>
                  <HStack space="xs" className="items-center">
                    <Phone size={12} color={colors.textSecondary} />
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      {nurseData.phone_number}
                    </ThemedText>
                  </HStack>
                </VStack>
              </HStack>
            </VStack>

            {/* Address */}
            <VStack space="sm">
              <HStack className="items-center justify-between">
                <ThemedText type="defaultBold" style={{ color: colors.text }}>
                  Service Address
                </ThemedText>
                <Pressable onPress={() => setAddressSheetVisible(true)}>
                  <ThemedText type="captionBold" style={{ color: PURPLE }}>
                    Change
                  </ThemedText>
                </Pressable>
              </HStack>
              <Pressable
                onPress={() => setAddressSheetVisible(true)}
                className="flex-row items-start rounded-2xl p-4"
                style={{ backgroundColor: colors.secondaryBackground }}
              >
                <MapPin size={16} color={PURPLE} style={{ marginTop: 2 }} />
                {selectedAddress ? (
                  <ThemedText
                    type="small"
                    style={{ color: colors.text, flex: 1, marginLeft: 12, lineHeight: 20 }}
                  >
                    {selectedAddress.address_line_1}
                    {selectedAddress.address_line_2
                      ? `, ${selectedAddress.address_line_2}`
                      : ""}
                    {"\n"}
                    {selectedAddress.city}, {selectedAddress.state}{" "}
                    {selectedAddress.pincode}
                  </ThemedText>
                ) : (
                  <ThemedText
                    type="small"
                    style={{ color: colors.textSecondary, flex: 1, marginLeft: 12 }}
                  >
                    Select a service address
                  </ThemedText>
                )}
                <ChevronRight size={16} color={colors.textSecondary} />
              </Pressable>
            </VStack>

            {/* Notes */}
            <VStack space="sm">
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                Notes (optional)
              </ThemedText>
              <TextInput
                style={{
                  backgroundColor: colors.secondaryBackground,
                  color: colors.text,
                  fontFamily: "Sen-Regular",
                  fontSize: 16,
                  borderRadius: 16,
                  padding: 16,
                  minHeight: 90,
                  textAlignVertical: "top",
                }}
                placeholder="Add any instructions for the nurse..."
                placeholderTextColor={colors.textSecondary}
                cursorColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </VStack>
          </VStack>
        </ScrollView>

        <AddressSelectorSheet
          visible={addressSheetVisible}
          onClose={() => setAddressSheetVisible(false)}
          addresses={savedAddresses}
          selectedAddressId={selectedAddress?.id ?? null}
          onSelectAddress={(address) => {
            setSelectedAddress(address);
            setAddressSheetVisible(false);
          }}
          onAddNewAddress={() => {
            setAddressSheetVisible(false);
            router.push("/address-form");
          }}
        />

        <Box className="px-6 pb-4 pt-2">
          <Pressable
            onPress={handleBookNow}
            disabled={placingOrder}
            className="rounded-full px-5 py-4 flex-row items-center justify-center"
            style={{ backgroundColor: PURPLE_DARK, opacity: placingOrder ? 0.7 : 1 }}
          >
            {placingOrder ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ThemedText
                  type="defaultBold"
                  style={{ color: colors.textInverted }}
                  className="mr-1"
                >
                  Book Now
                </ThemedText>
                <ChevronRight size={16} color="#fff" />
              </>
            )}
          </Pressable>
        </Box>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
