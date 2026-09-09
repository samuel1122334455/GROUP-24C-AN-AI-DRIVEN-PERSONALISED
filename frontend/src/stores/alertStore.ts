import { create } from "zustand";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: "",
  message: undefined,
  buttons: [],
  showAlert: (title, message, buttons) =>
    set({ visible: true, title, message, buttons: buttons ?? [{ text: "OK" }] }),
  hideAlert: () => set({ visible: false }),
}));
