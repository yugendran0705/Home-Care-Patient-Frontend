import axiosInstance from "@/axiosInstance";
import { ThemedText } from "@/components/ThemedText";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { PURPLE, PURPLE_DARK, PURPLE_SOFT } from "@/constants/serviceTheme";
import { useAlert } from "@/hooks/useAlert";
import type { Review } from "@/hooks/useBookings";
import { Star } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, TextInput } from "react-native";

const STAR_COLOR = "#F5A623";
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

interface ReviewSectionProps {
  bookingId: string;
  review: Review | null;
  colors: {
    text: string;
    textSecondary: string;
    textInverted: string;
    secondaryBackground: string;
    error: string;
  };
  // Refetches bookings in the background. The section doesn't wait on it:
  // it shows what the review endpoints returned, so a failed refetch can't
  // make a saved review look lost.
  onChanged: () => Promise<void>;
  // Shift rows start as a single "Rate" button instead of an open form.
  startCollapsed?: boolean;
}

const apiErrorMessage = (e: any, fallback: string) => {
  const detail = e?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
};

function Stars({
  rating,
  size,
  onSelect,
}: {
  rating: number;
  size: number;
  onSelect?: (value: number) => void;
}) {
  return (
    <HStack space={onSelect ? "sm" : "xs"} className="items-center">
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= rating;
        const star = (
          <Star
            size={size}
            color={filled ? STAR_COLOR : "#C9C4DD"}
            fill={filled ? STAR_COLOR : "transparent"}
          />
        );
        return onSelect ? (
          <Pressable key={value} onPress={() => onSelect(value)} hitSlop={6}>
            {star}
          </Pressable>
        ) : (
          <HStack key={value}>{star}</HStack>
        );
      })}
    </HStack>
  );
}

export default function ReviewSection({
  bookingId,
  review: reviewFromBooking,
  colors,
  onChanged,
  startCollapsed = false,
}: ReviewSectionProps) {
  const showAlert = useAlert();
  // Source of truth for what's on screen: seeded from the booking, then set
  // directly from each create/update/delete response.
  const [review, setReview] = useState<Review | null>(reviewFromBooking);
  // A successful refetch still wins (e.g. edited from another device). Each
  // refetch delivers new objects; a failed one leaves the old object in
  // place, so this doesn't fire and can't clobber a just-saved review.
  useEffect(() => {
    setReview(reviewFromBooking);
  }, [reviewFromBooking]);
  const [editing, setEditing] = useState(!review && !startCollapsed);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startEditing = () => {
    setRating(review?.rating ?? 0);
    setComment(review?.comment ?? "");
    setError("");
    setEditing(true);
  };

  const submit = async () => {
    if (rating < 1) {
      setError("Please select a rating.");
      return;
    }
    setSubmitting(true);
    setError("");
    const body = { rating, comment: comment.trim() || null };
    try {
      const { data } = review
        ? await axiosInstance.put<Review>(`/reviews/${review.id}`, body)
        : await axiosInstance.post<Review>(`/reviews/bookings/${bookingId}`, body);
      setReview(data);
      setEditing(false);
      onChanged();
    } catch (e: any) {
      // 409 = a review already exists (e.g. posted from another device):
      // load it instead of offering a form that can never be submitted.
      if (e?.response?.status === 409) {
        try {
          const { data } = await axiosInstance.get<Review>(`/reviews/bookings/${bookingId}`);
          setReview(data);
          setEditing(false);
          onChanged();
        } catch {
          setError("You've already reviewed this visit. Pull down to refresh.");
        }
      } else {
        setError(apiErrorMessage(e, "Couldn't save your review. Please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!review) return;
    setSubmitting(true);
    try {
      await axiosInstance.delete(`/reviews/${review.id}`);
      setReview(null);
      onChanged();
      setRating(0);
      setComment("");
      setEditing(!startCollapsed);
    } catch (e: any) {
      setError(apiErrorMessage(e, "Couldn't delete your review. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () =>
    showAlert("Delete review?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove },
    ]);

  // Existing review, read-only
  if (review && !editing) {
    return (
      <VStack
        space="sm"
        className="rounded-2xl p-4"
        style={{ backgroundColor: colors.secondaryBackground }}
      >
        <HStack className="items-center justify-between">
          <Stars rating={review.rating} size={16} />
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {new Date(review.review_date).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </ThemedText>
        </HStack>
        {review.comment ? (
          <ThemedText type="small" style={{ color: colors.text, lineHeight: 20 }}>
            {review.comment}
          </ThemedText>
        ) : null}
        {submitting ? (
          <ActivityIndicator color={PURPLE} />
        ) : (
          <HStack space="lg">
            <Pressable onPress={startEditing}>
              <ThemedText type="captionBold" style={{ color: PURPLE_DARK }}>
                Edit
              </ThemedText>
            </Pressable>
            <Pressable onPress={confirmDelete}>
              <ThemedText type="captionBold" style={{ color: colors.error }}>
                Delete
              </ThemedText>
            </Pressable>
          </HStack>
        )}
        {error ? (
          <ThemedText type="caption" style={{ color: colors.error }}>
            {error}
          </ThemedText>
        ) : null}
      </VStack>
    );
  }

  // No review yet, collapsed into a single call to action
  if (!editing) {
    return (
      <Pressable
        onPress={startEditing}
        className="rounded-full py-2.5 items-center"
        style={{ borderWidth: 1, borderColor: PURPLE_DARK }}
      >
        <HStack space="xs" className="items-center">
          <Star size={14} color={PURPLE_DARK} />
          <ThemedText type="smallBold" style={{ color: PURPLE_DARK }}>
            Rate this visit
          </ThemedText>
        </HStack>
      </Pressable>
    );
  }

  // Create / edit form
  return (
    <VStack
      space="md"
      className="rounded-2xl p-4"
      style={{ backgroundColor: colors.secondaryBackground }}
    >
      <VStack space="xs" className="items-center">
        <Stars rating={rating} size={32} onSelect={setRating} />
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {rating ? RATING_LABELS[rating] : "Tap to rate your nurse"}
        </ThemedText>
      </VStack>

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Tell others about your experience (optional)"
        placeholderTextColor={colors.textSecondary}
        cursorColor={PURPLE}
        multiline
        maxLength={1000}
        textAlignVertical="top"
        style={{
          minHeight: 90,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: PURPLE_SOFT,
          backgroundColor: "#FFFFFF",
          padding: 12,
          color: "#111111",
          fontFamily: "Sen-Regular",
        }}
      />

      {error ? (
        <ThemedText type="caption" style={{ color: colors.error }}>
          {error}
        </ThemedText>
      ) : null}

      {/* Fixed height + single-line labels: these sit inside a narrow shift
          card, and large system font sizes otherwise wrap and clip them. */}
      <HStack space="sm">
        {review || startCollapsed ? (
          <Pressable
            onPress={() => {
              setError("");
              setEditing(false);
            }}
            disabled={submitting}
            className="flex-1 rounded-full items-center justify-center px-3"
            style={{ height: 44, borderWidth: 1, borderColor: PURPLE_DARK }}
          >
            <ThemedText
              type="smallBold"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={{ color: PURPLE_DARK }}
            >
              Cancel
            </ThemedText>
          </Pressable>
        ) : null}
        <Pressable
          onPress={submit}
          disabled={submitting}
          className="flex-1 rounded-full items-center justify-center px-3"
          style={{
            height: 44,
            backgroundColor: PURPLE_DARK,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText
              type="smallBold"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={{ color: colors.textInverted }}
            >
              {review ? "Update" : "Submit"}
            </ThemedText>
          )}
        </Pressable>
      </HStack>
    </VStack>
  );
}
