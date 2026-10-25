import axiosInstance from "@/axiosInstance";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  isUnread,
  useNotifications,
  useUnreadNotificationCount,
  type AppNotification,
} from "../useNotifications";

const api = axiosInstance as jest.Mocked<typeof axiosInstance>;
const PAGE_SIZE = 20;

// Newest first, like the API: n(0) is the most recent.
const n = (i: number, overrides: Partial<AppNotification> = {}): AppNotification => ({
  id: `n${i}`,
  type: "booking_confirmed",
  title: `Notification ${i}`,
  body: "",
  data: {},
  audience_type: "user",
  audience_role: "Patient",
  target_user_id: "me",
  read_at: null,
  created_by: null,
  created_at: new Date(Date.UTC(2030, 0, 1, 12, 0, 0) - i * 60_000).toISOString(),
  ...overrides,
});
const page = (from: number, count: number) => Array.from({ length: count }, (_, k) => n(from + k));

beforeEach(() => jest.clearAllMocks());

describe("isUnread", () => {
  it("only private notifications can be unread", () => {
    expect(isUnread(n(1))).toBe(true);
    expect(isUnread(n(1, { read_at: "2030-01-01T00:00:00Z" }))).toBe(false);
    expect(isUnread(n(1, { audience_type: "global" }))).toBe(false);
    expect(isUnread(n(1, { audience_type: "role" }))).toBe(false);
  });
});

describe("useNotifications", () => {
  it("loads the first page and knows whether more exist", async () => {
    api.get.mockResolvedValueOnce({ data: page(0, PAGE_SIZE) });
    const { result } = renderHook(() => useNotifications());
    await act(() => result.current.fetchFirstPage());
    expect(result.current.notifications).toHaveLength(PAGE_SIZE);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(api.get).toHaveBeenCalledWith("/notifications", { params: { limit: PAGE_SIZE } });
  });

  it("pages older items with the oldest created_at as the cursor, without duplicates", async () => {
    api.get.mockResolvedValueOnce({ data: page(0, PAGE_SIZE) });
    const { result } = renderHook(() => useNotifications());
    await act(() => result.current.fetchFirstPage());

    const oldest = result.current.notifications[PAGE_SIZE - 1].created_at;
    api.get.mockResolvedValueOnce({ data: [n(PAGE_SIZE - 1), ...page(PAGE_SIZE, 5)] });
    await act(() => result.current.fetchMore());

    expect(api.get).toHaveBeenLastCalledWith("/notifications", {
      params: { limit: PAGE_SIZE, before: oldest },
    });
    expect(result.current.notifications).toHaveLength(PAGE_SIZE + 5);
    expect(result.current.hasMore).toBe(false);
  });

  it("a merge refresh keeps older pages and reads made locally", async () => {
    api.get.mockResolvedValueOnce({ data: page(0, PAGE_SIZE) });
    const { result } = renderHook(() => useNotifications());
    await act(() => result.current.fetchFirstPage());
    api.get.mockResolvedValueOnce({ data: page(PAGE_SIZE, PAGE_SIZE) });
    await act(() => result.current.fetchMore());
    api.patch.mockResolvedValueOnce({});
    await act(() => result.current.markRead(result.current.notifications[3]));

    // The server hasn't seen the read yet and returns n3 still unread.
    api.get.mockResolvedValueOnce({ data: page(0, PAGE_SIZE) });
    await act(() => result.current.fetchFirstPage({ mode: "merge" }));

    expect(result.current.notifications).toHaveLength(PAGE_SIZE * 2);
    expect(result.current.notifications[3].read_at).not.toBeNull();
  });

  it("marks read optimistically and rolls back if the call fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockResolvedValueOnce({ data: [n(0)] });
    const { result } = renderHook(() => useNotifications());
    await act(() => result.current.fetchFirstPage());

    let rejectPatch!: (e: Error) => void;
    api.patch.mockReturnValueOnce(new Promise((_, reject) => (rejectPatch = reject)));
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.markRead(result.current.notifications[0]);
    });
    expect(result.current.notifications[0].read_at).not.toBeNull();

    await act(async () => {
      rejectPatch(new Error("offline"));
      await pending;
    });
    expect(result.current.notifications[0].read_at).toBeNull();
  });

  it("never calls the API to mark a broadcast as read", async () => {
    const { result } = renderHook(() => useNotifications());
    await act(() => result.current.markRead(n(0, { audience_type: "global" })));
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("drops a page that arrives after the list was refreshed", async () => {
    api.get.mockResolvedValueOnce({ data: page(0, PAGE_SIZE) });
    const { result } = renderHook(() => useNotifications());
    await act(() => result.current.fetchFirstPage());

    let resolveOld!: (v: unknown) => void;
    api.get.mockReturnValueOnce(new Promise((resolve) => (resolveOld = resolve)));
    let more!: Promise<void>;
    act(() => {
      more = result.current.fetchMore();
    });
    api.get.mockResolvedValueOnce({ data: [n(100)] });
    await act(() => result.current.fetchFirstPage());
    await act(async () => {
      resolveOld({ data: page(PAGE_SIZE, 3) });
      await more;
    });

    expect(result.current.notifications.map((x) => x.id)).toEqual(["n100"]);
  });

  it("shows an error when the feed can't load", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useNotifications());
    await act(() => result.current.fetchFirstPage());
    expect(result.current.error).toBe("Failed to load notifications. Please try again.");
  });
});

describe("useUnreadNotificationCount", () => {
  it("reads the badge count", async () => {
    api.get.mockResolvedValueOnce({ data: { unread_count: 3 } });
    const { result } = renderHook(() => useUnreadNotificationCount());
    await act(() => result.current.refresh());
    await waitFor(() => expect(result.current.count).toBe(3));
  });

  it("keeps the badge hidden if the count fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    api.get.mockRejectedValueOnce(new Error("Network Error"));
    const { result } = renderHook(() => useUnreadNotificationCount());
    await act(() => result.current.refresh());
    expect(result.current.count).toBe(0);
  });
});
