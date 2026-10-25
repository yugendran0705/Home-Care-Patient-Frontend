import axiosInstance from "@/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import { useBookings } from "../useBookings";

const api = axiosInstance as jest.Mocked<typeof axiosInstance>;
const bookings = [{ id: "b1" }, { id: "b2" }];

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

it("fetches bookings and caches them", async () => {
  api.get.mockResolvedValueOnce({ data: bookings });
  const { result } = renderHook(() => useBookings());
  await act(() => result.current.fetchData());
  expect(api.get).toHaveBeenCalledWith("/bookings/me");
  expect(result.current.bookings).toEqual(bookings);
  expect(JSON.parse((await AsyncStorage.getItem("bookings"))!)).toEqual(bookings);
});

it("shows cached bookings without a network call", async () => {
  await AsyncStorage.setItem("bookings", JSON.stringify(bookings));
  const { result } = renderHook(() => useBookings());
  await act(() => result.current.loadFromAsyncStorage());
  expect(result.current.bookings).toEqual(bookings);
  expect(result.current.loading).toBe(false);
  expect(api.get).not.toHaveBeenCalled();
});

it("fetches when nothing is cached", async () => {
  api.get.mockResolvedValueOnce({ data: bookings });
  const { result } = renderHook(() => useBookings());
  await act(() => result.current.loadFromAsyncStorage());
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(result.current.bookings).toEqual(bookings);
});

it("a silent refetch doesn't flash the spinner", async () => {
  api.get.mockResolvedValueOnce({ data: bookings });
  const { result } = renderHook(() => useBookings());
  await act(() => result.current.fetchData());

  let resolve!: (v: unknown) => void;
  api.get.mockReturnValueOnce(new Promise((r) => (resolve = r)));
  let pending!: Promise<void>;
  act(() => {
    pending = result.current.fetchData({ silent: true });
  });
  expect(result.current.loading).toBe(false);
  await act(async () => {
    resolve({ data: bookings });
    await pending;
  });
});

it("reports a failed fetch", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  api.get.mockRejectedValueOnce(new Error("Network Error"));
  const { result } = renderHook(() => useBookings());
  await act(() => result.current.fetchData());
  expect(result.current.error).toBe("Failed to fetch bookings. Please try again.");
  expect(result.current.loading).toBe(false);
});
