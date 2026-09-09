import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { getAllCurrencies, getCurrencySymbol } from "../../utils/currency";
import { useThemeStore } from "../../stores/themeStore";

interface Props {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export const CurrencyPicker = ({ visible, selectedCode, onSelect, onClose }: Props) => {
  const { isDark } = useThemeStore();
  const [query, setQuery] = useState("");

  const surface = isDark ? "#1E1E1E" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#1f2937";
  const textSecondary = isDark ? "#a3b2a4" : "#6b7280";
  const inputBg = isDark ? "#2C2C2C" : "#f3f4f6";

  const allCurrencies = useMemo(() => getAllCurrencies(), []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return allCurrencies;
    return allCurrencies.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [query, allCurrencies]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: surface }]} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: textPrimary }]}>Select Currency</Text>

          <View style={[styles.searchRow, { backgroundColor: inputBg }]}>
            <Ionicons name="search" size={16} color={textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by code or name..."
              placeholderTextColor={textSecondary}
              style={[styles.searchInput, { color: textPrimary }]}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.row,
                  item.code === selectedCode && { backgroundColor: `${colors.primary}1A` },
                ]}
                onPress={() => { onSelect(item.code); onClose(); }}
              >
                <Text style={[styles.symbol, { color: colors.primary }]}>
                  {getCurrencySymbol(item.code)}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.code, { color: textPrimary }]}>{item.code}</Text>
                  <Text style={[styles.name, { color: textSecondary }]}>{item.name}</Text>
                </View>
                {item.code === selectedCode && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, height: "80%" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#555", alignSelf: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 12, fontFamily: "RobotoMono-Bold" },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, fontFamily: "RobotoMono-Regular" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  symbol: { fontSize: 18, fontWeight: "700", width: 32, textAlign: "center" },
  code: { fontSize: 15, fontWeight: "700", fontFamily: "RobotoMono-Bold" },
  name: { fontSize: 12, fontFamily: "RobotoMono-Regular" },
});
