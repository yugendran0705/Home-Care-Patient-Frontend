import { HStack } from "@/components/ui/hstack";
import { CloseIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { PURPLE_DARK } from "@/constants/serviceTheme";
import { Mic, SearchIcon } from "lucide-react-native";
import React from "react";
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
          placeholder={placeholder}
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
        style={{ backgroundColor: PURPLE_DARK }}
      >
        <Mic size={20} color="#fff" />
      </Pressable>
    </HStack>
  );
};

export default ServiceSearchBar;
