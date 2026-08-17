import axiosInstance from "@/axiosInstance";
import AddressSelectorSheet, {
  Address,
} from "@/components/AddressSelectorSheet";
import ServiceCard from "@/components/ServiceCard";
import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import {
  PURPLE,
  PURPLE_DARK,
  PURPLE_DEEP,
  PURPLE_SOFT,
  formatPrice,
  iconForIndex,
} from "@/constants/serviceTheme";
import { useAlert } from "@/hooks/useAlert";
import { useServices } from "@/hooks/useServices";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Clock3,
  Headphones,
  MapPin,
  MapPinned,
  ShieldCheck,
  Siren,
  Star,
  X,
  Zap,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

interface User {
  id: string;
  email: string;
  user_type: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  id: string;
  user: User;
}

// TODO: replace with the real nurses endpoint once it's available
// (e.g. GET /nurses/top_rated) — kept as a typed placeholder so the
// "Top Rated Nurses" section renders real-shaped data in the meantime.
interface Nurse {
  id: string;
  name: string;
  qualification: string;
  experience_years: number;
  rating: number;
  review_count: number;
  hourly_rate: number;
  avatar: any;
}

const FALLBACK_NURSES: Nurse[] = [
  {
    id: "1",
    name: "Priya Sharma",
    qualification: "B.Sc Nursing",
    experience_years: 5,
    rating: 4.8,
    review_count: 128,
    hourly_rate: 500,
    avatar: require("../../assets/images/nurse.png"),
  },
];

const TRUST_POINTS = [
  { id: "verified", label: "Verified\nProfessionals", icon: ShieldCheck },
  { id: "ontime", label: "On-time\nService", icon: Clock3 },
  { id: "tracking", label: "Live Tracking\nAvailable", icon: MapPinned },
  { id: "support", label: "24/7\nSupport", icon: Headphones },
];

const HERO_OVERLAY_GRADIENT = [
  "rgba(236,231,254,0.94)",
  "rgba(236,231,254,0.75)",
  "rgba(236,231,254,0)",
] as const;
const EMERGENCY_BG = "#FDECEC";
const EMERGENCY_RED = "#E8483C";
const EMERGENCY_RED_DARK = "#D93C31";

const primaryOf = (list: Address[]) =>
  list.find((a) => a.is_primary) ?? list[0] ?? null;

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const showAlert = useAlert();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const isFirstMount = useRef(true);
  const {
    services,
    error,
    fetchData: fetchServices,
    loadFromAsyncStorage: loadServicesFromAsyncStorage,
  } = useServices();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(true);

  // Address selection
  const [addressSheetVisible, setAddressSheetVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const fetchData = useCallback(async () => {
    await fetchServices();

    const profileData = await AsyncStorage.getItem("profile");
    if (profileData) {
      setProfile(JSON.parse(profileData));
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fetchServices, fadeAnim]);

  const loadFromAsyncStorage = useCallback(async () => {
    await loadServicesFromAsyncStorage();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [loadServicesFromAsyncStorage, fadeAnim]);

  const loadAddresses = useCallback(async () => {
    try {
      let list: Address[] = [];
      const storedAddresses = await AsyncStorage.getItem("addresses");
      if (storedAddresses) {
        const parsed: Address[] = JSON.parse(storedAddresses);
        if (parsed.length) list = parsed;
      }
      setSavedAddresses(list);
      setSelectedAddress(primaryOf(list));
    } catch (e) {
      console.error("Failed to load addresses:", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        if (isFirstMount.current) {
          // First mount: fetch from API
          await fetchData();
          isFirstMount.current = false;
        } else {
          // Subsequent mounts: load from AsyncStorage
          await loadFromAsyncStorage();
        }
        await loadAddresses();
        setLoading(false);
      };
      loadData();
    }, [fetchData, loadFromAsyncStorage, loadAddresses]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const applyPrimary = useCallback(
    async (address: Address) => {
      setLoading(true);
      try {
        await axiosInstance.patch(`/addresses/set_primary/${address.id}`);

        const updated = savedAddresses.map((a) => ({
          ...a,
          is_primary: a.id === address.id,
        }));
        setSavedAddresses(updated);
        setSelectedAddress({ ...address, is_primary: true });
        await AsyncStorage.setItem("addresses", JSON.stringify(updated));

        showAlert("Success", "Primary address updated.");
      } catch (error: any) {
        showAlert(
          "Error",
          error?.response?.data?.detail ?? "Failed to update primary address.",
        );
      } finally {
        setLoading(false);
      }
    },
    [savedAddresses],
  );

  const handleSelectAddress = useCallback(
    (address: Address) => {
      if (address.is_primary) {
        setAddressSheetVisible(false);
        return;
      }

      showAlert(
        "Set Primary Address",
        "Are you sure you want to set this address as primary?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "default",
            onPress: async () => {
              setAddressSheetVisible(false);
              await applyPrimary(address);
            },
          },
        ],
      );
    },
    [applyPrimary],
  );

  const serviceItems = useMemo(() => {
    if (services.length > 0) {
      return services.map((service, index) => ({
        id: service.id,
        label: service.service_name,
        price: service.base_price,
        icon: iconForIndex(index),
      }));
    }
    return [];
  }, [services]);


  if (loading) {
    return (
      <Box
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={PURPLE_DARK} />
      </Box>
    );
  }

  if (error || !services) {
    return (
      <Box
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ThemedText
          type="default"
          className="text-center mb-[20px]"
          style={{ color: colors.text }}
        >
          {error}
        </ThemedText>
        <Pressable onPress={() => router.replace("/profile")}>
          <ThemedText type="default" style={{ color: colors.text }}>
            Go to Profile
          </ThemedText>
        </Pressable>
      </Box>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
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
          <Animated.View style={{ opacity: fadeAnim }}>
            <VStack space="2xl" className="relative">
              {/* Top bar: location + notifications */}
              <HStack className="items-center justify-between">
                <Pressable onPress={() => setAddressSheetVisible(true)}>
                  <HStack space="sm" className="items-center">
                    <Box
                      className="w-9 h-9 rounded-full items-center justify-center"
                      style={{ backgroundColor: PURPLE_SOFT }}
                    >
                      <MapPin size={16} color={PURPLE} />
                    </Box>
                    <VStack>
                      <ThemedText
                        type="small"
                        style={{ color: colors.textSecondary }}
                      >
                        Delivering Care to
                      </ThemedText>
                      <HStack space="xs" className="items-center">
                        <ThemedText
                          type="default"
                          numberOfLines={1}
                          style={{
                            color: colors.text,
                            fontSize: 15,
                            fontWeight: "600",
                            maxWidth: 220,
                          }}
                        >
                          {selectedAddress
                            ? selectedAddress.address_line_1
                            : "Set your location"}
                        </ThemedText>
                        <ChevronDown size={16} color={colors.textSecondary} />
                      </HStack>
                    </VStack>
                  </HStack>
                </Pressable>

                <Pressable
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.secondaryBackground }}
                >
                  <Bell size={18} color={colors.text} />
                  <Box
                    className="w-2.5 h-2.5 rounded-full absolute"
                    style={{ backgroundColor: EMERGENCY_RED, top: 8, right: 8 }}
                  />
                </Pressable>
              </HStack>
              {profile?.first_name ? (
                <ThemedText
                  type="default"
                  style={{
                    color: colors.textSecondary,
                    fontSize: 13,
                    marginTop: -16,
                  }}
                >
                  Hello, {profile.first_name} 👋
                </ThemedText>
              ) : null}
              {/* Hero banner */}
              <Box
                className="rounded-3xl overflow-hidden"
                style={{ height: 220, position: "relative" }}
              >
                {/* Full-bleed background image */}
                <ImageBackground
                  source={require("../../assets/images/nurse.png")}
                  resizeMode="cover"
                  style={{
                    height: 220,
                    borderRadius: 24,
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={HERO_OVERLAY_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />

                  {/* Foreground content, stacked above the image */}
                  <Box
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 10,
                      padding: 22,
                    }}
                  >
                    <Box
                      className="rounded-2xl absolute flex-row items-center px-3 py-2"
                      style={{
                        backgroundColor: "#fff",
                        top: 16,
                        right: 16,
                        shadowColor: "#000",
                        shadowOpacity: 0.08,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2,
                      }}
                    >
                      <HStack space="xs" className="items-center">
                        <ShieldCheck size={16} color={PURPLE} />
                        <VStack>
                          <ThemedText
                            type="captionBold"
                            style={{ color: PURPLE_DEEP }}
                          >
                            Trusted Care
                          </ThemedText>
                          <ThemedText
                            type="caption"
                            style={{ color: colors.textSecondary }}
                          >
                            30 Min Arrival
                          </ThemedText>
                        </VStack>
                      </HStack>
                    </Box>

                    <VStack
                      space="sm"
                      style={{ marginTop: 28, maxWidth: "62%" }}
                    >
                      <VStack>
                        <ThemedText
                          type="heading"
                          style={{ color: PURPLE_DEEP, lineHeight: 27 }}
                        >
                          Professional
                        </ThemedText>
                        <ThemedText
                          type="heading"
                          style={{ color: "#1A1626", lineHeight: 27 }}
                        >
                          Care at Home
                        </ThemedText>
                      </VStack>
                      <ThemedText
                        type="small"
                        style={{ color: colors.textSecondary, lineHeight: 18 }}
                      >
                        Verified nurses. On time.{"\n"}Right at your doorstep.
                      </ThemedText>
                      <Pressable
                        // onPress={() => router.push("/services")}
                        className="rounded-full px-5 py-2.5 self-start mt-1 flex-row items-center"
                        style={{ backgroundColor: PURPLE_DARK }}
                      >
                        <ThemedText
                          type="smallBold"
                          style={{ color: colors.textInverted, lineHeight: 18 }}
                          className="mr-1"
                        >
                          Book Now
                        </ThemedText>
                        <ChevronRight size={15} color="#fff" />
                      </Pressable>
                    </VStack>
                  </Box>
                </ImageBackground>

                {/* Gradient scrim for text readability over the image */}
              </Box>
              {/* Pagination dots */}
              <HStack
                space="xs"
                className="items-center justify-center"
                style={{ marginTop: -12 }}
              >
                {[0, 1, 2, 3].map((dot) => (
                  <Box
                    key={dot}
                    className="rounded-full"
                    style={{
                      width: dot === 0 ? 16 : 6,
                      height: 6,
                      backgroundColor: dot === 0 ? PURPLE_DARK : PURPLE_SOFT,
                    }}
                  />
                ))}
              </HStack>
              {/* Healthcare Services at Home */}
              <HStack className="items-center justify-between">
                <ThemedText
                  type="subtitle"
                  numberOfLines={1}
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  Healthcare Services
                </ThemedText>
                <Pressable
                  onPress={() => router.push("/services")}
                  style={{ flexShrink: 0 }}
                >
                  <HStack space="xs" className="items-center">
                    <ThemedText
                      type="caption"
                      style={{ color: PURPLE, fontSize: 13 }}
                    >
                      View All
                    </ThemedText>
                    <ChevronRight size={14} color={PURPLE} />
                  </HStack>
                </Pressable>
              </HStack>
              <HStack className="flex-wrap justify-start gap-2">
                {serviceItems.slice(0, 6).map((service) => {
                  const Icon = service.icon;
                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      Icon={Icon}
                      colors={colors}
                      PURPLE={PURPLE}
                      PURPLE_SOFT={PURPLE_SOFT}
                      PURPLE_DEEP={PURPLE_DEEP}
                      onPress={() => router.push(`/services/${service.id}`)}
                    />
                  );
                })}
              </HStack>
              {/* Trust strip */}
              <HStack
                className="justify-between rounded-2xl p-3"
                style={{
                  backgroundColor: colors.secondaryBackground,
                }}
              >
                {TRUST_POINTS.map((point) => {
                  const Icon = point.icon;
                  return (
                    <VStack
                      key={point.id}
                      space="xs"
                      className="items-center flex-1"
                    >
                      <Icon size={18} color={PURPLE} />
                      <ThemedText
                        type="caption"
                        className="text-center"
                        numberOfLines={2}
                        style={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          lineHeight: 14,
                        }}
                      >
                        {point.label}
                      </ThemedText>
                    </VStack>
                  );
                })}
              </HStack>
              {/* Top Rated Nurses */}
              <HStack className="items-center justify-between">
                <ThemedText
                  type="subtitle"
                  numberOfLines={1}
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  Top Rated Nurses
                </ThemedText>
                <Pressable
                  style={{ flexShrink: 0 }}
                  // onPress={() => router.push("/nurses")}
                >
                  <HStack space="xs" className="items-center">
                    <ThemedText
                      type="caption"
                      style={{ color: PURPLE, fontSize: 13 }}
                    >
                      View All
                    </ThemedText>
                    <ChevronRight size={14} color={PURPLE} />
                  </HStack>
                </Pressable>
              </HStack>
              <VStack space="md">
                {FALLBACK_NURSES.map((nurse) => (
                  <Pressable
                    key={nurse.id}
                    // onPress={() => router.push("/nurses")}
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor: colors.secondaryBackground,
                    }}
                  >
                    <HStack space="md" className="items-center">
                      <Image
                        source={nurse.avatar}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                        resizeMode="cover"
                      />
                      <VStack space="xs" className="flex-1">
                        <ThemedText
                          type="smallBold"
                          style={{ color: colors.text, fontSize: 15 }}
                        >
                          {nurse.name}
                        </ThemedText>
                        <ThemedText
                          type="caption"
                          style={{ color: colors.textSecondary }}
                        >
                          {nurse.qualification} • {nurse.experience_years} Years
                          Exp.
                        </ThemedText>
                        <HStack space="xs" className="items-center">
                          <Star size={13} color="#F5A623" fill="#F5A623" />
                          <ThemedText
                            type="caption"
                            style={{ color: colors.textSecondary }}
                          >
                            {nurse.rating} ({nurse.review_count} reviews)
                          </ThemedText>
                        </HStack>
                      </VStack>
                      <ThemedText
                        type="smallBold"
                        style={{ color: colors.text }}
                      >
                        ₹{formatPrice(nurse.hourly_rate)}/hr
                      </ThemedText>
                    </HStack>
                  </Pressable>
                ))}
              </VStack>
            </VStack>
          </Animated.View>
        </ScrollView>

        {/* Address selection bottom sheet */}
        <AddressSelectorSheet
          visible={addressSheetVisible}
          onClose={() => setAddressSheetVisible(false)}
          addresses={savedAddresses}
          selectedAddressId={selectedAddress?.id ?? null}
          onSelectAddress={handleSelectAddress}
          onAddNewAddress={() => {
            setAddressSheetVisible(false);
            router.push("/address-form");
          }}
        />

        {/* Emergency banner */}
        {showEmergencyBanner && (
          <Box
            className="rounded-2xl p-4"
            style={{
              position: "absolute",
              bottom: 10,
              left: 16,
              right: 16,
              backgroundColor: EMERGENCY_BG,
              zIndex: 100,
            }}
          >
            <HStack space="sm" className="items-center">
              <Box
                className="rounded-full items-center justify-center p-2"
                style={{ backgroundColor: EMERGENCY_RED }}
              >
                <Siren size={20} color="#fff" />
              </Box>

              <VStack className="flex-1" space="xs">
                <ThemedText
                  type="smallBold"
                  style={{ color: EMERGENCY_RED_DARK }}
                >
                  Need a Nurse Immediately?
                </ThemedText>

                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary, lineHeight: 15 }}
                >
                  Get professional care at your doorstep within 30–60 mins.
                </ThemedText>
              </VStack>

              <Pressable
                className="rounded-full px-3 py-2 mt-8 mr-2"
                style={{ backgroundColor: EMERGENCY_RED }}
              >
                <HStack space="xs" className="items-center">
                  <ThemedText style={{ color: "white" }} type="captionBold">
                    Request Now
                  </ThemedText>
                  <Zap size={14} color="#fff" fill="#fff" />
                </HStack>
              </Pressable>

              {/* Close button */}
              <Pressable
                style={{
                  position: "absolute",
                  top: -10,
                  right: -2,
                  zIndex: 120,
                }}
                onPress={() => setShowEmergencyBanner(false)}
                className="p-1"
                hitSlop={10}
              >
                <X size={18} color={colors.textSecondary} />
              </Pressable>
            </HStack>
          </Box>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
