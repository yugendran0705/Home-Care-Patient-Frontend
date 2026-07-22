const tintColorLight = "#369BFF"; // Primary App Blue
const tintColorDark = "#363636";

export const Colors = {
  light: {
    // Primary & Accent
    primary: tintColorDark,
    primaryBackground: tintColorDark,
    accent: tintColorLight,
    tint: tintColorDark,

    // Backgrounds
    background: "#023E7D",
    // Card
    secondaryBackground: "#0466C8",
    secondaryBackgroundGradient: "#70a6dd",

    // Semantics
    error: "#e26767",
    success: "#4CD964",
    warning: "#FF9500",

    gold: "#FFC83D",

    // not used
    // Surfaces (Inputs, Cards)
    surface: "#2A2A2A", // Dark mode cards/badges
    surfaceSecondary: "#1A1A1A", // Darker surface

    // Text
    text: "#ffffff",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textPrimary: "#111827",
    textInverted: "#F7FAFC", // Dark text on light elements
    textMutedInverted: "rgba(255, 255, 255, 0.7)",

    // Icons
    icon: "rgba(255, 255, 255, 0.7)",
    tabIconSelected: tintColorDark,

    cursorColor: "#ffffff",

    inputBackground: "#F0F5FA",
  },

  dark: {
    // Primary & Accent
    primary: "#7C6FF0", // hero gradient start / icon tint / "View All" links
    primaryBackground: "#5B4FE0", // hero gradient end / "Book Now" button
    accent: "#F5A623", // star ratings, highlight badges
    tint: "#7C6FF0",

    // Backgrounds
    background: "#FFFFFF",
    // Card
    secondaryBackground: "#F7F6FB", // nurse card / search bar / icon buttons
    secondaryBackgroundGradient: "#EDE9FE", // service icon circle bg (light purple)

    // Semantics
    error: "#f06c6c",
    success: "#4CD964",
    warning: "#FF9500",

    gold: "#F5A623",
    // not used
    // Surfaces (Inputs, Cards)
    surface: "#F7F6FB", // light card surface, matches nurse card bg
    surfaceSecondary: "#EDE9FE", // secondary light surface (icon chips)

    // Text
    text: "#111111",
    textSecondary: "rgba(17, 17, 17, 0.6)",
    textPrimary: "#111827",
    textInverted: "#FFFFFF", // text on purple/dark elements (Book Now button, hero copy)
    textMutedInverted: "rgba(255, 255, 255, 0.75)",

    // Icons
    icon: "#7C6FF0",
    tabIconSelected: "#7C6FF0",

    cursorColor: "#7C6FF0",

    inputBackground: "#F7F6FB",
  },
};
