/**
 * Navigation Type Definitions
 */

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps } from "@react-navigation/native";

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TransactionDetail: { transactionId: string };
  LogTransaction: { prefill?: { description?: string; amount?: number } } | undefined;
  AllTransactions: undefined;
  ScanReceipt: undefined;
  ChatInterface: { conversationId: string };
  Onboarding: undefined;
  WeeklyReport: { reportId: string };
  Notifications: undefined;
  NotificationDetail: { notificationId: string };
};

export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabParamList = {
  Dashboard: undefined;
  ChatHistory: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
