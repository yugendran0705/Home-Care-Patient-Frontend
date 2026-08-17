import ServiceCard from "@/components/ServiceCard";
import ServiceSearchBar from "@/components/ServiceSearchBar";
import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Colors } from "@/constants/Colors";
import {
  PURPLE,
  PURPLE_DEEP,
  PURPLE_SOFT,
  formatDuration,
  formatPrice,
  iconForIndex,
  splitServiceVariantName,
} from "@/constants/serviceTheme";
import { useAlert } from "@/hooks/useAlert";
import { useServices } from "@/hooks/useServices";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

interface ServiceVariant {
  id: string;
  price: number | string;
  variantLabel: string | null;
  duration: number;
  duration_type: string;
}

interface ServiceGroup {
  key: string;
  baseName: string;
  scheduleType: string;
  Icon: ReturnType<typeof iconForIndex>;
  variants: ServiceVariant[];
  sortValue: number;
}

function variantDescriptor(variant: ServiceVariant): string {
  return variant.variantLabel ?? formatDuration(variant.duration, variant.duration_type);
}

export default function AllServicesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const showAlert = useAlert();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { services, loading, error, fetchData, loadFromAsyncStorage } =
    useServices();

  useFocusEffect(
    useCallback(() => {
      loadFromAsyncStorage();
    }, [loadFromAsyncStorage]),
  );

  // Some services are duration/plan variants of the same underlying
  // service (e.g. "Wound Dressing" vs "Wound Dressing(1 Week)"), so they're
  // grouped under one card here, and further split into "shift" vs
  // "continuous" schedule sections.
  const { shiftGroups, continuousGroups } = useMemo(() => {
    const groupMap = new Map<string, ServiceGroup>();

    services.forEach((service, index) => {
      const { baseName, variantLabel } = splitServiceVariantName(
        service.service_name,
      );
      const key = `${baseName}__${service.schedule_type}`;
      const variant: ServiceVariant = {
        id: service.id,
        price: service.base_price,
        variantLabel,
        duration: service.duration,
        duration_type: service.duration_type,
      };
      const sortValue =
        service.schedule_type === "Continuous"
          ? service.duration
          : (service.shift_duration_hours ?? service.duration);

      const existing = groupMap.get(key);
      if (existing) {
        existing.variants.push(variant);
        existing.sortValue = Math.min(existing.sortValue, sortValue);
      } else {
        groupMap.set(key, {
          key,
          baseName,
          scheduleType: service.schedule_type,
          Icon: iconForIndex(index),
          variants: [variant],
          sortValue,
        });
      }
    });

    const groups = Array.from(groupMap.values());
    return {
      shiftGroups: groups
        .filter((g) => g.scheduleType !== "Continuous")
        .sort((a, b) => a.sortValue - b.sortValue),
      continuousGroups: groups
        .filter((g) => g.scheduleType === "Continuous")
        .sort((a, b) => a.sortValue - b.sortValue),
    };
  }, [services]);

  const matchesSearch = useCallback(
    (group: ServiceGroup) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return (
        group.baseName.toLowerCase().includes(query) ||
        group.variants.some((v) =>
          v.variantLabel?.toLowerCase().includes(query),
        )
      );
    },
    [search],
  );

  const filteredShiftGroups = useMemo(
    () => shiftGroups.filter(matchesSearch),
    [shiftGroups, matchesSearch],
  );
  const filteredContinuousGroups = useMemo(
    () => continuousGroups.filter(matchesSearch),
    [continuousGroups, matchesSearch],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleGroupPress = useCallback(
    (group: ServiceGroup) => {
      if (group.variants.length === 1) {
        router.push(`/services/${group.variants[0].id}`);
        return;
      }

      showAlert(group.baseName, "Choose a plan:", [
        ...group.variants.map((variant) => ({
          text: `${variantDescriptor(variant)} · ₹${formatPrice(variant.price)}`,
          onPress: () => router.push(`/services/${variant.id}`),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]);
    },
    [showAlert],
  );

  const renderGroupCard = (group: ServiceGroup) => {
    const cheapestPrice = group.variants.reduce((min, variant) => {
      const price =
        typeof variant.price === "string"
          ? parseFloat(variant.price)
          : variant.price;
      return price < min ? price : min;
    }, Infinity);

    const subtitle =
      group.variants.length > 1
        ? `${group.variants.length} plans available`
        : variantDescriptor(group.variants[0]);

    return (
      <ServiceCard
        key={group.key}
        service={{
          id: group.key,
          label: group.baseName,
          price: cheapestPrice,
          subtitle,
        }}
        Icon={group.Icon}
        colors={colors}
        PURPLE={PURPLE}
        PURPLE_SOFT={PURPLE_SOFT}
        PURPLE_DEEP={PURPLE_DEEP}
        onPress={() => handleGroupPress(group)}
      />
    );
  };

  const hasResults =
    filteredShiftGroups.length > 0 || filteredContinuousGroups.length > 0;

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#000"]} // for Android
              tintColor={"#fff"} // for iOS
            />
          }
        >
          <Box className="flex-row gap-4 items-center px-3 mt-5">
            <Pressable onPress={() => router.back()} className="ml-2">
              <Icon as={ArrowLeft} size="xl" color={colors.text} />
            </Pressable>
            <ThemedText type="heading" style={{ color: colors.text }}>
              All Services
            </ThemedText>
          </Box>

          <Box className="px-6 mt-5">
            <ServiceSearchBar
              value={search}
              onChangeText={setSearch}
              colors={colors}
            />
          </Box>

          {loading ? (
            <Box className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={PURPLE} />
            </Box>
          ) : error ? (
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
          ) : !hasResults ? (
            <Box className="flex-1 justify-center items-center px-6">
              <ThemedText
                type="default"
                className="text-center"
                style={{ color: colors.textSecondary }}
              >
                No services found for &quot;{search}&quot;
              </ThemedText>
            </Box>
          ) : (
            <Box style={{ padding: 24 }}>
              {filteredShiftGroups.length > 0 && (
                <Box style={{ marginBottom: 28 }}>
                  <ThemedText
                    type="subtitle"
                    style={{ color: colors.text, fontSize: 18, marginBottom: 4 }}
                  >
                    Visit & Shift Care
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textSecondary,
                      marginBottom: 12,
                    }}
                  >
                    Scheduled visits and fixed-duration shifts
                  </ThemedText>
                  <HStack className="flex-wrap justify-start gap-2">
                    {filteredShiftGroups.map(renderGroupCard)}
                  </HStack>
                </Box>
              )}

              {filteredContinuousGroups.length > 0 && (
                <Box>
                  <ThemedText
                    type="subtitle"
                    style={{ color: colors.text, fontSize: 18, marginBottom: 4 }}
                  >
                    24/7 Continuous Care
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textSecondary,
                      marginBottom: 12,
                    }}
                  >
                    Round-the-clock, uninterrupted nursing care
                  </ThemedText>
                  <HStack className="flex-wrap justify-start gap-2">
                    {filteredContinuousGroups.map(renderGroupCard)}
                  </HStack>
                </Box>
              )}
            </Box>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
