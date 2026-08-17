import axiosInstance from "@/axiosInstance";
import CalendarPicker, { isSameDay } from "@/components/CalendarPicker";
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
import { useAlert } from "@/hooks/useAlert";
import { useServices } from "@/hooks/useServices";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, Info } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 21;

const hourOptions = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i,
);

const TIME_PERIODS = [
  { label: "Morning", hours: hourOptions.filter((h) => h < 12) },
  { label: "Afternoon", hours: hourOptions.filter((h) => h >= 12 && h < 17) },
  { label: "Evening", hours: hourOptions.filter((h) => h >= 17) },
];

const formatHour = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
};

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function ScheduleBookingScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const showAlert = useAlert();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { services, loading, loadFromAsyncStorage } = useServices();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFromAsyncStorage();
    }, [loadFromAsyncStorage]),
  );

  const service = services.find((s) => s.id === serviceId);
  const isContinuous = service?.schedule_type === "Continuous";
  const isMultiDayShift =
    service?.schedule_type === "Daily_Shift" &&
    service?.duration_type === "days" &&
    service.duration > 1;

  const availableHours = useMemo(() => {
    const now = new Date();
    if (!isSameDay(selectedDate, now)) return hourOptions;
    return hourOptions.filter((hour) => hour > now.getHours());
  }, [selectedDate]);

  const activeHour =
    selectedHour != null && availableHours.includes(selectedHour)
      ? selectedHour
      : availableHours[0];

  const handleFindNurses = async () => {
    if (!service) return;
    if (!isContinuous && activeHour == null) return;

    const requestedStart = new Date(selectedDate);
    if (!isContinuous && activeHour != null) {
      requestedStart.setHours(activeHour, 0, 0, 0);
    }

    setSearching(true);
    try {
      const response = await axiosInstance.post("/bookings/search", {
        service_id: service.id,
        requested_start_time: requestedStart.toISOString(),
      });
      router.push({
        pathname: "/booking/nurses",
        params: {
          serviceId: service.id,
          requestedStartTime: requestedStart.toISOString(),
          nurses: JSON.stringify(response.data),
        },
      });
    } catch (error: any) {
      showAlert(
        "Search Failed",
        error?.response?.data?.detail ??
          "Failed to find available nurses. Please try again.",
      );
    } finally {
      setSearching(false);
    }
  };

  const Header = (
    <Box className="flex-row gap-4 items-center px-3 mt-5">
      <Pressable onPress={() => router.back()} className="ml-2">
        <Icon as={ArrowLeft} size="xl" color={colors.text} />
      </Pressable>
      <ThemedText type="heading" style={{ color: colors.text }}>
        {isContinuous ? "Choose a Date" : "Choose Date & Time"}
      </ThemedText>
    </Box>
  );

  if (loading || !service) {
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

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        {Header}

        <ScrollView
          contentContainerStyle={{ padding: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <VStack space="lg">
            <VStack
              space="xs"
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.secondaryBackground }}
            >
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                {service.service_name}
              </ThemedText>
              <ThemedText type="small" style={{ color: PURPLE_DEEP }}>
                From ₹{formatPrice(service.base_price)}
              </ThemedText>
            </VStack>

            {isMultiDayShift ? (
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
                  This is a {service.duration}-day service. It will repeat
                  daily for {service.duration} days at the same time you
                  select below.
                </ThemedText>
              </HStack>
            ) : null}

            {/* Calendar */}
            <VStack space="sm">
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                Select a date
              </ThemedText>
              <Box
                className="rounded-2xl p-4"
                style={{ backgroundColor: colors.secondaryBackground }}
              >
                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelectDate={(date) => {
                    setSelectedDate(date);
                    setSelectedHour(null);
                  }}
                  minDate={today()}
                  colors={colors}
                />
              </Box>
            </VStack>

            {/* Time, grouped by part of day (not applicable to 24/7 continuous care) */}
            {isContinuous ? null : (
            <VStack space="md">
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                Select a time
              </ThemedText>
              {availableHours.length === 0 ? (
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  No more slots available today. Please choose another date.
                </ThemedText>
              ) : (
                TIME_PERIODS.map((period) => {
                  const hours = period.hours.filter((h) =>
                    availableHours.includes(h),
                  );
                  if (hours.length === 0) return null;
                  return (
                    <VStack key={period.label} space="xs">
                      <ThemedText
                        type="smallBold"
                        style={{ color: colors.textSecondary }}
                      >
                        {period.label}
                      </ThemedText>
                      <HStack className="flex-wrap" space="sm" style={{ rowGap: 10 }}>
                        {hours.map((hour) => {
                          const active = hour === activeHour;
                          return (
                            <Pressable
                              key={hour}
                              onPress={() => setSelectedHour(hour)}
                              className="rounded-full px-4 py-2.5"
                              style={{
                                backgroundColor: active ? PURPLE_DARK : PURPLE_SOFT,
                              }}
                            >
                              <ThemedText
                                type="smallBold"
                                style={{
                                  color: active ? colors.textInverted : PURPLE_DEEP,
                                }}
                              >
                                {formatHour(hour)}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </HStack>
                    </VStack>
                  );
                })
              )}
            </VStack>
            )}
          </VStack>
        </ScrollView>

        <Box className="px-6 pb-4 pt-2">
          <Pressable
            onPress={handleFindNurses}
            disabled={searching || (!isContinuous && activeHour == null)}
            className="rounded-full px-5 py-4 flex-row items-center justify-center"
            style={{
              backgroundColor: PURPLE_DARK,
              opacity: searching || (!isContinuous && activeHour == null) ? 0.6 : 1,
            }}
          >
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ThemedText
                  type="defaultBold"
                  style={{ color: colors.textInverted }}
                  className="mr-1"
                >
                  Find Nurses
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
