// components/ChartSettingsModal.tsx
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

type TagOption = { name: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (payload: {
    tags: string[];
    startTime: string;
    endTime: string;
    freq: number;
    sampleType: string;
  }) => void;
  tagOptions: TagOption[];

  /** Edit modunda mevcut değerleri doldurur */
  editData: null | {
    tags: string[];
    startTime: string;
    endTime: string;
    freq: number;
    sampleType: string;
  };
  editChartIndex: number | null; // kullanılmıyor ama imza korunuyor
};

const FREQS = [300, 600, 900, 1800, 3600];
const SAMPLE_TYPES = ['AVG', 'MIN', 'MAX', 'RAW'] as const;

export default function ChartSettingsModal({
  visible,
  onClose,
  onApply,
  tagOptions,
  editData,
}: Props) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(editData?.tags ?? []);
  const [startTime, setStartTime] = useState<string>(editData?.startTime ?? new Date().toISOString());
  const [endTime, setEndTime] = useState<string>(editData?.endTime ?? new Date(Date.now() + 60 * 60 * 1000).toISOString());
  const [freq, setFreq] = useState<number>(editData?.freq ?? 300);
  const [sampleType, setSampleType] = useState<string>(editData?.sampleType ?? 'AVG');

  const [picker, setPicker] = useState<{ which: 'start' | 'end' | null }>({ which: null });

  React.useEffect(() => {
    if (editData) {
      setSelectedTags(editData.tags);
      setStartTime(editData.startTime);
      setEndTime(editData.endTime);
      setFreq(editData.freq);
      setSampleType(editData.sampleType);
    } else if (visible) {
      // yeni açıldıysa reset
      setSelectedTags([]);
      setQuery('');
      setStartTime(new Date().toISOString());
      setEndTime(new Date(Date.now() + 60 * 60 * 1000).toISOString());
      setFreq(300);
      setSampleType('AVG');
    }
  }, [visible, editData]);

  const filtered = useMemo(
    () => tagOptions.filter(t => t.name.toLowerCase().includes(query.toLowerCase())),
    [tagOptions, query]
  );

  const toggleTag = (name: string) => {
    setSelectedTags((prev) => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);
  };

  const apply = () => {
    const s = new Date(startTime); const e = new Date(endTime);
    if (!selectedTags.length) return alert('En az bir tag seçin.');
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return alert('Başlangıç/Bitiş zamanı geçersiz.');
    if (s > e) return alert('Başlangıç tarihi, bitişten büyük olamaz.');
    if (freq <= 0) return alert('Frequency 0 dan büyük olmalı.');
    onApply({ tags: selectedTags, startTime, endTime, freq, sampleType });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{editData ? 'Grafiği Düzenle' : 'Yeni Grafik'}</Text>

          {/* TAG SEARCH */}
          <Text style={styles.label}>Tag Seç</Text>
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="CA_PRESSURE, VCM_TEMP..."
              placeholderTextColor="#7F8DA0"
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(it) => it.name}
            style={{ maxHeight: 140 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => toggleTag(item.name)} style={[styles.tagRow, selectedTags.includes(item.name) && styles.tagRowActive]}>
                <Text style={styles.tagName}>{item.name}</Text>
                <Text style={styles.tagCheck}>{selectedTags.includes(item.name) ? '✓' : '+'}</Text>
              </Pressable>
            )}
          />

          {/* SELECTED TAGS */}
          <View style={styles.selectedWrap}>
            {selectedTags.map((t) => (
              <View key={t} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{t}</Text>
                <Pressable onPress={() => toggleTag(t)}>
                  <Text style={styles.removeX}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* TIME */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Başlangıç</Text>
              <TouchableOpacity style={styles.timeBtn} onPress={() => setPicker({ which: 'start' })}>
                <Text style={styles.timeText}>{new Date(startTime).toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Bitiş</Text>
              <TouchableOpacity style={styles.timeBtn} onPress={() => setPicker({ which: 'end' })}>
                <Text style={styles.timeText}>{new Date(endTime).toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FREQ */}
          <Text style={[styles.label, { marginTop: 12 }]}>Frequency (s)</Text>
          <View style={styles.chipsRow}>
            {FREQS.map((f) => (
              <Pressable key={f} style={[styles.chip, freq === f && styles.chipActive]} onPress={() => setFreq(f)}>
                <Text style={[styles.chipText, freq === f && styles.chipTextActive]}>{f}</Text>
              </Pressable>
            ))}
          </View>

          {/* SAMPLE TYPE */}
          <Text style={[styles.label, { marginTop: 12 }]}>Sample Type</Text>
          <View style={styles.chipsRow}>
            {SAMPLE_TYPES.map((s) => (
              <Pressable key={s} style={[styles.chip, sampleType === s && styles.chipActive]} onPress={() => setSampleType(s)}>
                <Text style={[styles.chipText, sampleType === s && styles.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {/* ACTIONS */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={apply}>
              <Text style={styles.btnPrimaryText}>{editData ? 'Kaydet' : 'Ekle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* DateTime Pickers */}
      <DateTimePickerModal
        isVisible={picker.which === 'start'}
        mode="datetime"
        date={new Date(startTime)}
        onConfirm={(d) => { setStartTime(d.toISOString()); setPicker({ which: null }); }}
        onCancel={() => setPicker({ which: null })}
      />
      <DateTimePickerModal
        isVisible={picker.which === 'end'}
        mode="datetime"
        date={new Date(endTime)}
        onConfirm={(d) => { setEndTime(d.toISOString()); setPicker({ which: null }); }}
        onCancel={() => setPicker({ which: null })}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3,7,18,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: 'rgba(8,14,35,0.95)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    padding: 14,
  },
  title: { color: '#E0F2FE', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  label: { color: '#93C5FD', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  searchBox: {
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', borderRadius: 12, marginBottom: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(2,6,23,0.6)',
  },
  searchInput: { color: '#E5E7EB', fontSize: 14 },
  tagRow: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.2)', marginBottom: 6, backgroundColor: 'rgba(2,6,23,0.6)',
    flexDirection: 'row', alignItems: 'center',
  },
  tagRowActive: { borderColor: 'rgba(96,165,250,0.6)', backgroundColor: 'rgba(15,23,42,0.9)' },
  tagName: { color: '#E5E7EB', flex: 1, fontWeight: '600' },
  tagCheck: { color: '#93C5FD', fontWeight: '900' },
  selectedWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  selectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
    backgroundColor: 'rgba(96,165,250,0.18)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.35)'
  },
  selectedChipText: { color: '#E0F2FE', fontWeight: '700' },
  removeX: { color: '#94A3B8', fontSize: 16, marginLeft: 2 },
  row: { flexDirection: 'row', marginTop: 8 },
  timeBtn: {
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(2,6,23,0.6)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)',
  },
  timeText: { color: '#E5E7EB', fontSize: 13 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)', backgroundColor: 'rgba(2,6,23,0.6)',
  },
  chipActive: { borderColor: 'rgba(96,165,250,0.8)', backgroundColor: 'rgba(15,23,42,0.9)' },
  chipText: { color: '#CBD5E1', fontWeight: '700' },
  chipTextActive: { color: '#E0F2FE' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'flex-end' },
  btn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnGhost: { backgroundColor: 'rgba(2,6,23,0.6)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)' },
  btnGhostText: { color: '#E5E7EB', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#60A5FA' },
  btnPrimaryText: { color: '#0B1120', fontWeight: '900' },
});
