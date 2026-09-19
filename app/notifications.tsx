import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import {
  PURPLE,
  PURPLE_DEEP,
  PURPLE_SOFT,
} from "@/constants/serviceTheme";
import {
  isUnread,
  useNotifications,
  type AppNotification,
} from "@/hooks/useNotifications";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CalendarCheck,
  CalendarX2,
  ChevronRight,
  CreditCard,
  KeyRound,
  Megaphone,
  Star,
  type LucideIcon,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// `type` is free-form on the backend, so match on keywords rather than an
// exact list; anything unrecognised falls back to a plain bell.
function iconFor(n: AppNotification): { Icon: LucideIcon; bg: string; fg: string } {
  // Types the backend emits today (services/notifications.py): booking_confirmed,
  // payment_failed, booking_cancelled, visit_completed, review_received.
  const t = n.type.toLowerCase();
  if (t.includes("cancel") || t.includes("reject"))
    return { Icon: CalendarX2, bg: "#FDECEC", fg: "#D93C31" };
  if (t.includes("payment") && t.includes("fail"))
    return { Icon: CreditCard, bg: "#FDECEC", fg: "#D93C31" };
  if (t.includes("payment") || t.includes("refund"))
    return { Icon: CreditCard, bg: "#E7F9EE", fg: "#1B9E52" };
  if (t.includes("otp") || t.includes("code"))
    return { Icon: KeyRound, bg: PURPLE_SOFT, fg: PURPLE_DEEP };
  // visit_completed asks the patient to rate the nurse, so it gets the star.
  if (t.includes("review") || t.includes("rating") || t === "visit_completed")
    return { Icon: Star, bg: "#FFF4E0", fg: "#B76E00" };
  if (t.includes("booking") || t.includes("shift") || t.includes("visit"))
    return { Icon: CalendarCheck, bg: PURPLE_SOFT, fg: PURPLE_DEEP };
  if (n.audience_type !== "user")
    return { Icon: Megaphone, bg: "#FFF4E0", fg: "#B76E00" };
  return { Icon: Bell, bg: PURPLE_SOFT, fg: PURPLE_DEEP };
}

// A notification about a booking links to it. A shift's notification may
// carry both ids; the detail screen is keyed on the parent booking.
const bookingTarget = (n: AppNotification): string | null =>
  n.data?.parent_booking_id ?? n.data?.booking_id ?? null;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function sectionTitle(iso: string): string {
  const day = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  if (day === today) return "Today";
  if (day === today - 86_400_000) return "Yesterday";
  return "Earlier";
}

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [refreshing, setRefreshing] = useState(false);
  const {
    notifications,
    loading,
    loadingMore,
    error,
    fetchFirstPage,
    fetchMore,
    markRead,
  } = useNotifications();

  // First focus loads the feed; coming back (e.g. from a booking opened
  // here) refreshes the newest page in place and keeps older pages + scroll.
  const hasLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      fetchFirstPage({ mode: hasLoadedRef.current ? "merge" : "replace" });
      hasLoadedRef.current = true;
    }, [fetchFirstPage]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFirstPage();
    setRefreshing(false);
  }, [fetchFirstPage]);

  // The feed arrives newest-first, so grouping in order keeps sections sorted.
  const sections = useMemo(() => {
    const groups: { title: string; data: AppNotification[] }[] = [];
    for (const n of notifications) {
      const title = sectionTitle(n.created_at);
      const last = groups[groups.length - 1];
      if (last?.title === title) last.data.push(n);
      else groups.push({ title, data: [n] });
    }
    return groups;
  }, [notifications]);

  const unreadCount = notifications.filter(isUnread).length;

  const onPressItem = (n: AppNotification) => {
    markRead(n);
    const target = bookingTarget(n);
    if (target) router.push(`/bookings/${target}`);
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const unread = isUnread(item);
    const { Icon: TypeIcon, bg, fg } = iconFor(item);
    const linked = bookingTarget(item) !== null;
    return (
      <Pressable
        onPress={() => onPressItem(item)}
        className="rounded-2xl p-4 mb-3"
        style={{
          backgroundColor: unread ? PURPLE_SOFT : colors.secondaryBackground,
          borderWidth: 1,
          borderColor: unread ? "#DCD5FF" : "transparent",
        }}
      >
        <HStack space="md" className="items-start">
          <Box
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: unread ? "#FFFFFF" : bg }}
          >
            <TypeIcon size={18} color={fg} />
          </Box>
          <VStack className="flex-1" space="xs">
            <HStack className="items-start justify-between">
              <ThemedText
                type="smallBold"
                numberOfLines={2}
                style={{ color: colors.text, flex: 1, marginRight: 8 }}
              >
                {item.title}
              </ThemedText>
              <HStack space="xs" className="items-center">
                <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                  {relativeTime(item.created_at)}
                </ThemedText>
                {unread ? (
                  <Box
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PURPLE }}
                  />
                ) : null}
              </HStack>
            </HStack>
            <ThemedText
              type="small"
              numberOfLines={3}
              style={{ color: colors.textSecondary, lineHeight: 20 }}
            >
              {item.body}
            </ThemedText>
            {linked ? (
              <HStack space="xs" className="items-center" style={{ marginTop: 2 }}>
                <ThemedText type="captionBold" style={{ color: PURPLE_DEEP }}>
                  View booking
                </ThemedText>
                <ChevronRight size={12} color={PURPLE_DEEP} />
              </HStack>
            ) : null}
          </VStack>
        </HStack>
      </Pressable>
    );
  };

  const Header = (
    <Box className="flex-row gap-4 items-center px-3 mt-5 mb-2">
      <Pressable onPress={() => router.back()} className="ml-2">
        <Icon as={ArrowLeft} size="xl" color={colors.text} />
      </Pressable>
      <ThemedText type="heading" style={{ color: colors.text, flex: 1 }}>
        Notifications
      </ThemedText>
      {unreadCount > 0 ? (
        <Box
          className="rounded-full px-2.5 py-1 mr-3"
          style={{ backgroundColor: PURPLE_SOFT }}
        >
          <ThemedText type="captionBold" style={{ color: PURPLE_DEEP }}>
            {unreadCount} new
          </ThemedText>
        </Box>
      ) : null}
    </Box>
  );

  const centered = (children: ReactNode) => (
    <Box className="flex-1 justify-center items-center px-6">{children}</Box>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        {Header}

        {loading ? (
          centered(<ActivityIndicator size="large" color={PURPLE} />)
        ) : error && notifications.length === 0 ? (
          centered(
            <>
              <ThemedText
                type="default"
                className="text-center mb-3"
                style={{ color: colors.text }}
              >
                {error}
              </ThemedText>
              <Pressable onPress={() => fetchFirstPage()}>
                <ThemedText type="defaultBold" style={{ color: PURPLE }}>
                  Retry
                </ThemedText>
              </Pressable>
            </>,
          )
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(n) => n.id}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => (
              <ThemedText
                type="captionBold"
                style={{
                  color: colors.textSecondary,
                  backgroundColor: colors.background,
                  paddingTop: 8,
                  paddingBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                {section.title}
              </ThemedText>
            )}
            stickySectionHeadersEnabled
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            onEndReached={fetchMore}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[PURPLE]}
                tintColor={PURPLE}
              />
            }
            ListFooterComponent={
              loadingMore ? (
                <Box className="py-4 items-center">
                  <ActivityIndicator color={PURPLE} />
                </Box>
              ) : null
            }
            ListEmptyComponent={centered(
              <>
                <Box
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: PURPLE_SOFT }}
                >
                  <BellOff size={28} color={PURPLE_DEEP} />
                </Box>
                <ThemedText type="defaultBold" style={{ color: colors.text }}>
                  You&apos;re all caught up
                </ThemedText>
                <ThemedText
                  type="small"
                  className="text-center mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  Booking updates and announcements will show up here.
                </ThemedText>
              </>,
            )}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
