/**
 * Chat Interface Screen
 * Full-screen conversation with streaming AI response and typing indicator
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Pressable,
  Image,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useAlertStore } from "../stores/alertStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import Markdown from "react-native-markdown-display";
import { colors, spacing, typography, radius, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import { TypingIndicator } from "../components/common/TypingIndicator";
import * as chatApi from "../api/chat";
import { useAuthStore } from "../stores/authStore";
import { ChatMessage } from "../types/chat";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (process.env as any).API_BASE_URL ||
  "http://localhost:5000/api";

interface UiMessage {
  id: string;
  text: string;
  isAI: boolean;
  timestamp: string;
}

const copyText = async (value: string) => {
  try { await Clipboard.setStringAsync(value); } catch { }
};

const AiMsgBubble = ({ msg, themedColors }: { msg: UiMessage; themedColors: any }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);

  const markdownStyle = useMemo(
    () => ({
      body: { color: themedColors.textPrimary, fontFamily: typography.fontFamily.body, fontSize: 16 },
      link: { color: colors.primary },
    }),
    [themedColors]
  );

  return (
    <Animated.View style={[styles.aiBubbleRow, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.aiAvatar, { backgroundColor: colors.surfaceDarkLight }]}>
        <Ionicons name="wallet-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.aiBubbleContent}>
        <Text style={[styles.senderLabel, { color: themedColors.textSecondary }]}>FinanceBot</Text>
        <Pressable onLongPress={() => copyText(msg.text)} delayLongPress={250}>
          <View style={[styles.aiBubble, { backgroundColor: themedColors.surfaceLight }]}>
            <Markdown style={markdownStyle}>{msg.text}</Markdown>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const UserMsgBubble = ({ msg }: { msg: UiMessage }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.userBubbleRow, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.userBubbleContent}>
        <Text style={[styles.senderLabel, { color: colors.gray[500], textAlign: "right" }]}>You</Text>
        <Pressable onLongPress={() => copyText(msg.text)} delayLongPress={250}>
          <View style={styles.userBubble}>
            <Text style={styles.userBubbleText}>{msg.text}</Text>
          </View>
        </Pressable>
      </View>
      <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
        <Text style={styles.userAvatarText}>ME</Text>
      </View>
    </Animated.View>
  );
};

const TypingBubble = ({ themedColors }: { themedColors: any }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.aiBubbleRow, { opacity }]}>
      <View style={[styles.aiAvatar, { backgroundColor: colors.surfaceDarkLight }]}>
        <Ionicons name="wallet-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.aiBubbleContent}>
        <Text style={[styles.senderLabel, { color: themedColors.textSecondary }]}>FinanceBot</Text>
        <View style={[styles.aiBubble, { backgroundColor: themedColors.surfaceLight }]}>
          <TypingIndicator color={colors.primary} size={9} />
        </View>
      </View>
    </Animated.View>
  );
};

const StreamingBubble = ({ text, themedColors }: { text: string; themedColors: any }) => {
  const markdownStyle = useMemo(
    () => ({
      body: { color: themedColors.textPrimary, fontFamily: typography.fontFamily.body, fontSize: 16 },
      link: { color: colors.primary },
    }),
    [themedColors]
  );

  return (
    <View style={styles.aiBubbleRow}>
      <View style={[styles.aiAvatar, { backgroundColor: colors.surfaceDarkLight }]}>
        <Ionicons name="wallet-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.aiBubbleContent}>
        <Text style={[styles.senderLabel, { color: themedColors.textSecondary }]}>FinanceBot</Text>
        <View style={[styles.aiBubble, { backgroundColor: themedColors.surfaceLight }]}>
          <Markdown style={markdownStyle}>{text}</Markdown>
          <View style={styles.cursor} />
        </View>
      </View>
    </View>
  );
};

const ChatInterfaceScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const { showAlert } = useAlertStore();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { conversationId } = route.params as { conversationId: string };

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [title, setTitle] = useState("FinanceBot");
  const [pickedImage, setPickedImage] = useState<{
    uri: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const isBusy = isTyping || streamingText !== null;

  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const toUi = (msg: ChatMessage): UiMessage => ({
    id: msg._id || `m-${Date.now()}-${Math.random()}`,
    text: msg.content,
    isAI: msg.role === "assistant",
    timestamp: fmt(new Date(msg.timestamp)),
  });

  useEffect(() => {
    const load = async () => {
      try {
        const conv = await chatApi.getConversation(conversationId);
        if (conv?.title && conv.title !== "New Chat") setTitle(conv.title);
        if (conv?.messages?.length) {
          setMessages(conv.messages.map(toUi));
        } else {
          setMessages([
            {
              id: "welcome",
              text: "Hi! I'm your AI Financial Coach. Ask me about your spending, budget, or financial goals. You can also attach a photo of a receipt or bank statement.",
              isAI: true,
              timestamp: fmt(new Date()),
            },
          ]);
        }
      } catch { }
    };
    load();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping, streamingText]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert("Permission required", "Allow access to your photo library to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as ImagePicker.MediaType[],
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPickedImage({
        uri: asset.uri,
        base64: asset.base64 ?? "",
        mimeType: asset.mimeType ?? "image/jpeg",
      });
    }
  };

  const handleSend = useCallback(async () => {
    const content = inputText.trim();
    if ((!content && !pickedImage) || isBusy) return;

    const displayText = content || "(Image attached)";
    setInputText("");

    const optimistic: UiMessage = {
      id: `local-${Date.now()}`,
      text: displayText,
      isAI: false,
      timestamp: fmt(new Date()),
    };
    setMessages((prev) => [...prev, optimistic]);
    setIsTyping(true);

    const imageBase64 = pickedImage?.base64;
    const imageMimeType = pickedImage?.mimeType;
    setPickedImage(null);

    // Prefer streaming; fall back to regular request if streaming is unsupported
    const token = useAuthStore.getState().accessToken;
    let usedStreaming = false;

    try {
      const response = await fetch(`${API_BASE}/chat/message-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: displayText, conversationId }),
      });

      if (!response.ok || !response.body) throw new Error("Stream unavailable");

      usedStreaming = true;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const line = event.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const dataStr = line.slice(6).trim();
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.delta) {
              accumulated += parsed.delta;
              if (firstChunk) {
                setIsTyping(false);
                firstChunk = false;
              }
              setStreamingText(accumulated);
            }
            if (parsed.done) break;
            if (parsed.error) throw new Error(parsed.error);
          } catch { }
        }
      }

      // Finalize the streaming message
      const finalMsg: UiMessage = {
        id: `ai-${Date.now()}`,
        text: accumulated || "I apologize, I could not generate a response.",
        isAI: true,
        timestamp: fmt(new Date()),
      };
      setMessages((prev) => [...prev, finalMsg]);
      setStreamingText(null);
      setIsTyping(false);

      // Refresh title if needed
      try {
        const updated = await chatApi.getConversation(conversationId);
        if (updated?.title && updated.title !== "New Chat") setTitle(updated.title);
      } catch { }
    } catch {
      if (usedStreaming) {
        setStreamingText(null);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            text: "I'm having trouble connecting. Please try again.",
            isAI: true,
            timestamp: "",
          },
        ]);
        return;
      }

      // Fallback: use regular (non-streaming) endpoint
      try {
        const res = await chatApi.sendMessage({
          content: displayText,
          conversationId,
          imageBase64,
          imageMimeType,
        });
        try {
          const updated = await chatApi.getConversation(conversationId);
          if (updated?.title && updated.title !== "New Chat") setTitle(updated.title);
        } catch { }
        setMessages((prev) => [...prev, toUi(res.message)]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            text: "I'm having trouble connecting. Please try again.",
            isAI: true,
            timestamp: "",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }
  }, [inputText, pickedImage, conversationId, isBusy]);

  const canSend = (!!inputText.trim() || !!pickedImage) && !isBusy;

  return (
    <ScreenContainer
      backgroundColor={themedColors.background}
      withKeyboardAvoidingView={Platform.OS === "ios"}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: themedColors.border, backgroundColor: themedColors.background },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themedColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.onlineText, { color: themedColors.textSecondary }]}>
              {isBusy ? "Thinking…" : "Online"}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) =>
          msg.isAI ? (
            <AiMsgBubble key={msg.id} msg={msg} themedColors={themedColors} />
          ) : (
            <UserMsgBubble key={msg.id} msg={msg} />
          )
        )}

        {/* Typing indicator — shows while waiting for first chunk */}
        {isTyping && <TypingBubble themedColors={themedColors} />}

        {/* Streaming bubble — replaces typing indicator as chunks arrive */}
        {streamingText !== null && (
          <StreamingBubble text={streamingText} themedColors={themedColors} />
        )}
      </ScrollView>

      {/* Input area */}
      <View
        style={[
          styles.inputArea,
          {
            backgroundColor: themedColors.background,
            borderTopColor: themedColors.border,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
      >
        {pickedImage && (
          <View style={styles.imagePreviewRow}>
            <Image source={{ uri: pickedImage.uri }} style={styles.imageThumb} />
            <TouchableOpacity onPress={() => setPickedImage(null)}>
              <Ionicons name="close-circle" size={20} color={colors.error} />
            </TouchableOpacity>
            <Text style={[styles.imageLabel, { color: themedColors.textSecondary }]}>
              Image attached
            </Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity onPress={handlePickImage} style={styles.imageBtn} disabled={isBusy}>
            <Ionicons name="image-outline" size={24} color={isBusy ? themedColors.border : themedColors.textSecondary} />
          </TouchableOpacity>

          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: themedColors.surface, borderColor: themedColors.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: themedColors.textPrimary }]}
              placeholder={isBusy ? "FinanceBot is thinking…" : "Ask about your finances..."}
              placeholderTextColor={themedColors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isBusy}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, { opacity: canSend ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!canSend}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", fontFamily: typography.fontFamily.display },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 11 },
  messages: { flex: 1 },
  messagesContent: { padding: spacing.md, paddingBottom: 20, gap: spacing.md },
  aiBubbleRow: { flexDirection: "row", gap: 10, paddingRight: 40 },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginTop: "auto",
  },
  aiBubbleContent: { flex: 1, gap: 4 },
  senderLabel: { fontSize: 12, marginLeft: 4 },
  aiBubble: { padding: 12, borderRadius: radius.xl, borderBottomLeftRadius: 4 },
  cursor: {
    width: 2,
    height: 16,
    backgroundColor: colors.primary,
    borderRadius: 1,
    marginTop: 2,
    opacity: 0.7,
  },
  userBubbleRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, paddingLeft: 40 },
  userBubbleContent: { flex: 1, alignItems: "flex-end", gap: 4 },
  userBubble: {
    backgroundColor: colors.primary, padding: 12,
    borderRadius: radius.xl, borderBottomRightRadius: 4,
  },
  userBubbleText: { color: "#fff", fontSize: 16 },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", marginTop: "auto",
  },
  userAvatarText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  inputArea: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1 },
  imagePreviewRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  imageThumb: { width: 48, height: 48, borderRadius: radius.lg },
  imageLabel: { fontSize: 12 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  imageBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  inputWrapper: {
    flex: 1, minHeight: 44, borderRadius: 22, borderWidth: 1,
    paddingHorizontal: 16, justifyContent: "center",
  },
  input: { fontSize: 16, maxHeight: 100, paddingVertical: 8 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
  },
});

export default ChatInterfaceScreen;
