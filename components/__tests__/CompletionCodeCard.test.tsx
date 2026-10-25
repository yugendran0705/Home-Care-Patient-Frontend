import axiosInstance from "@/axiosInstance";
import { AlertProvider } from "@/hooks/useAlert";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import CompletionCodeCard from "../CompletionCodeCard";

const api = axiosInstance as jest.Mocked<typeof axiosInstance>;
const colors = { text: "#000", textSecondary: "#666", error: "#f00" };

const renderCard = (props: Partial<React.ComponentProps<typeof CompletionCodeCard>> = {}) => {
  const onStale = jest.fn();
  render(
    <AlertProvider>
      <CompletionCodeCard bookingId="visit-1" colors={colors} onStale={onStale} {...props} />
    </AlertProvider>,
  );
  return { onStale };
};

const expectDigits = async (code: string) => {
  for (const digit of new Set(code.split(""))) {
    expect((await screen.findAllByText(digit)).length).toBeGreaterThan(0);
  }
};

beforeEach(() => jest.clearAllMocks());

it("loads the code straight away for a continuous booking", async () => {
  api.get.mockResolvedValueOnce({ data: { completion_otp: "482913" } });
  renderCard();
  await expectDigits("482913");
  expect(api.get).toHaveBeenCalledWith("/bookings/visit-1/completion-otp");
});

it("waits for a tap before loading a shift's code", async () => {
  api.get.mockResolvedValueOnce({ data: { completion_otp: "111111" } });
  renderCard({ revealOnMount: false });
  expect(api.get).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText("Show Code"));
  await expectDigits("111111");
});

it("tells the screen to refresh when the booking is no longer confirmed", async () => {
  api.get.mockRejectedValueOnce({
    response: { status: 409, data: { detail: "Booking is 'Completed'; a handover code applies only while a booking is Confirmed." } },
  });
  const { onStale } = renderCard();
  expect(await screen.findByText(/a handover code applies only while/)).toBeTruthy();
  expect(onStale).toHaveBeenCalled();
});

it("offers a retry after a network error", async () => {
  api.get.mockRejectedValueOnce(new Error("Network Error"));
  api.get.mockResolvedValueOnce({ data: { completion_otp: "222222" } });
  renderCard();
  expect(await screen.findByText("Couldn't load the completion code. Please try again.")).toBeTruthy();
  fireEvent.press(screen.getByText("Retry"));
  await expectDigits("222222");
});

it("gets a new code only after the patient confirms", async () => {
  api.get.mockResolvedValueOnce({ data: { completion_otp: "333333" } });
  api.post.mockResolvedValueOnce({ data: { completion_otp: "444444" } });
  renderCard();
  await expectDigits("333333");

  fireEvent.press(screen.getByText("Nurse locked out? Get a new code"));
  expect(await screen.findByText("Get a new code?")).toBeTruthy();
  expect(api.post).not.toHaveBeenCalled();

  fireEvent.press(screen.getByText("Get New Code"));
  await waitFor(() =>
    expect(api.post).toHaveBeenCalledWith("/bookings/visit-1/completion-otp/regenerate"),
  );
  await expectDigits("444444");
});
