// ChartSettingsModal.tsx

import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (data: {
    startTime: string | null;
    endTime: string | null;
    sampleType: string | null;
    freq: number | null;
    tags: string[];
  }) => void;
  tagOptions: string[];
  editData?: {
    startTime: string | null;
    endTime: string | null;
    sampleType: string | null;
    freq: number | null;
    tags: string[];
  };
  editChartIndex?: number | null;  // 🔥 burayı ekledik
};


const freqOptions = [300, 600, 900, 1800, 3600];
const sampleTypes = ["avg", "min", "max", "sum", "last"];

export default function ChartSettingsModal({
  visible,
  onClose,
  onApply,
  tagOptions,
  editData,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(editData?.tags ?? []);
  const [startTime, setStartTime] = useState<Date | null>(
    editData?.startTime ? new Date(editData.startTime) : null
  );
  const [endTime, setEndTime] = useState<Date | null>(
    editData?.endTime ? new Date(editData.endTime) : null
  );
  const [sampleType, setSampleType] = useState<string | null>(
    editData?.sampleType ?? null
  );
  const [freq, setFreq] = useState<number | null>(editData?.freq ?? null);
  const [quickSelect, setQuickSelect] = useState<"1h" | "24h" | null>(null);

  const [showPicker, setShowPicker] = useState<{
    mode: "date" | "time";
    target: "start" | "end" | null;
  }>({ mode: "date", target: null });

  const [tempDate, setTempDate] = useState<Date | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}.${date.getFullYear()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([tag, ...selectedTags]);
    }
  };

  const handleDateChange = (_: any, date?: Date) => {
    if (date) {
      setTempDate(date);
      setShowPicker((prev) => ({ ...prev, mode: "time" }));
    } else {
      setShowPicker({ mode: "date", target: null });
    }
  };

  const handleTimeChange = (_: any, time?: Date) => {
    if (time && tempDate) {
      const finalDate = new Date(tempDate);
      finalDate.setHours(time.getHours());
      finalDate.setMinutes(time.getMinutes());

      if (showPicker.target === "start") {
        setStartTime(finalDate);
      } else if (showPicker.target === "end") {
        setEndTime(finalDate);
      }
    }
    setShowPicker({ mode: "date", target: null });
    setTempDate(null);
  };

  const apply = () => {
    onApply({
      startTime: startTime ? startTime.toISOString() : null,
      endTime: endTime ? endTime.toISOString() : null,
      sampleType,
      freq,
      tags: selectedTags,
    });
    onClose();
  };

  const filteredTags = [
    ...selectedTags,
    ...tagOptions.filter(
      (tag) =>
        !selectedTags.includes(tag) &&
        tag.toLowerCase().includes(search.toLowerCase())
    ),
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Grafik Ayarları</Text>
          <View style={styles.divider} />

          <ScrollView style={{ maxHeight: "80%" }}>
            {/* Selected tags as chips */}
            {selectedTags.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 10 }}
              >
                {selectedTags.map((tag) => (
                  <View key={tag} style={styles.chip}>
                    <Text style={styles.chipText}>{tag}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Tag Search */}
            <TextInput
              style={styles.input}
              placeholder="Tag ara..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
            />

            {/* Tag List */}
            <View style={{ maxHeight: 100, marginBottom: 14 }}>
              <ScrollView>
                {filteredTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.tagRow,
                      selectedTags.includes(tag) && styles.tagRowSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedTags.includes(tag) && styles.tagTextSelected,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Start & End Time */}
            <Text style={styles.sectionLabel}>Başlangıç Zamanı</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowPicker({ mode: "date", target: "start" })}
            >
              <Text style={{ color: startTime ? "white" : "#94a3b8" }}>
                {startTime ? formatDate(startTime) : "Seçiniz"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Bitiş Zamanı</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowPicker({ mode: "date", target: "end" })}
            >
              <Text style={{ color: endTime ? "white" : "#94a3b8" }}>
                {endTime ? formatDate(endTime) : "Seçiniz"}
              </Text>
            </TouchableOpacity>

            {/* Quick select */}
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  quickSelect === "1h" && styles.quickBtnActive,
                ]}
                onPress={() => {
                  setEndTime(new Date());
                  setStartTime(new Date(Date.now() - 60 * 60 * 1000));
                  setQuickSelect("1h");
                }}
              >
                <Text style={styles.quickBtnText}>Son 1 Saat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.quickBtn,
                  quickSelect === "24h" && styles.quickBtnActive,
                ]}
                onPress={() => {
                  setEndTime(new Date());
                  setStartTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
                  setQuickSelect("24h");
                }}
              >
                <Text style={styles.quickBtnText}>Son 24 Saat</Text>
              </TouchableOpacity>
            </View>

            {/* Frequency */}
            <Text style={styles.sectionLabel}>Frekans (saniye)</Text>
            <View style={styles.rowWrap}>
              {freqOptions.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.optionBtn, freq === f && styles.optionBtnActive]}
                  onPress={() => setFreq(f)}
                >
                  <Text
                    style={[
                      styles.optionBtnText,
                      freq === f && styles.optionBtnTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sample Type */}
            <Text style={styles.sectionLabel}>Sample Type</Text>
            <View style={styles.rowWrap}>
              {sampleTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.optionBtn,
                    sampleType === t && styles.optionBtnActive,
                  ]}
                  onPress={() => setSampleType(t)}
                >
                  <Text
                    style={[
                      styles.optionBtnText,
                      sampleType === t && styles.optionBtnTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={{ color: "white", fontWeight: "600" }}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={apply}>
              <Text style={{ color: "white", fontWeight: "600" }}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showPicker.target && (
        <DateTimePicker
          value={new Date()}
          mode={showPicker.mode}
          display="default"
          themeVariant="dark"
          onChange={
            showPicker.mode === "date" ? handleDateChange : handleTimeChange
          }
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 12,
  },
  container: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    maxHeight: "90%",
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#e2e8f0",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    color: "white",
    backgroundColor: "#1e293b",
  },
  tagRow: {
    borderBottomWidth: 1,
    borderColor: "#334155",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tagRowSelected: {
    backgroundColor: "#1e293b",
  },
  tagText: {
    color: "#e2e8f0",
    fontSize: 14,
  },
  tagTextSelected: {
    color: "#38bdf8",
    fontWeight: "600",
  },
  chip: {
    backgroundColor: "#1d4ed8",
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginRight: 6,
    elevation: 3,
  },
  chipText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionLabel: {
    marginBottom: 6,
    color: "#cbd5e1",
    fontWeight: "500",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: "#334155",
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  quickBtnActive: {
    backgroundColor: "#2563eb",
    elevation: 4,
  },
  quickBtnText: {
    color: "white",
    fontWeight: "600",
  },
  optionBtn: {
    backgroundColor: "#334155",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    margin: 4,
  },
  optionBtnActive: {
    backgroundColor: "#2563eb",
    elevation: 3,
  },
  optionBtnText: {
    color: "#cbd5e1",
    fontWeight: "500",
  },
  optionBtnTextActive: {
    color: "white",
    fontWeight: "600",
  },
  
    footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#475569", // koyu gri
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginRight: 6,
    elevation: 2,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#2563eb", // kurumsal mavi
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginLeft: 6,
    elevation: 3,
  },

});
