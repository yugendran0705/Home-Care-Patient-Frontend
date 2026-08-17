import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { PURPLE, PURPLE_DARK, PURPLE_SOFT } from "@/constants/serviceTheme";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable } from "react-native";

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface CalendarPickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  minDate: Date;
  colors: { text: string; textSecondary: string };
}

export default function CalendarPicker({
  selectedDate,
  onSelectDate,
  minDate,
  colors,
}: CalendarPickerProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selectedDate));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(year, month, i + 1),
    ),
  ];

  // Bookings are only offered for the current month and the next one, so
  // there's no need to let the picker wander further into the future.
  const maxMonth = startOfMonth(new Date());
  maxMonth.setMonth(maxMonth.getMonth() + 1);

  const canGoPrev = startOfMonth(minDate) < startOfMonth(viewMonth);
  const canGoNext = startOfMonth(viewMonth) < maxMonth;

  return (
    <Box>
      <HStack
        className="items-center justify-between"
        style={{ marginBottom: 14 }}
      >
        <Pressable
          disabled={!canGoPrev}
          onPress={() => setViewMonth(new Date(year, month - 1, 1))}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: PURPLE_SOFT, opacity: canGoPrev ? 1 : 0.35 }}
        >
          <ChevronLeft size={16} color={PURPLE} />
        </Pressable>
        <ThemedText type="defaultBold" style={{ color: colors.text }}>
          {viewMonth.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </ThemedText>
        <Pressable
          disabled={!canGoNext}
          onPress={() => setViewMonth(new Date(year, month + 1, 1))}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: PURPLE_SOFT, opacity: canGoNext ? 1 : 0.35 }}
        >
          <ChevronRight size={16} color={PURPLE} />
        </Pressable>
      </HStack>

      <HStack className="justify-between" style={{ marginBottom: 4 }}>
        {WEEKDAYS.map((w, i) => (
          <Box key={i} style={{ width: `${100 / 7}%`, alignItems: "center" }}>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {w}
            </ThemedText>
          </Box>
        ))}
      </HStack>

      <Box style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((date, index) => {
          if (!date) {
            return (
              <Box
                key={`empty-${index}`}
                style={{ width: `${100 / 7}%`, height: 46 }}
              />
            );
          }
          const disabled = date < minDate;
          const selected = isSameDay(date, selectedDate);
          const today = isSameDay(date, new Date());

          return (
            <Box
              key={date.toISOString()}
              style={{
                width: `${100 / 7}%`,
                height: 46,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pressable
                disabled={disabled}
                onPress={() => onSelectDate(date)}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{
                  backgroundColor: selected ? PURPLE_DARK : "transparent",
                  borderWidth: today && !selected ? 1.5 : 0,
                  borderColor: PURPLE,
                }}
              >
                <ThemedText
                  type={selected ? "smallBold" : "small"}
                  style={{
                    color: selected ? "#fff" : colors.text,
                    opacity: disabled ? 0.3 : 1,
                  }}
                >
                  {date.getDate()}
                </ThemedText>
              </Pressable>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
