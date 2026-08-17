import CustomAlert, { AlertButton } from "@/components/CustomAlert";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type ShowAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => void;

const AlertContext = createContext<ShowAlert | null>(null);

const DEFAULT_STATE: AlertState = { visible: false, title: "", buttons: [] };

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AlertState>(DEFAULT_STATE);

  const showAlert = useCallback<ShowAlert>(
    (title, message, buttons = [{ text: "OK" }]) => {
      setState({ visible: true, title, message, buttons });
    },
    [],
  );

  const close = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      <CustomAlert
        visible={state.visible}
        title={state.title}
        message={state.message}
        buttons={state.buttons}
        onRequestClose={close}
      />
    </AlertContext.Provider>
  );
}

// Drop-in replacement for React Native's `Alert.alert(title, message, buttons)`,
// styled to match the app instead of the OS default dialog.
export function useAlert(): ShowAlert {
  const showAlert = useContext(AlertContext);
  if (!showAlert) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return showAlert;
}
