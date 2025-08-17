// components/TagBox.tsx
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { mockChartData } from "../mock/mockChartData";
import TagSelectModal from "./TagSelectModal";

type TagBoxProps = {
  title: string;
  onEdit?: (newTitle: string) => void;
  onDelete?: () => void;
};

export default function TagBox({ title, onEdit, onDelete }: TagBoxProps) {
  const [boxTitle, setBoxTitle] = useState(title);
  const [editing, setEditing] = useState(false);

  const [tag, setTag] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const value = tag ? mockChartData[tag]?.values?.slice(-1)[0] ?? "-" : "-";

  return (
    <>
      <Pressable style={styles.box} onPress={() => setModalVisible(true)}>
        {/* Header */}
        <View style={styles.headerRow}>
          {editing ? (
            <TextInput
              value={boxTitle}
              onChangeText={setBoxTitle}
              onBlur={() => {
                setEditing(false);
                onEdit?.(boxTitle); // dışarıya bildir
              }}
              autoFocus
              style={styles.titleInput}
              placeholder="Başlık gir"
              placeholderTextColor="#64748B"
            />
          ) : (
            <Text style={styles.title}>{boxTitle}</Text>
          )}

          <View style={styles.iconRow}>
            {/* Düzenleme ikonu */}
            <Pressable
              onPress={() => setEditing(true)}
              style={styles.iconButton}
            >
              <Feather name="edit-2" size={14} color="#93C5FD" />
            </Pressable>

            {/* Tag silme ikonu */}
            {tag && (
              <Pressable
                onPress={() => setTag(null)}
                style={styles.iconButton}
              >
                <Feather name="trash-2" size={14} color="#F87171" />
              </Pressable>
            )}

            {/* Kutu silme ikonu */}
            {onDelete && (
              <Pressable
                onPress={onDelete}
                style={styles.iconButton}
              >
                <Feather name="x" size={16} color="#F87171" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Value + tag */}
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          {tag && <Text style={styles.tagLabel}>{tag}</Text>}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Feather name="tag" size={12} color="#94A3B8" />
          <Text style={styles.footerText}>tag</Text>
        </View>
      </Pressable>

      {/* Tag seçim modalı */}
      <TagSelectModal
        visible={modalVisible}
        tags={Object.keys(mockChartData)}
        onClose={() => setModalVisible(false)}
        onSelect={(t) => {
          setTag(t);
          setModalVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: "rgba(30,41,59,0.65)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
    padding: 10,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E0F2FE",
    flexShrink: 1,
  },
  titleInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#E0F2FE",
    padding: 0,
    margin: 0,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    color: "#7DD3FC",
  },
  tagLabel: {
    fontSize: 12,
    color: "#A5B4FC",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  footerText: {
    fontSize: 11,
    color: "#94A3B8",
    marginLeft: 4,
  },
});
