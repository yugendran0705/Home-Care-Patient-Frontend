import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { PURPLE_DARK } from "@/constants/serviceTheme";
import { Modal, Pressable, StyleSheet, useColorScheme, View } from "react-native";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onRequestClose: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons,
  onRequestClose,
}: CustomAlertProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onRequestClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.45)",
          paddingHorizontal: 32,
        }}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onRequestClose}
        />

        <View
          style={{
            width: "100%",
            maxWidth: 340,
            borderRadius: 24,
            backgroundColor: colors.background,
            padding: 24,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
          }}
        >
          <ThemedText
            type="subtitle"
            style={{
              color: colors.text,
              fontSize: 18,
              marginBottom: message ? 8 : 20,
            }}
          >
            {title}
          </ThemedText>

          {message ? (
            <ThemedText
              type="default"
              style={{
                color: colors.textSecondary,
                marginBottom: 24,
                lineHeight: 21,
              }}
            >
              {message}
            </ThemedText>
          ) : null}

          {buttons.length > 2 ? (
            // Longer/more options (e.g. a plan picker) read better as a
            // stacked list than crammed into one row.
            <View>
              {buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  onPress={() => {
                    onRequestClose();
                    button.onPress?.();
                  }}
                  style={{
                    paddingVertical: 14,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.secondaryBackground,
                  }}
                >
                  <ThemedText
                    type="defaultBold"
                    style={{
                      textAlign: "center",
                      color:
                        button.style === "destructive"
                          ? colors.error
                          : button.style === "cancel"
                            ? colors.textSecondary
                            : PURPLE_DARK,
                    }}
                  >
                    {button.text}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 20,
              }}
            >
              {buttons.map((button, index) => (
                <Pressable
                  key={`${button.text}-${index}`}
                  hitSlop={10}
                  onPress={() => {
                    onRequestClose();
                    button.onPress?.();
                  }}
                >
                  <ThemedText
                    type="defaultBold"
                    style={{
                      color:
                        button.style === "destructive"
                          ? colors.error
                          : button.style === "cancel"
                            ? colors.textSecondary
                            : PURPLE_DARK,
                    }}
                  >
                    {button.text}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
