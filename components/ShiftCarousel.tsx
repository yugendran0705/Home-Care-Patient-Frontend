import CompletionCodeCard from "@/components/CompletionCodeCard";
import ReviewSection from "@/components/ReviewSection";
import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { PURPLE, PURPLE_SOFT, statusPalette } from "@/constants/serviceTheme";
import type { Booking } from "@/hooks/useBookings";
import { Clock } from "lucide-react-native";
import { useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

// Matches the detail screen's ScrollView padding so the carousel can bleed to
// the screen edges while its first card still lines up with the content above.
const SIDE_PADDING = 24;
const CARD_GAP = 12;
// How much of the next card peeks in, hinting that the row scrolls.
const PEEK = 20;
// Beyond this many shifts, dots get too small to tap; show a counter instead.
const MAX_DOTS = 10;

interface ShiftCarouselProps {
  shifts: Booking[];
  colors: {
    background: string;
    secondaryBackground: string;
    text: string;
    textSecondary: string;
    textInverted: string;
    error: string;
  };
  awaitingCompletion: (b: Booking) => boolean;
  onChanged: () => Promise<void>;
}

const formatShiftDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

export default function ShiftCarousel({
  shifts,
  colors,
  awaitingCompletion,
  onChanged,
}: ShiftCarouselProps) {
  const listRef = useRef<FlatList<Booking>>(null);
  // Horizontal offset, driving the dot + card animations frame by frame so
  // they move with the finger instead of jumping when a swipe settles.
  const scrollX = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  // Open on the shift the patient most likely cares about: the first one
  // still awaiting its handover code, else the first completed one still
  // missing a review, else the first shift.
  const initialIndex = useMemo(() => {
    const pending = shifts.findIndex(awaitingCompletion);
    if (pending !== -1) return pending;
    const unreviewed = shifts.findIndex(
      (s) => s.booking_status === "Completed" && !s.review,
    );
    return unreviewed !== -1 ? unreviewed : 0;
    // Only on first render: later refetches shouldn't yank the carousel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  // A lone shift has nothing to peek at, so it spans the full content width
  // and lines up with the cards above it.
  const peek = shifts.length > 1 ? PEEK : 0;
  const cardWidth = width - SIDE_PADDING * 2 - peek;
  // Width is 0 until the first layout; keep the step positive so the dot
  // interpolations (rendered before measurement) stay valid.
  const interval = Math.max(cardWidth + CARD_GAP, 1);
  const completedCount = shifts.filter(
    (s) => s.booking_status === "Completed",
  ).length;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    // Seed the animated offset at the initial card on first layout only;
    // initialScrollIndex doesn't emit a scroll event, so the dots would
    // otherwise start on 0. Later re-layouts must not yank it back.
    if (width === 0) {
      scrollX.setValue(initialIndex * (w - SIDE_PADDING * 2 - peek + CARD_GAP));
    }
    setWidth(w);
  };

  // Width/colour animations can't run on the native driver, so this is a
  // JS-driven event; the listener keeps the numeric index (used by the
  // "3 / 14" counter) in sync with the card on screen.
  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / interval);
        const clamped = Math.max(0, Math.min(index, shifts.length - 1));
        setActiveIndex((prev) => (prev === clamped ? prev : clamped));
      },
    },
  );

  // 0 when card `i` is centred, 1 when it's a full card away (either side).
  const distanceFrom = (i: number) =>
    scrollX.interpolate({
      inputRange: [(i - 1) * interval, i * interval, (i + 1) * interval],
      outputRange: [1, 0, 1],
      extrapolate: "clamp",
    });

  const scrollTo = (index: number) => {
    listRef.current?.scrollToOffset({
      offset: index * interval,
      animated: true,
    });
    setActiveIndex(index);
  };

  const renderShift = ({
    item: shift,
    index,
  }: {
    item: Booking;
    index: number;
  }) => {
    const palette = statusPalette(shift.booking_status);
    const distance = distanceFrom(index);
    return (
      <Animated.View
        style={{
          width: cardWidth,
          marginRight: index === shifts.length - 1 ? 0 : CARD_GAP,
          opacity: distance.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.6],
          }),
          transform: [
            {
              scale: distance.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.95],
              }),
            },
          ],
        }}
      >
        <VStack
          space="md"
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.secondaryBackground }}
        >
          <HStack className="items-start justify-between">
            <VStack space="xs" className="flex-1" style={{ marginRight: 8 }}>
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary }}
              >
                Shift {index + 1} of {shifts.length}
              </ThemedText>
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                {formatShiftDate(shift.scheduled_start_time)}
              </ThemedText>
              <HStack space="xs" className="items-center">
                <Clock size={12} color={colors.textSecondary} />
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary }}
                >
                  {formatTime(shift.scheduled_start_time)} –{" "}
                  {formatTime(shift.scheduled_end_time)}
                </ThemedText>
              </HStack>
            </VStack>
            <Box
              className="rounded-full px-2.5 py-1"
              style={{ backgroundColor: palette.bg }}
            >
              <ThemedText type="captionBold" style={{ color: palette.fg }}>
                {shift.booking_status}
              </ThemedText>
            </Box>
          </HStack>

          {awaitingCompletion(shift) ? (
            <CompletionCodeCard
              bookingId={shift.id}
              colors={colors}
              revealOnMount={false}
              onStale={onChanged}
            />
          ) : null}

          {shift.booking_status === "Completed" ? (
            <ReviewSection
              bookingId={shift.id}
              review={shift.review}
              colors={{ ...colors, secondaryBackground: colors.background }}
              onChanged={onChanged}
              startCollapsed
            />
          ) : null}
        </VStack>
      </Animated.View>
    );
  };

  return (
    <VStack space="sm">
      <HStack className="items-center justify-between">
        <ThemedText type="defaultBold" style={{ color: colors.text }}>
          Shifts
        </ThemedText>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {completedCount}/{shifts.length} completed
        </ThemedText>
      </HStack>

      <Box onLayout={onLayout} style={{ marginHorizontal: -SIDE_PADDING }}>
        {width > 0 ? (
          <FlatList
            ref={listRef}
            data={shifts}
            keyExtractor={(s) => s.id}
            renderItem={renderShift}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={interval}
            decelerationRate="fast"
            disableIntervalMomentum
            contentContainerStyle={{
              paddingLeft: SIDE_PADDING,
              // Enough trailing space for the last card to snap into place.
              paddingRight: width - SIDE_PADDING - cardWidth,
              alignItems: "flex-start",
            }}
            getItemLayout={(_, index) => ({
              length: interval,
              offset: interval * index,
              index,
            })}
            initialScrollIndex={initialIndex}
            onScroll={onScroll}
            scrollEventThrottle={16}
          />
        ) : null}
      </Box>

      {shifts.length > 1 ? (
        shifts.length <= MAX_DOTS ? (
          <HStack space="xs" className="justify-center items-center">
            {shifts.map((s, i) => {
              const distance = distanceFrom(i);
              return (
                <Pressable key={s.id} onPress={() => scrollTo(i)} hitSlop={6}>
                  <Animated.View
                    style={{
                      height: 6,
                      borderRadius: 3,
                      width: distance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 6],
                      }),
                      backgroundColor: distance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [PURPLE, PURPLE_SOFT],
                      }),
                    }}
                  />
                </Pressable>
              );
            })}
          </HStack>
        ) : (
          <ThemedText
            type="caption"
            className="text-center"
            style={{ color: colors.textSecondary }}
          >
            {activeIndex + 1} / {shifts.length}
          </ThemedText>
        )
      ) : null}
    </VStack>
  );
}
