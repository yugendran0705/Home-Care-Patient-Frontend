/**
 * The real API client's interceptors: attach the access token, refresh it
 * once on a 401 and retry, and sign the user out if the refresh fails.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";

const { default: api } = jest.requireActual("@/axiosInstance");

type Handler = (config: any) => Promise<any>;
let server: jest.Mock<ReturnType<Handler>, Parameters<Handler>>;

const reply = (config: any, status: number, data: any = {}) => {
  const response = { status, data, headers: {}, config, statusText: String(status) };
  if (status >= 400) {
    return Promise.reject(Object.assign(new Error(`HTTP ${status}`), { config, response }));
  }
  return Promise.resolve(response);
};

beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  await AsyncStorage.clear();
  server = jest.fn();
  api.defaults.adapter = server;
});

afterEach(() => jest.restoreAllMocks());

it("sends the stored access token", async () => {
  await AsyncStorage.setItem("access_token", JSON.stringify({ access_token: "abc" }));
  server.mockImplementation((config) => reply(config, 200, { ok: true }));
  await api.get("/bookings/me");
  expect(server.mock.calls[0][0].headers.Authorization).toBe("Bearer abc");
});

it("refreshes once on a 401 and retries with the new token", async () => {
  await AsyncStorage.setItem("access_token", JSON.stringify({ access_token: "old" }));
  await AsyncStorage.setItem("refresh_token", JSON.stringify({ refresh_token: "r1" }));
  jest.spyOn(axios, "post").mockResolvedValueOnce({
    data: { access_token: "new", refresh_token: "r2" },
  });
  server
    .mockImplementationOnce((config) => reply(config, 401))
    .mockImplementationOnce((config) => reply(config, 200, { ok: true }));

  const response = await api.get("/bookings/me");

  expect(response.data).toEqual({ ok: true });
  expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/users\/refresh$/), {
    refresh_token: "r1",
  });
  expect(server.mock.calls[1][0].headers.Authorization).toBe("Bearer new");
  expect(JSON.parse((await AsyncStorage.getItem("access_token"))!)).toEqual({ access_token: "new" });
  expect(JSON.parse((await AsyncStorage.getItem("refresh_token"))!)).toEqual({ refresh_token: "r2" });
});

it("signs the user out when the refresh fails", async () => {
  await AsyncStorage.setItem("access_token", JSON.stringify({ access_token: "old" }));
  await AsyncStorage.setItem("refresh_token", JSON.stringify({ refresh_token: "expired" }));
  jest.spyOn(axios, "post").mockRejectedValueOnce(new Error("401"));
  server.mockImplementation((config) => reply(config, 401));

  await expect(api.get("/bookings/me")).rejects.toThrow();
  expect(await AsyncStorage.getItem("access_token")).toBeNull();
  expect(await AsyncStorage.getItem("refresh_token")).toBeNull();
  expect(router.replace).toHaveBeenCalledWith("/sign-in");
});

it("signs out without calling refresh when there is no refresh token", async () => {
  const post = jest.spyOn(axios, "post");
  server.mockImplementation((config) => reply(config, 401));
  await expect(api.get("/bookings/me")).rejects.toThrow();
  expect(post).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledWith("/sign-in");
});

it("passes other errors straight through", async () => {
  server.mockImplementation((config) => reply(config, 409, { detail: "Conflict" }));
  await expect(api.get("/bookings/me")).rejects.toMatchObject({ response: { status: 409 } });
  expect(router.replace).not.toHaveBeenCalled();
});
