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
  iconForIndex,
} from "@/constants/serviceTheme";
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

export default function AllServicesScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { services, loading, error, fetchData, loadFromAsyncStorage } =
    useServices();

  useFocusEffect(
    useCallback(() => {
      loadFromAsyncStorage();
    }, [loadFromAsyncStorage]),
  );

  const serviceItems = useMemo(
    () =>
      services.map((service, index) => ({
        id: service.id,
        label: service.service_name,
        price: service.base_price,
        icon: iconForIndex(index),
      })),
    [services],
  );

  const filteredServices = useMemo(() => {
    if (!search.trim()) return serviceItems;
    return serviceItems.filter((s) =>
      s.label.toLowerCase().includes(search.trim().toLowerCase()),
    );
  }, [serviceItems, search]);

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
          ) : filteredServices.length === 0 ? (
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
              <HStack className="flex-wrap justify-start gap-2">
                {filteredServices.map((service) => {
                  const ServiceIcon = service.icon;
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      Icon={ServiceIcon}
                      colors={colors}
                      PURPLE={PURPLE}
                      PURPLE_SOFT={PURPLE_SOFT}
                      PURPLE_DEEP={PURPLE_DEEP}
                      onPress={() => router.push(`/services/${service.id}`)}
                    />
                  );
                })}
              </HStack>
            </Box>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
