import axiosInstance from "@/axiosInstance";
import { useCallback, useRef, useState } from "react";

// audience_type ENUM (models.Notification): global, role, user
export interface AppNotification {
  id: string;
  type: string; // free-form, e.g. "booking_confirmed", "policy_update"
  title: string;
  body: string;
  data: Record<string, any>;
  audience_type: "global" | "role" | "user";
  audience_role: "Patient" | "Nurse" | null;
  target_user_id: string | null;
  read_at: string | null;
  created_by: string | null;
  created_at: string;
}

// Only private (audience_type "user") notifications carry per-user read
// state - global/role broadcasts share a single read_at, the backend ignores
// marking them read, and /notifications/unread-count excludes them. Treating
// broadcasts as never-unread keeps the list consistent with the bell badge.
export const isUnread = (n: AppNotification) =>
  n.audience_type === "user" && !n.read_at;

const PAGE_SIZE = 20;

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  // Guards against onEndReached firing again while a page is in flight.
  const loadingMoreRef = useRef(false);
  // Bumped by every first-page load. An older page that was requested before
  // the latest refresh is stale (the list it was paging through is gone), so
  // fetchMore drops its result instead of appending it to the new list.
  const generationRef = useRef(0);

  // mode "replace": the list becomes the newest page (first load, pull-to-
  // refresh). mode "merge": refresh the newest page in place but keep the
  // older pages already loaded, so returning to the screen doesn't throw away
  // the user's scroll position.
  const fetchFirstPage = useCallback(async (opts?: { mode?: "replace" | "merge" }) => {
    const mode = opts?.mode ?? "replace";
    const generation = ++generationRef.current;
    // `loading` starts true and only drives the first-load spinner; later
    // loads refresh in place (pull-to-refresh shows its own indicator).
    setError("");
    try {
      const { data } = await axiosInstance.get<AppNotification[]>(
        "/notifications",
        { params: { limit: PAGE_SIZE } },
      );
      if (generation !== generationRef.current) return; // a newer load won
      if (mode === "merge") {
        setNotifications((prev) => {
          // Keep a read the app already made locally: its PATCH may still be
          // in flight when this page comes back, and the dot shouldn't return.
          const readLocally = new Map(
            prev.filter((n) => n.read_at).map((n) => [n.id, n.read_at]),
          );
          const page = data.map((n) =>
            n.read_at || !readLocally.has(n.id) ? n : { ...n, read_at: readLocally.get(n.id)! },
          );
          if (page.length < PAGE_SIZE) return page; // the whole feed fits in one page
          const oldestFresh = Date.parse(page[page.length - 1].created_at);
          const freshIds = new Set(page.map((n) => n.id));
          return [
            ...page,
            ...prev.filter(
              (n) => !freshIds.has(n.id) && Date.parse(n.created_at) < oldestFresh,
            ),
          ];
        });
        if (data.length < PAGE_SIZE) setHasMore(false);
      } else {
        setNotifications(data);
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cursor pagination: the backend returns items strictly older than `before`.
  const fetchMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || notifications.length === 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const generation = generationRef.current;
    try {
      const oldest = notifications[notifications.length - 1].created_at;
      const { data } = await axiosInstance.get<AppNotification[]>(
        "/notifications",
        { params: { limit: PAGE_SIZE, before: oldest } },
      );
      if (generation !== generationRef.current) return; // list was refreshed meanwhile
      setNotifications((prev) => {
        const seen = new Set(prev.map((n) => n.id));
        return [...prev, ...data.filter((n) => !seen.has(n.id))];
      });
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, notifications]);

  // Optimistic: the dot clears immediately; rolled back if the call fails.
  const markRead = useCallback(async (notification: AppNotification) => {
    if (!isUnread(notification)) return;
    const readAt = new Date().toISOString();
    const setReadAt = (value: string | null) =>
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read_at: value } : n)),
      );
    setReadAt(readAt);
    try {
      await axiosInstance.patch(`/notifications/${notification.id}/read`);
    } catch (e) {
      console.error(e);
      setReadAt(null);
    }
  }, []);

  return {
    notifications,
    loading,
    loadingMore,
    hasMore,
    error,
    fetchFirstPage,
    fetchMore,
    markRead,
  };
}

// Lightweight count for the home-screen bell badge.
export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get<{ unread_count: number }>(
        "/notifications/unread-count",
      );
      setCount(data.unread_count);
    } catch (e) {
      // A badge that fails to load just stays hidden; not worth an alert.
      console.error(e);
    }
  }, []);

  return { count, refresh };
}
