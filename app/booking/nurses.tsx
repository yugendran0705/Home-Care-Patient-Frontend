import NurseCard, { NurseSearchResult } from "@/components/NurseCard";
import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { Icon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/Colors";
import { PURPLE } from "@/constants/serviceTheme";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, UserX } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, ScrollView, useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function NurseResultsScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { serviceId, requestedStartTime, nurses } = useLocalSearchParams<{
    serviceId: string;
    requestedStartTime: string;
    nurses: string;
  }>();

  const nurseList: NurseSearchResult[] = useMemo(() => {
    try {
      return nurses ? JSON.parse(nurses) : [];
    } catch {
      return [];
    }
  }, [nurses]);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <Box className="flex-row gap-4 items-center px-3 mt-5">
          <Pressable onPress={() => router.back()} className="ml-2">
            <Icon as={ArrowLeft} size="xl" color={colors.text} />
          </Pressable>
          <ThemedText type="heading" style={{ color: colors.text }}>
            Available Nurses
          </ThemedText>
        </Box>

        <ScrollView
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {nurseList.length === 0 ? (
            <Box
              className="flex-1 justify-center items-center px-6"
              style={{ paddingTop: 80 }}
            >
              <UserX size={40} color={colors.textSecondary} />
              <ThemedText
                type="default"
                className="text-center mt-3"
                style={{ color: colors.textSecondary }}
              >
                No nurses are available at this time. Try a different date or
                time.
              </ThemedText>
              <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
                <ThemedText type="defaultBold" style={{ color: PURPLE }}>
                  Change Time
                </ThemedText>
              </Pressable>
            </Box>
          ) : (
            <VStack space="md">
              {nurseList.map((nurse) => (
                <NurseCard
                  key={nurse.nurse_id}
                  nurse={nurse}
                  colors={colors}
                  onPress={() =>
                    router.push({
                      pathname: "/booking/summary",
                      params: {
                        serviceId,
                        requestedStartTime,
                        nurse: JSON.stringify(nurse),
                      },
                    })
                  }
                />
              ))}
            </VStack>
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
