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
  };
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
  }>;
  colors: {
    secondaryBackground: string;
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
      className="w-[31%] items-center rounded-2xl py-3"
      style={{ backgroundColor: colors.secondaryBackground }}
      onPress={onPress}
    >
      <Box
        className="w-12 h-12 rounded-2xl items-center justify-center mb-2"
        style={{ backgroundColor: PURPLE_SOFT }}
      >
        <Icon size={20} color={PURPLE} />
      </Box>

      <ThemedText
        type="small"
        className="text-center"
        style={{ color: colors.text }}
        numberOfLines={2}
      >
        {service.label}
      </ThemedText>

      <HStack space="xs">
        <ThemedText
          type="caption"
          className="text-center mt-1"
          style={{ color: colors.textSecondary }}
        >
          From
        </ThemedText>

        <ThemedText
          type="caption"
          className="text-center mt-1"
          style={{ color: PURPLE_DEEP }}
        >
          ₹{service.price}
        </ThemedText>
      </HStack>
    </Pressable>
  );
};

export default ServiceCard;
