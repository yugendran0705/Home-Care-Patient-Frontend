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
// array index. Any screen showing a service must derive its icon from this
// same array against the same full, unfiltered `services` order so the
// same service always gets the same icon across screens.
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
