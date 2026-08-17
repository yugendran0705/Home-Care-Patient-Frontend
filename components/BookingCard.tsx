import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import {
  PURPLE_DEEP,
  PURPLE_SOFT,
  formatPrice,
  statusPalette,
} from "@/constants/serviceTheme";
import type { Booking } from "@/hooks/useBookings";
import { CalendarDays, CreditCard, User } from "lucide-react-native";
import { Pressable } from "react-native";

interface BookingCardProps {
  booking: Booking;
  colors: { background: string; text: string; textSecondary: string };
  onPress: () => void;
}

const formatScheduled = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
};

export default function BookingCard({
  booking,
  colors,
  onPress,
}: BookingCardProps) {
  const bookingPalette = statusPalette(booking.booking_status);
  const paymentPalette = statusPalette(booking.payment_status);

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-4"
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: PURPLE_SOFT,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <HStack className="items-start justify-between">
        <VStack className="flex-1" space="xs" style={{ marginRight: 8 }}>
          <ThemedText
            type="defaultBold"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {booking.service.service_name}
          </ThemedText>
          <HStack space="xs" className="items-center">
            <CalendarDays size={13} color={colors.textSecondary} />
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {formatScheduled(booking.scheduled_start_time)}
            </ThemedText>
          </HStack>
          <HStack space="xs" className="items-center">
            <User size={13} color={colors.textSecondary} />
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {booking.nurse.first_name} {booking.nurse.last_name}
            </ThemedText>
          </HStack>
        </VStack>

        <Box
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: bookingPalette.bg }}
        >
          <ThemedText type="captionBold" style={{ color: bookingPalette.fg }}>
            {booking.booking_status}
          </ThemedText>
        </Box>
      </HStack>

      <HStack
        className="items-center justify-between"
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: PURPLE_SOFT,
        }}
      >
        <VStack>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            Total
          </ThemedText>
          <ThemedText type="defaultBold" style={{ color: PURPLE_DEEP }}>
            ₹{formatPrice(booking.total_amount)}
          </ThemedText>
        </VStack>

        <Box
          className="rounded-full px-3.5 py-2 flex-row items-center"
          style={{ backgroundColor: paymentPalette.bg }}
        >
          <CreditCard size={14} color={paymentPalette.fg} />
          <ThemedText
            type="captionBold"
            style={{ color: paymentPalette.fg, marginLeft: 6 }}
          >
            {booking.payment_status === "Paid"
              ? "Payment Complete"
              : `Payment ${booking.payment_status}`}
          </ThemedText>
        </Box>
      </HStack>
    </Pressable>
  );
}
