import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "title"
    | "heading"
    | "subtitle"
    | "default"
    | "defaultBold"
    | "small"
    | "smallBold"
    | "caption"
    | "captionBold"
    | "link";
};

const BOLD = "Sen-Bold";
const REGULAR = "Sen-Regular";

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "title" ? styles.title : undefined,
        type === "heading" ? styles.heading : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "default" ? styles.default : undefined,
        type === "defaultBold" ? styles.defaultBold : undefined,
        type === "small" ? styles.small : undefined,
        type === "smallBold" ? styles.smallBold : undefined,
        type === "caption" ? styles.caption : undefined,
        type === "captionBold" ? styles.captionBold : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: BOLD,
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: BOLD,
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: BOLD,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: REGULAR,
  },
  defaultBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: BOLD,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: REGULAR,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: BOLD,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: REGULAR,
  },
  captionBold: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: BOLD,
  },
  link: {
    fontSize: 16,
    lineHeight: 30,
    fontFamily: REGULAR,
    color: "#0a7ea4",
  },
});
