import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

// This tab never actually renders its own screen — the tab bar's
// tabPress listener (see (tabs)/_layout.tsx) intercepts the press
// and pushes /services instead. This file only exists so expo-router
// has a route to attach the tab to.
export default function SearchTabPlaceholder() {
  useFocusEffect(
    useCallback(() => {
      // no-op: navigation is handled by the tabPress listener
    }, []),
  );
  return null;
}
