import { HStack } from "@/components/ui/hstack";
import { CloseIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { PURPLE_DARK } from "@/constants/serviceTheme";
import { useAlert } from "@/hooks/useAlert";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { Mic, SearchIcon, Square } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable } from "react-native";

interface ServiceSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  colors: {
    secondaryBackground: string;
    text: string;
    textSecondary: string;
  };
  placeholder?: string;
}

const ServiceSearchBar: React.FC<ServiceSearchBarProps> = ({
  value,
  onChangeText,
  colors,
  placeholder = "Search for nursing services...",
}) => {
  const showAlert = useAlert();
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript && event.isFinal) {
      onChangeText(transcript);
    }
  });
  useSpeechRecognitionEvent("error", (event) => {
    setIsListening(false);
    if (event.error === "not-allowed") {
      showAlert(
        "Microphone Access Needed",
        "Please allow microphone and speech recognition access to search by voice.",
      );
    }
  });

  const handleMicPress = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      showAlert(
        "Microphone Access Needed",
        "Please allow microphone and speech recognition access to search by voice.",
      );
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
    });
  };

  return (
    <HStack space="sm" className="items-center">
      <Input
        style={{ backgroundColor: colors.secondaryBackground }}
        className="rounded-xl h-14 pl-4 pr-4 border-0 flex-1"
        size="lg"
      >
        <InputSlot>
          <InputIcon as={SearchIcon} color={colors.text} />
        </InputSlot>
        <InputField
          style={{
            fontFamily: "Sen-Regular",
            color: colors.text,
          }}
          className="text-md"
          placeholder={isListening ? "Listening..." : placeholder}
          placeholderTextColor={colors.textSecondary}
          cursorColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
        />
        {value.length > 0 && (
          <InputSlot onPress={() => onChangeText("")}>
            <InputIcon size="2xs" as={CloseIcon} color={colors.text} />
          </InputSlot>
        )}
      </Input>

      <Pressable
        className="p-4 rounded-xl items-center justify-center"
        style={{ backgroundColor: isListening ? "#E8483C" : PURPLE_DARK }}
        onPress={handleMicPress}
      >
        {isListening ? (
          <Square size={20} color="#fff" fill="#fff" />
        ) : (
          <Mic size={20} color="#fff" />
        )}
      </Pressable>
    </HStack>
  );
};

export default ServiceSearchBar;
