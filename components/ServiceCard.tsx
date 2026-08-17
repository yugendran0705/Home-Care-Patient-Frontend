import { formatPrice } from "@/constants/serviceTheme";
import React from "react";
import { Pressable } from "react-native";
import { ThemedText } from "./ThemedText";
import { Box } from "./ui/box";
import { HStack } from "./ui/hstack";

interface ServiceCardProps {
  service: {
    id: number | string;
    label: string;
    price: number | string;
    subtitle?: string;
  };
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
  colors: {
    background: string;
    text: string;
    textSecondary: string;
  };
  PURPLE: string;
  PURPLE_SOFT: string;
  PURPLE_DEEP: string;
  onPress?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  Icon,
  colors,
  PURPLE,
  PURPLE_SOFT,
  PURPLE_DEEP,
  onPress,
}) => {
  return (
    <Pressable
      className="w-[48%] items-center rounded-2xl px-3 py-4"
      style={{
        backgroundColor: colors.background,
        minHeight: 172,
        borderWidth: 1,
        borderColor: PURPLE_SOFT,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
      onPress={onPress}
    >
      <Box
        className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: PURPLE_SOFT }}
      >
        <Icon size={24} color={PURPLE} />
      </Box>

      <ThemedText
        type="smallBold"
        className="text-center"
        style={{ color: colors.text, flex: 1 }}
        numberOfLines={2}
      >
        {service.label}
      </ThemedText>

      {service.subtitle ? (
        <ThemedText
          type="caption"
          className="text-center"
          numberOfLines={1}
          style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}
        >
          {service.subtitle}
        </ThemedText>
      ) : null}

      <Box
        className="rounded-full px-3 py-1 mt-3"
        style={{ backgroundColor: PURPLE_SOFT }}
      >
        <HStack space="xs" className="items-baseline">
          <ThemedText
            type="caption"
            style={{ color: colors.textSecondary }}
          >
            From
          </ThemedText>

          <ThemedText type="captionBold" style={{ color: PURPLE_DEEP }}>
            ₹{formatPrice(service.price)}
          </ThemedText>
        </HStack>
      </Box>
    </Pressable>
  );
};

export default ServiceCard;
