// This tab never actually renders its own screen — the tab bar's
// tabPress listener (see (tabs)/_layout.tsx) intercepts the press
// and pushes /bookings instead. This file only exists so expo-router
// has a route to attach the tab to.
export default function BookingsTabPlaceholder() {
  return null;
}
