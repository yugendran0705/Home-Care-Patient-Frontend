// Shared test setup: no real storage, navigation or network in unit tests.
jest.mock("@react-native-async-storage/async-storage", () =>
  // jest.mock factories are hoisted above imports, so they must use require().
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

// Hooks and components call the API through this instance; tests set the
// responses per case. The interceptor tests in __tests__/axiosInstance.test.ts
// use the real module via jest.requireActual.
jest.mock("@/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));
