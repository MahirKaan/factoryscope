// components/TagSelectModal.tsx
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  tags: string[];
  onClose: () => void;
  onSelect: (tag: string) => void;
};

export default function TagSelectModal({ visible, tags, onClose, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filteredTags = tags.filter((t) =>
    t.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bir Tag Seç</Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color="#E0F2FE" />
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tag ara..."
              placeholderTextColor="#64748B"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* Tag listesi */}
          <FlatList
            data={filteredTags}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.tagItem,
                  pressed && { backgroundColor: "rgba(59,130,246,0.15)" },
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Feather name="tag" size={16} color="#60A5FA" />
                <Text style={styles.tagText}>{item}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={{ color: "#94A3B8", textAlign: "center", marginTop: 20 }}>
                Tag bulunamadı
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "#0B1120",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { color: "#E0F2FE", fontSize: 16, fontWeight: "700" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(30,41,59,0.8)",
    borderRadius: 10,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 36,
    color: "#E0F2FE",
    fontSize: 14,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.15)",
  },
  tagText: { color: "#BAE6FD", fontSize: 14, fontWeight: "500" },
});
