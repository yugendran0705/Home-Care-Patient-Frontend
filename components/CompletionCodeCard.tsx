import axiosInstance from "@/axiosInstance";
import { ThemedText } from "@/components/ThemedText";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { PURPLE, PURPLE_DEEP, PURPLE_SOFT } from "@/constants/serviceTheme";
import { useAlert } from "@/hooks/useAlert";
import { KeyRound, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable } from "react-native";

interface CompletionCodeCardProps {
  bookingId: string;
  colors: { text: string; textSecondary: string; error: string };
  // Continuous bookings load the code straight away; Daily_Shift shifts wait
  // for a tap so a long shift list doesn't fire one request per shift.
  revealOnMount?: boolean;
  // Called when the backend says the booking is no longer Confirmed (e.g. the
  // nurse just redeemed the code), so the screen can refetch and move on.
  onStale?: () => void;
}

const apiErrorMessage = (e: any, fallback: string) => {
  const detail = e?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
};

export default function CompletionCodeCard({
  bookingId,
  colors,
  revealOnMount = true,
  onStale,
}: CompletionCodeCardProps) {
  const showAlert = useAlert();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleError = useCallback(
    (e: any, fallback: string) => {
      if (e?.response?.status === 409) onStale?.();
      setError(apiErrorMessage(e, fallback));
    },
    [onStale],
  );

  const loadCode = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.get(
        `/bookings/${bookingId}/completion-otp`,
      );
      setCode(data.completion_otp);
    } catch (e: any) {
      handleError(e, "Couldn't load the completion code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, handleError]);

  useEffect(() => {
    if (revealOnMount) loadCode();
  }, [revealOnMount, loadCode]);

  const regenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axiosInstance.post(
        `/bookings/${bookingId}/completion-otp/regenerate`,
      );
      setCode(data.completion_otp);
    } catch (e: any) {
      handleError(e, "Couldn't generate a new code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmRegenerate = () =>
    showAlert(
      "Get a new code?",
      "Your current code will stop working. Use this if your nurse was locked out after too many wrong attempts.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Get New Code", onPress: regenerate },
      ],
    );

  return (
    <VStack
      space="md"
      className="rounded-2xl p-4"
      style={{ backgroundColor: PURPLE_SOFT }}
    >
      <HStack space="sm" className="items-center">
        <KeyRound size={16} color={PURPLE_DEEP} />
        <ThemedText type="smallBold" style={{ color: PURPLE_DEEP }}>
          Visit Completion Code
        </ThemedText>
      </HStack>

      {loading ? (
        <Box className="py-3 items-center">
          <ActivityIndicator color={PURPLE} />
        </Box>
      ) : code ? (
        <HStack className="justify-between">
          {code.split("").map((digit, i) => (
            <Box
              key={i}
              className="rounded-xl items-center justify-center"
              style={{ width: 42, height: 50, backgroundColor: "#FFFFFF" }}
            >
              <ThemedText
                type="heading"
                style={{ color: PURPLE_DEEP, fontSize: 24, lineHeight: 30 }}
              >
                {digit}
              </ThemedText>
            </Box>
          ))}
        </HStack>
      ) : !error ? (
        <Pressable
          onPress={loadCode}
          className="rounded-full py-2.5 items-center"
          style={{ backgroundColor: PURPLE_DEEP }}
        >
          <ThemedText type="smallBold" style={{ color: "#FFFFFF" }}>
            Show Code
          </ThemedText>
        </Pressable>
      ) : null}

      {error ? (
        <HStack className="items-center justify-between">
          <ThemedText
            type="caption"
            style={{ color: colors.error, flex: 1, marginRight: 8 }}
          >
            {error}
          </ThemedText>
          <Pressable onPress={loadCode}>
            <ThemedText type="captionBold" style={{ color: PURPLE_DEEP }}>
              Retry
            </ThemedText>
          </Pressable>
        </HStack>
      ) : null}

      <ThemedText type="caption" style={{ color: colors.textSecondary }}>
        Share this code with your nurse only once the visit is done. They
        enter it in their app to mark the visit complete.
      </ThemedText>

      {code && !loading ? (
        <Pressable onPress={confirmRegenerate} className="self-start">
          <HStack space="xs" className="items-center">
            <RefreshCw size={12} color={PURPLE_DEEP} />
            <ThemedText type="captionBold" style={{ color: PURPLE_DEEP }}>
              Nurse locked out? Get a new code
            </ThemedText>
          </HStack>
        </Pressable>
      ) : null}
    </VStack>
  );
}
