import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import { ChevronRight, Home, MapPin, Plus, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";

const PURPLE = "#7C6FF0";
const PURPLE_DEEP = "#4C3FCB";
const PURPLE_SOFT = "#F1EEFF";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export interface Address {
  id: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  pincode: string;
  is_primary: boolean;
}

interface AddressSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  addresses?: Address[];
  selectedAddressId?: string | null;
  onSelectAddress: (address: Address) => void;
  onAddNewAddress?: () => void;
}

// Everything after line 1 collapsed into a single readable line.
const secondaryLine = (a: Address) =>
  [a.address_line_2, a.city, [a.state, a.pincode].filter(Boolean).join(" ")]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(", ");

export default function AddressSelectorSheet({
  visible,
  onClose,
  addresses = [],
  selectedAddressId = null,
  onSelectAddress,
  onAddNewAddress,
}: AddressSelectorSheetProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [mounted, setMounted] = useState(visible);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  // Slide the sheet up / fade the backdrop in when opened, and reverse
  // on close — keeping the Modal mounted until the exit finishes so the
  // dismissal doesn't just snap away.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdrop, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
            speed: 14,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Drag-to-dismiss is bound to the header/handle only, so the inner
  // ScrollView keeps working without gesture conflicts.
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 0.8) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Box className="flex-1 justify-end">
        {/* Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdrop },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={{
            transform: [{ translateY }],
            maxHeight: SCREEN_HEIGHT * 0.85,
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: "hidden",
          }}
        >
          {/* Handle + header — this region drives the drag gesture */}
          <Box
            {...panResponder.panHandlers}
            style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: 8 }}
          >
            <Box
              className="self-center rounded-full"
              style={{
                width: 40,
                height: 5,
                backgroundColor: colors.textSecondary,
                opacity: 0.25,
                marginBottom: 16,
              }}
            />
            <HStack className="items-center justify-between">
              <ThemedText type="subtitle" style={{ color: colors.text }}>
                Select service location
              </ThemedText>
              <Pressable
                onPress={onClose}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.secondaryBackground }}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </HStack>
          </Box>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: 36,
            }}
          >
            <VStack space="lg">
              {/* Add new address */}
              <Pressable
                onPress={onAddNewAddress}
                className="rounded-2xl px-4 py-4"
                style={{ backgroundColor: colors.secondaryBackground }}
              >
                <HStack space="md" className="items-center">
                  <Box
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: PURPLE_SOFT }}
                  >
                    <Plus size={18} color={PURPLE} />
                  </Box>
                  <ThemedText
                    type="defaultBold"
                    className="flex-1"
                    style={{ color: PURPLE }}
                  >
                    Add new address
                  </ThemedText>
                  <ChevronRight size={18} color={colors.textSecondary} />
                </HStack>
              </Pressable>

              {/* Saved addresses */}
              {addresses.length > 0 ? (
                <VStack space="sm">
                  <ThemedText
                    type="smallBold"
                    style={{ color: colors.textSecondary }}
                  >
                    Your saved addresses
                  </ThemedText>

                  <VStack space="md">
                    {addresses.map((address) => {
                      const Icon = address.is_primary ? Home : MapPin;
                      const selected = address.id === selectedAddressId;

                      return (
                        <Pressable
                          key={address.id}
                          onPress={() => onSelectAddress(address)}
                          className="rounded-2xl p-4"
                          style={{
                            backgroundColor: colors.secondaryBackground,
                            borderWidth: 1.5,
                            borderColor: selected ? PURPLE : "transparent",
                          }}
                        >
                          <HStack space="md" className="items-center">
                            <Box
                              className="w-11 h-11 rounded-2xl items-center justify-center"
                              style={{ backgroundColor: PURPLE_SOFT }}
                            >
                              <Icon size={20} color={PURPLE} />
                            </Box>

                            <VStack className="flex-1" space="xs">
                              <HStack space="sm" className="items-center">
                                <ThemedText
                                  type="defaultBold"
                                  style={{ color: colors.text, flexShrink: 1 }}
                                  numberOfLines={1}
                                >
                                  {address.address_line_1}
                                </ThemedText>
                                {address.is_primary && (
                                  <Box
                                    className="rounded-full px-2 py-0.5"
                                    style={{
                                      backgroundColor: PURPLE_SOFT,
                                      flexShrink: 0,
                                    }}
                                  >
                                    <ThemedText
                                      type="caption"
                                      style={{ color: PURPLE_DEEP }}
                                    >
                                      Primary
                                    </ThemedText>
                                  </Box>
                                )}
                              </HStack>

                              <ThemedText
                                type="caption"
                                style={{
                                  color: colors.textSecondary,
                                  lineHeight: 17,
                                }}
                                numberOfLines={2}
                              >
                                {secondaryLine(address)}
                              </ThemedText>
                            </VStack>
                          </HStack>
                        </Pressable>
                      );
                    })}
                  </VStack>
                </VStack>
              ) : (
                <ThemedText
                  type="small"
                  className="text-center"
                  style={{ color: colors.textSecondary, paddingVertical: 8 }}
                >
                  No saved addresses yet. Add one to get started.
                </ThemedText>
              )}
            </VStack>
          </ScrollView>
        </Animated.View>
      </Box>
    </Modal>
  );
}
