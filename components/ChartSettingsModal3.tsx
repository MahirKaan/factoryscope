import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type TagOption = { label: string; value: string };

export type ChartConfig = {
  tags: string[];
  startTime: string; // ISO string
  endTime: string;   // ISO string
  freq: number;      // seconds
  sampleType: string;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  tagOptions: TagOption[];
  editData: ChartConfig | null;
  onSave: (data: ChartConfig) => void;
}

const FREQ_OPTIONS = [300, 600, 900, 1800, 3600];
const SAMPLE_TYPES = ["raw", "avg", "min", "max", "sum"];

const toISOLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();

const ChartSettingsModal3: React.FC<Props> = ({
  visible,
  onClose,
  tagOptions,
  editData,
  onSave,
}) => {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date>(() => new Date(Date.now() + 60 * 60 * 1000));
  const [freq, setFreq] = useState<number>(FREQ_OPTIONS[0]);
  const [sampleType, setSampleType] = useState<string>(SAMPLE_TYPES[0]);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // editData geldiğinde alanları doldur
  useEffect(() => {
    if (visible && editData) {
      setSelectedTags(editData.tags ?? []);
      setStartDate(editData.startTime ? new Date(editData.startTime) : new Date());
      setEndDate(editData.endTime ? new Date(editData.endTime) : new Date());
      setFreq(editData.freq ?? FREQ_OPTIONS[0]);
      setSampleType(editData.sampleType ?? SAMPLE_TYPES[0]);
    }
    if (visible && !editData) {
      // yeni kayıt için varsayılanları ata
      setSelectedTags([]);
      const now = new Date();
      setStartDate(now);
      setEndDate(new Date(now.getTime() + 60 * 60 * 1000));
      setFreq(FREQ_OPTIONS[0]);
      setSampleType(SAMPLE_TYPES[0]);
    }
  }, [visible, editData]);

  const filteredOptions = useMemo(
    () =>
      tagOptions.filter(
        (t) =>
          t.label.toLowerCase().includes(search.toLowerCase()) ||
          t.value.toLowerCase().includes(search.toLowerCase())
      ),
    [tagOptions, search]
  );

  const toggleTag = (val: string) => {
    setSelectedTags((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const removeTag = (val: string) => {
    setSelectedTags((prev) => prev.filter((v) => v !== val));
  };

  const handleSave = () => {
    // Basit validasyonlar
    if (!selectedTags.length) {
      alert("En az bir tag seçmelisin.");
      return;
    }
    if (!sampleType) {
      alert("Sample type zorunludur.");
      return;
    }
    if (endDate <= startDate) {
      alert("End time, start time'dan sonra olmalı.");
      return;
    }

    const payload: ChartConfig = {
      tags: selectedTags,
      startTime: toISOLocal(startDate),
      endTime: toISOLocal(endDate),
      freq,
      sampleType,
    };
    onSave(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{editData ? "Edit Chart" : "Create Chart"}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Tag Search */}
            <Text style={styles.sectionLabel}>Tags</Text>
            <TextInput
              placeholder="Search tags..."
              placeholderTextColor="#999"
              style={styles.search}
              value={search}
              onChangeText={setSearch}
            />
            <View style={styles.optionList}>
              {filteredOptions.slice(0, 50).map((opt) => {
                const active = selectedTags.includes(opt.value);
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => toggleTag(opt.value)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected tags */}
            {!!selectedTags.length && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Selected</Text>
                <View style={styles.selectedList}>
                  {selectedTags.map((t) => (
                    <View key={t} style={styles.selectedItem}>
                      <Text style={styles.selectedText}>{t}</Text>
                      <TouchableOpacity onPress={() => removeTag(t)}>
                        <Text style={styles.remove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Date / Time */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Start / End</Text>
            <View style={styles.datetimeRow}>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                style={styles.datetimeBtn}
              >
                <Text style={styles.datetimeLabel}>Start</Text>
                <Text style={styles.datetimeVal}>
                  {startDate.toLocaleString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.datetimeBtn}>
                <Text style={styles.datetimeLabel}>End</Text>
                <Text style={styles.datetimeVal}>
                  {endDate.toLocaleString()}
                </Text>
              </TouchableOpacity>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                onChange={(_evt, date) => {
                  setShowStartPicker(Platform.OS === "ios"); // iOS'ta açık kalır
                  if (date) setStartDate(date);
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                onChange={(_evt, date) => {
                  setShowEndPicker(Platform.OS === "ios");
                  if (date) setEndDate(date);
                }}
              />
            )}

            {/* Frequency */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Frequency (sec)</Text>
            <View style={styles.optionList}>
              {FREQ_OPTIONS.map((f) => {
                const active = f === freq;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFreq(f)}
                    style={[styles.box, active && styles.boxActive]}
                  >
                    <Text style={[styles.boxText, active && styles.boxTextActive]}>{f}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sample Type */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Sample Type</Text>
            <View style={styles.optionList}>
              {SAMPLE_TYPES.map((s) => {
                const active = s === sampleType;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSampleType(s)}
                    style={[styles.box, active && styles.boxActive]}
                  >
                    <Text style={[styles.boxText, active && styles.boxTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.btn, styles.btnPrimary]}>
              <Text style={styles.btnPrimaryText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ChartSettingsModal3;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#0f1115",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: "88%",
    paddingBottom: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomColor: "#1c1f27",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  close: { color: "#bbb", fontSize: 20, padding: 4 },

  sectionLabel: {
    color: "#c9d1d9",
    fontSize: 13,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  search: {
    backgroundColor: "#151821",
    borderColor: "#222635",
    borderWidth: 1,
    color: "#e6edf3",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 16,
  },
  optionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#151821",
    borderColor: "#222635",
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: "#2442ff22",
    borderColor: "#3e5bff",
  },
  pillText: { color: "#c7cfdb", fontSize: 13 },
  pillTextActive: { color: "#dbe2ff", fontWeight: "600" },

  selectedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1a1f2b",
    borderColor: "#2b3245",
    borderWidth: 1,
  },
  selectedText: { color: "#c7cfdb", fontSize: 12 },
  remove: { color: "#9aa4bf", fontSize: 12 },

  datetimeRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  datetimeBtn: {
    flex: 1,
    backgroundColor: "#151821",
    borderColor: "#222635",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  datetimeLabel: { color: "#97a0b6", fontSize: 12, marginBottom: 4 },
  datetimeVal: { color: "#e6edf3", fontSize: 14 },

  box: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#151821",
    borderColor: "#222635",
    borderWidth: 1,
  },
  boxActive: {
    backgroundColor: "#2442ff22",
    borderColor: "#3e5bff",
  },
  boxText: { color: "#c7cfdb", fontSize: 13 },
  boxTextActive: { color: "#dbe2ff", fontWeight: "600" },

  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopColor: "#1c1f27",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderColor: "#2b3245",
    borderWidth: 1,
  },
  btnGhostText: { color: "#c7cfdb", fontWeight: "600" },
  btnPrimary: {
    backgroundColor: "#3e5bff",
  },
  btnPrimaryText: { color: "white", fontWeight: "700" },
});
