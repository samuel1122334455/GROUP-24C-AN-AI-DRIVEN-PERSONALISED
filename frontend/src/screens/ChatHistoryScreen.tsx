/**
 * Chat History Screen
 * Lists all conversations with new chat button
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAlertStore } from "../stores/alertStore";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { formatDistanceToNow } from "date-fns";
import { colors, spacing, typography, radius, useThemedColors } from "../theme";
import { ScreenContainer } from "../components/common/ScreenContainer";
import * as chatApi from "../api/chat";
import { ConversationSummary } from "../types/chat";

const ChatHistoryScreen = () => {
  const themedColors = useThemedColors();
  const navigation = useNavigation<any>();
  const { showAlert } = useAlertStore();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await chatApi.listConversations();
      setConversations(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNewChat = async () => {
    try {
      const conv = await chatApi.createConversation();
      navigation.navigate("ChatInterface", { conversationId: conv._id });
    } catch {
      showAlert("Error", "Could not start a new chat. Please try again.");
    }
  };

  const handleOpen = (conv: ConversationSummary) => {
    navigation.navigate("ChatInterface", { conversationId: conv._id });
  };

  return (
    <ScreenContainer backgroundColor={themedColors.background} withKeyboardAvoidingView={false}>
      <View style={[styles.header, { borderBottomColor: themedColors.border }]}>
        <Text style={[styles.title, { color: themedColors.textPrimary }]}>Coach</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewChat}>
          <Ionicons name="add" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: themedColors.border }]} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={56} color={themedColors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: themedColors.textPrimary }]}>
                No conversations yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: themedColors.textSecondary }]}>
                Tap + to start your first chat with your financial coach.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: themedColors.surface }]}
            onPress={() => handleOpen(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}22` }]}>
              <Ionicons name="chatbubble-ellipses" size={22} color={colors.primary} />
            </View>
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text style={[styles.rowTitle, { color: themedColors.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.rowTime, { color: themedColors.textSecondary }]}>
                  {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                </Text>
              </View>
              {item.lastMessage && (
                <Text style={[styles.rowPreview, { color: themedColors.textSecondary }]} numberOfLines={1}>
                  {item.lastMessage.role === "assistant" ? "🤖 " : "You: "}
                  {item.lastMessage.content}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={themedColors.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontWeight: "700", fontFamily: typography.fontFamily.display },
  newButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  list: { flexGrow: 1, paddingBottom: 80 },
  separator: { height: 1, marginLeft: 80 },
  row: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  rowContent: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowTitle: { fontSize: 15, fontWeight: "600", flex: 1 },
  rowTime: { fontSize: 12, marginLeft: 8 },
  rowPreview: { fontSize: 13 },
  empty: {
    flex: 1, alignItems: "center", justifyContent: "center",
    gap: 12, paddingTop: 80, paddingHorizontal: spacing.xl,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});

export default ChatHistoryScreen;
