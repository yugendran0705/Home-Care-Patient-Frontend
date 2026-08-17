import {
  Bandage,
  BedDouble,
  Droplet,
  HeartHandshake,
  HeartPulse,
  Pill,
  Stethoscope,
  Syringe,
  Wind,
} from "lucide-react-native";

// Services have no icon/image field from the API, so icons are cycled by
// array index. Any screen showing services should derive its icon from this
// same array using the same `services` ordering (as returned by `useServices`)
// so the same service keeps the same icon across screens.
export const SERVICE_ICONS = [
  Syringe,
  Bandage,
  Droplet,
  HeartPulse,
  BedDouble,
  Stethoscope,
  Wind,
  Pill,
  HeartHandshake,
];

export function iconForIndex(index: number) {
  return SERVICE_ICONS[index % SERVICE_ICONS.length];
}

export const PURPLE = "#7C6FF0";
export const PURPLE_DARK = "#5B4FE0";
export const PURPLE_DEEP = "#4C3FCB";
export const PURPLE_SOFT = "#F1EEFF";

// The API serializes prices as decimal strings (e.g. "500.00"), which
// overflows small UI like service cards if rendered as-is. Drop the
// trailing zeros for whole amounts, keep decimals only when meaningful.
export function formatPrice(price: number | string): string {
  const value = typeof price === "string" ? parseFloat(price) : price;
  if (Number.isNaN(value)) return String(price);
  return value % 1 === 0 ? String(value) : value.toFixed(2);
}

// duration_type from the API is "hour" or "days" (singular/plural
// inconsistent), so normalize to the correct plural form for display.
export function formatDuration(duration: number, durationType: string): string {
  const unit = durationType.replace(/s$/, "");
  return `${duration} ${unit}${duration === 1 ? "" : "s"}`;
}

// Some services are duration/plan variants of the same underlying
// service, distinguished only by a parenthetical suffix in the name
// (e.g. "Wound Dressing" / "Wound Dressing(1 Week)"). Splitting this out
// lets the UI group those variants under one card.
export function splitServiceVariantName(name: string): {
  baseName: string;
  variantLabel: string | null;
} {
  const match = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { baseName: match[1].trim(), variantLabel: match[2].trim() };
  }
  return { baseName: name.trim(), variantLabel: null };
}

// Shared color treatment for booking/payment status pills (Confirmed,
// Cancelled, Paid, Failed, Pending, ...) so bookings/payment UI stays
// visually consistent without each screen inventing its own palette.
export function statusPalette(status: string): { bg: string; fg: string } {
  switch (status) {
    case "Confirmed":
    case "Success":
    case "Paid":
    case "Completed":
      return { bg: "#E7F9EE", fg: "#1B9E52" };
    case "Cancelled":
    case "Failed":
      return { bg: "#FDECEC", fg: "#D93C31" };
    case "Pending":
    case "Unpaid":
      return { bg: "#FFF4E0", fg: "#B76E00" };
    default:
      return { bg: PURPLE_SOFT, fg: PURPLE_DEEP };
  }
}
