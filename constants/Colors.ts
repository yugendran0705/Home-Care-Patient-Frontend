const tintColorLight = "#369BFF"; // Primary App Blue
const tintColorDark = "#363636";

export const Colors = {
  light: {
    // Primary & Accent
    primary: tintColorLight,
    primaryBackground: "rgba(54, 155, 255, 0.8)",
    accent: tintColorLight,
    tint: tintColorLight,

    // Backgrounds
    background: "#5A189A",
    secondaryBackground: "#9D4EDD",
    secondaryBackgroundGradient: "#9d4edd8e",

    // Semantics
    error: "#EF4444", // Tailwind red-500
    success: "#4CD964", // Verified green
    warning: "#FF9500", // Unverified orange

    // not used
    // Surfaces (Inputs, Cards)
    surface: "#F0F5FA", // Input backgrounds & light cards
    surfaceSecondary: "#FFFFFF", // Pure white forms

    // Text
    text: "#000000",
    textPrimary: "#FFFFFF99",
    textSecondary: "#646982", // Subtitles / Muted text
    textInverted: "#F7FAFC",
    textMutedInverted: "rgba(255, 255, 255, 0.7)", // white/70

    // Icons
    icon: "#646982",
    tabIconDefault: "#646982",
    tabIconSelected: tintColorLight,

    cursorColor: "#000000",
  },

  dark: {
    // Primary & Accent
    primary: tintColorDark,
    primaryBackground: tintColorDark,
    accent: tintColorLight,
    tint: tintColorDark,

    // Backgrounds
    background: "#5A189A",
    // Card
    secondaryBackground: "#9D4EDD",
    secondaryBackgroundGradient: "#b374e6",

    // Semantics
    error: "#e26767",
    success: "#4CD964",
    warning: "#FF9500",

    // not used
    // Surfaces (Inputs, Cards)
    surface: "#2A2A2A", // Dark mode cards/badges
    surfaceSecondary: "#1A1A1A", // Darker surface

    // Text
    text: "#ffffff",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textInverted: "#F7FAFC", // Dark text on light elements
    textMutedInverted: "rgba(255, 255, 255, 0.7)",

    // Icons
    icon: "rgba(255, 255, 255, 0.7)",
    tabIconSelected: tintColorDark,

    cursorColor: "#ffffff",

    inputBackground: "#F0F5FA",
  },
};
