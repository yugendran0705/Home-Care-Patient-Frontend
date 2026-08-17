import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { PURPLE_DEEP, PURPLE_SOFT } from "@/constants/serviceTheme";
import { ChevronRight, MapPinned, Star } from "lucide-react-native";
import { Pressable } from "react-native";

export interface NurseSearchResult {
  nurse_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  years_of_experience: number;
  bio: string | null;
  profile_picture_url: string | null;
  average_rating: string;
  distance_meters: number | null;
}

interface NurseCardProps {
  nurse: NurseSearchResult;
  colors: { background: string; text: string; textSecondary: string };
  onPress: () => void;
}

const formatDistance = (meters: number | null) => {
  if (meters == null) return null;
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km away`
    : `${Math.round(meters)} m away`;
};

export default function NurseCard({ nurse, colors, onPress }: NurseCardProps) {
  const initials = `${nurse.first_name.charAt(0)}${nurse.last_name.charAt(0)}`;
  const distance = formatDistance(nurse.distance_meters);
  const rating = parseFloat(nurse.average_rating);

  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-4"
      style={{
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: PURPLE_SOFT,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
      }}
    >
      <HStack space="md" className="items-center">
        <Box
          className="w-14 h-14 rounded-full items-center justify-center"
          style={{ backgroundColor: PURPLE_SOFT }}
        >
          <ThemedText type="defaultBold" style={{ color: PURPLE_DEEP }}>
            {initials}
          </ThemedText>
        </Box>
        <VStack className="flex-1" space="xs">
          <ThemedText type="smallBold" style={{ color: colors.text }}>
            {nurse.first_name} {nurse.last_name}
          </ThemedText>
          <HStack space="xs" className="items-center">
            <Star size={12} color="#F5A623" fill="#F5A623" />
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {rating > 0 ? rating.toFixed(1) : "New"} ·{" "}
              {nurse.years_of_experience} yrs exp.
            </ThemedText>
          </HStack>
          {distance ? (
            <HStack space="xs" className="items-center">
              <MapPinned size={12} color={colors.textSecondary} />
              <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                {distance}
              </ThemedText>
            </HStack>
          ) : null}
          {nurse.bio ? (
            <ThemedText
              type="caption"
              numberOfLines={2}
              style={{ color: colors.textSecondary }}
            >
              {nurse.bio}
            </ThemedText>
          ) : null}
        </VStack>
        <ChevronRight size={18} color={colors.textSecondary} />
      </HStack>
    </Pressable>
  );
}
