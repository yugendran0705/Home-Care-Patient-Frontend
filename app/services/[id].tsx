import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import {
  formatPrice,
  PURPLE,
  PURPLE_DARK,
  PURPLE_DEEP,
  PURPLE_SOFT,
  iconForIndex,
} from "@/constants/serviceTheme";
import { useServices } from "@/hooks/useServices";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, ShieldCheck } from "lucide-react-native";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function ServiceDetailScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const { services, loading, error, fetchData, loadFromAsyncStorage } =
    useServices();

  useFocusEffect(
    useCallback(() => {
      loadFromAsyncStorage();
    }, [loadFromAsyncStorage]),
  );

  const index = services.findIndex((s) => s.id === id);
  const service = index >= 0 ? services[index] : undefined;

  const Header = (
    <Box className="flex-row gap-4 items-center px-3 mt-5">
      <Pressable onPress={() => router.back()} className="ml-2">
        <Icon as={ArrowLeft} size="xl" color={colors.text} />
      </Pressable>
      <ThemedText type="heading" style={{ color: colors.text }}>
        Service Details
      </ThemedText>
    </Box>
  );

  if (loading) {
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

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
        >
          {Header}
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
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!service) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          className="flex-1"
          style={{ backgroundColor: colors.background }}
        >
          {Header}
          <Box className="flex-1 justify-center items-center px-6">
            <ThemedText
              type="default"
              className="text-center"
              style={{ color: colors.text, fontSize: 18 }}
            >
              Service not found.
            </ThemedText>
          </Box>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const ServiceIcon = iconForIndex(index);

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
            {/* Hero */}
            <VStack space="sm" className="items-start">
              <Box
                className="w-20 h-20 rounded-2xl items-center justify-center"
                style={{ backgroundColor: PURPLE_SOFT }}
              >
                <ServiceIcon size={32} color={PURPLE} />
              </Box>
              <ThemedText type="heading" style={{ color: colors.text }}>
                {service.service_name}
              </ThemedText>
              <HStack space="xs" className="items-center">
                <ThemedText type="small" style={{ color: colors.textSecondary }}>
                  From
                </ThemedText>
                <ThemedText
                  type="defaultBold"
                  style={{ color: PURPLE_DEEP, fontSize: 18 }}
                >
                  ₹{formatPrice(service.base_price)}
                </ThemedText>
              </HStack>

              {service.is_qualified && (
                <HStack
                  space="xs"
                  className="items-center rounded-full px-3 py-1.5 mt-1"
                  style={{ backgroundColor: PURPLE_SOFT }}
                >
                  <ShieldCheck size={14} color={PURPLE} />
                  <ThemedText type="captionBold" style={{ color: PURPLE_DEEP }}>
                    Qualified Professional
                  </ThemedText>
                </HStack>
              )}
            </VStack>

            {/* Info grid */}
            <HStack
              className="justify-around rounded-2xl p-4"
              style={{ backgroundColor: colors.secondaryBackground }}
            >
              <VStack space="xs" className="items-center flex-1">
                <ThemedText type="smallBold" style={{ color: colors.text }}>
                  {service.duration} {service.duration_type}
                </ThemedText>
                <ThemedText
                  type="caption"
                  className="text-center"
                  style={{ color: colors.textSecondary }}
                >
                  Duration
                </ThemedText>
              </VStack>
              {service.shift_duration_hours ? (
                <VStack space="xs" className="items-center flex-1">
                  <ThemedText type="smallBold" style={{ color: colors.text }}>
                    {service.shift_duration_hours} hrs
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    className="text-center"
                    style={{ color: colors.textSecondary }}
                  >
                    Shift Duration
                  </ThemedText>
                </VStack>
              ) : null}
            </HStack>

            {/* Description */}
            <VStack space="xs">
              <ThemedText type="defaultBold" style={{ color: colors.text }}>
                About this service
              </ThemedText>
              <ThemedText type="small" style={{ color: colors.textSecondary }}>
                {service.description}
              </ThemedText>
            </VStack>
          </VStack>
        </ScrollView>

        <Box className="px-6 pb-4 pt-2">
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/booking/schedule",
                params: { serviceId: service.id },
              })
            }
            className="rounded-full px-5 py-4 flex-row items-center justify-center"
            style={{ backgroundColor: PURPLE_DARK }}
          >
            <ThemedText
              type="defaultBold"
              style={{ color: colors.textInverted }}
              className="mr-1"
            >
              Book Now
            </ThemedText>
            <ChevronRight size={16} color="#fff" />
          </Pressable>
        </Box>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
