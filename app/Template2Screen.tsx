// Template2Screen.tsx
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  LayoutRectangle,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SlotState } from '../components/dragdrop/DragDropContext';

// Drag & Drop (LV kartları için)
import { DragDropProvider } from '../components/dragdrop/DragDropContext';
import { DraggableCard } from '../components/dragdrop/DraggableCard';
import { DropSlot } from '../components/dragdrop/DropSlot';
import type { Slot, Widget } from '../components/dragdrop/types';

// App bileşenleri
import ChartSettingsModal from '../components/ChartSettingsModal';
import DraggableResizableChart from '../components/charts/DraggableResizableChart';
import { mockChartData } from '../mock/mockChartData';

/* =========================
   Types & Storage
========================= */
type ChartConfig = {
  id: string;
  tags: string[];
  startTime: string;
  endTime: string;
  freq: number;
  sampleType: string;
  color: string;
};

type ChartSlotId = 'chartA' | 'chartB';

type ChartFloat = { id: string; cfg: ChartConfig; x: number; y: number };

type LastValueSettings = { tag: string; title: string };

const STORAGE_KEY = 'template2_state_v3';

/* =========================
   Helpers
========================= */
const TAG_NAMES: string[] = Object.keys(mockChartData);
const uid = () => Math.random().toString(36).slice(2);

const chartColors = [
  '#38BDF8', '#F472B6', '#34D399', '#FBBF24',
  '#A78BFA', '#60A5FA', '#FB7185', '#4ADE80',
  '#F87171', '#818CF8', '#FDBA74',
];

const TOKENS = {
  bg: '#0b0f14',
  surface: 'rgba(17,24,39,0.65)',
  stroke: 'rgba(148,163,184,0.22)',
  text: '#EAF2FF',
  hint: '#7a8796',
  accent: '#60A5FA',
};

const generateTimeLabels = (start: string, end: string, freqInSec: number): string[] => {
  const out: string[] = [];
  const s = new Date(start); const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || freqInSec <= 0 || s > e) return out;
  for (let t = s.getTime(); t <= e.getTime(); t += freqInSec * 1000) {
    out.push(new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  }
  return out;
};

const toChartProps = (cfg: ChartConfig) => {
  const labels = generateTimeLabels(cfg.startTime, cfg.endTime, cfg.freq);
  const datasets = cfg.tags.map((tag, i) => {
    const rawValues = mockChartData[tag]?.values || [];
    const safe = Array.from({ length: Math.min(labels.length, rawValues.length) }).map((_, j) => {
      const v = rawValues[j]; return (typeof v === 'number' && isFinite(v)) ? v : 0;
    });
    return { data: safe, color: () => chartColors[i % chartColors.length] };
  });
  return { datasets, labels };
};

const fmtTime = (d?: number | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

/* =========================
   Tag + Title Picker (LV)
========================= */
const TagPickerModal: React.FC<{
  visible: boolean;
  defaultTitle?: string;
  defaultTag?: string;
  onClose: () => void;
  onApply: (payload: { tag: string; title: string }) => void;
}> = ({ visible, defaultTitle = 'Last Value', defaultTag, onClose, onApply }) => {
  const [q, setQ] = useState('');
  const [title, setTitle] = useState(defaultTitle);
  const [selected, setSelected] = useState<string | undefined>(defaultTag);

  useEffect(() => {
    if (visible) {
      setQ('');
      setTitle(defaultTitle);
      setSelected(defaultTag);
    }
  }, [visible, defaultTitle, defaultTag]);

  const filtered = useMemo(() => TAG_NAMES.filter((t) => t.toLowerCase().includes(q.toLowerCase())), [q]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.pickerCard}>
          <Text style={styles.modalTitle}>Kartı Düzenle</Text>

          <Text style={styles.fieldLabel}>Görünecek Ad</Text>
          <TextInput
            placeholder="Örn. Kompresör Sıcaklığı"
            placeholderTextColor="#9aa0a6"
            value={title}
            onChangeText={setTitle}
            style={styles.searchInput}
          />

          <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Tag Seç</Text>
          <TextInput
            placeholder="CA_PRESSURE, VCM_TEMP..."
            placeholderTextColor="#9aa0a6"
            value={q}
            onChangeText={setQ}
            style={[styles.searchInput, { marginBottom: 8 }]}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.pickerItem, selected === item && { backgroundColor: 'rgba(96,165,250,0.12)' }]}
                onPress={() => setSelected(item)}
              >
                <Text style={styles.pickerItemText}>{item}</Text>
              </Pressable>
            )}
            style={{ maxHeight: 220 }}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable onPress={onClose} style={[styles.btn, { backgroundColor: '#334155' }]}>
              <Text style={styles.btnText}>İptal</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selected) onApply({ tag: selected, title: title.trim() || 'Last Value' });
                onClose();
              }}
              style={[styles.btn, { backgroundColor: '#2563eb', flex: 1 }]}
            >
              <Text style={styles.btnText}>Kaydet</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* =========================
   UI Parçaları (LV)
========================= */
const LastValueCardUI: React.FC<{
  title: string;
  tag?: string;
  onEdit: () => void;
  onClear: () => void;
}> = ({ title, tag, onEdit, onClear }) => {
  const val = (() => {
    if (!tag) return undefined;
    const rec = mockChartData[tag];
    if (!rec || !rec.values || rec.values.length === 0) return undefined;
    return rec.values[rec.values.length - 1];
  })();
  const [w, setW] = useState(0);

  const raw = useMemo(() => {
    if (!tag) return [] as number[];
    return (mockChartData[tag]?.values ?? []).map((n) => (Number.isFinite(n) ? Number(n) : 0));
  }, [tag]);
  const min = useMemo(() => (raw.length ? Math.min(...raw) : 0), [raw]);
  const max = useMemo(() => (raw.length ? Math.max(...raw) : 0), [raw]);
  const pad = Math.max((max - min) * 0.1, 1);
  const spark = raw.map((v) => ({ value: v - min + pad }));

  return (
    <View style={styles.squareCard} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.iconRow}>
          {/* ✏️ sadece isim/tag değiştirir */}
          <Pressable onPress={onEdit} hitSlop={8}>
            <Text style={styles.iconText}>✏️</Text>
          </Pressable>
          {/* Çöp: kartı sıfırlar (tag/title -> boş) */}
          <Pressable onPress={onClear} hitSlop={8}>
            <Text style={[styles.iconText, { marginLeft: 8 }]}>🗑️</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.lastValueBody, { paddingTop: 8 }]}>
        {tag ? (
          <>
            <Text style={styles.lastValueNumber}>{val !== undefined ? String(val) : '—'}</Text>
            <View style={{ width: '100%', marginTop: 12 }}>
              {!!spark.length && (
                <LineChart
                  height={44}
                  width={Math.max(120, w - 24)}
                  data={spark}
                  hideDataPoints
                  hideRules
                  thickness={2}
                  curved
                  adjustToWidth
                  endSpacing={0}
                  initialSpacing={0}
                  xAxisThickness={0}
                  yAxisThickness={0}
                  color={'#60A5FA'}
                />
              )}
            </View>
          </>
        ) : (
          <Text style={styles.placeholder}>Bir tag seçmek için düzenleyin</Text>
        )}
      </View>
    </View>
  );
};

/* =========================
   SlotBox (Chart alanları)
========================= */
const ChartSlotBox = ({
  title,
  highlight,
  onLayoutRect,
  onBodyHeight,
  onEdit,
  onUndock,
  children,
}: {
  title: string;
  highlight?: boolean;
  onLayoutRect?: (r: LayoutRectangle) => void;
  onBodyHeight?: (h: number) => void;
  onEdit?: () => void;
  onUndock?: () => void;
  children?: React.ReactNode;
}) => {
  const outerRef = useRef<View>(null);
  return (
    <View
      ref={outerRef}
      style={[styles.slotOuter, highlight ? styles.slotOuterHighlight : undefined]}
      onLayout={() => outerRef.current?.measureInWindow?.((x,y,w,h)=>onLayoutRect?.({x,y,width:w,height:h}))}
    >
      <View style={styles.slotHeader}>
        <Feather name="grid" size={16} color="#60A5FA" />
        <Text style={styles.slotHeaderText}>  {title}</Text>
        {children ? (
          <View style={{ marginLeft:'auto', flexDirection:'row' }}>
            <Pressable onPress={onEdit} style={{ padding:6, marginRight:6 }}>
              <Feather name="edit-2" size={16} color="#93C5FD" />
            </Pressable>
            <Pressable onPress={onUndock} style={{ padding:6 }}>
              <Feather name="external-link" size={16} color="#93C5FD" />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={[styles.slotBody, children ? { padding: 0 } : undefined]} onLayout={(e)=>onBodyHeight?.(e.nativeEvent.layout.height)}>
        {children ? (
          children
        ) : (
          <View style={[styles.dropHint, highlight && { borderColor: '#60A5FA', backgroundColor: 'rgba(56,189,248,0.08)' }]}>
            <Feather name="move" size={20} color="#64748B" />
            <Text style={styles.dropHintText}>Grafiği buraya bırak</Text>
            <Text style={styles.dropHintSub}>veya alttaki + ile oluştur</Text>
          </View>
        )}
      </View>
    </View>
  );
};

/* =========================
   Screen
========================= */
const Template2Screen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [pageTitle, setPageTitle] = useState('Template 2');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('Template 2');

  // DragDrop (sadece LV için)
  const [initialSlots, setInitialSlots] = useState<Slot[] | null>(null);
  const [latestSlots, setLatestSlots] = useState<SlotState | null>(null);

  // LV durumları
  const [lvSettings, setLVSettings] = useState<Record<string, LastValueSettings | null>>({});

  // Chart — Template1 mantığı
  const [chartSlots, setChartSlots] = useState<{ chartA: ChartConfig | null; chartB: ChartConfig | null }>({ chartA: null, chartB: null });
  const [floatingCharts, setFloatingCharts] = useState<ChartFloat[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editDraft, setEditDraft] = useState<{ cfg: ChartConfig | null }>({ cfg: null });

  // Slot ölçüm/hover
  const [slotRects, setSlotRects] = useState<Record<ChartSlotId, LayoutRectangle | null>>({ chartA: null, chartB: null });
  const [slotHeights, setSlotHeights] = useState<Record<ChartSlotId, number>>({ chartA: 0, chartB: 0 });
  const [hoveredSlot, setHoveredSlot] = useState<ChartSlotId | null>(null);
  const lastHover = useRef<ChartSlotId | null>(null);

  // Kayıt
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [autosave, setAutosave] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // Hover haptic (grafik slotlarına sürüklerken)
  useEffect(() => {
    if (hoveredSlot && hoveredSlot !== lastHover.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
    }
    lastHover.current = hoveredSlot;
  }, [hoveredSlot]);

  const isInside = (r: LayoutRectangle | null, x: number, y: number) => !!r && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  const whichZoneSync = (x: number, y: number): ChartSlotId | null => {
    if (isInside(slotRects.chartA, x, y)) return 'chartA';
    if (isInside(slotRects.chartB, x, y)) return 'chartB';
    return null;
  };

  /* ------------ LOAD ------------- */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // LV provider slotları
          const slots: Slot[] = Array.isArray(parsed.slots)
            ? (parsed.slots as Slot[]).filter((s) => ['lv1','lv2','lv3','lv4'].includes(s.id))
            : [
                { id: 'lv1', accepts: ['lastValue'], widgetId: 'lastValue:lv1' },
                { id: 'lv2', accepts: ['lastValue'], widgetId: 'lastValue:lv2' },
                { id: 'lv3', accepts: ['lastValue'], widgetId: 'lastValue:lv3' },
                { id: 'lv4', accepts: ['lastValue'], widgetId: 'lastValue:lv4' },
              ];
          setInitialSlots(slots);

          setPageTitle(parsed.pageTitle ?? 'Template 2');
          setTitleInput(parsed.pageTitle ?? 'Template 2');
          setLVSettings(parsed.lvSettings ?? {});

          // Yeni alanlar
          if (parsed.chartSlots) setChartSlots(parsed.chartSlots);
          if (parsed.floatingCharts) setFloatingCharts(parsed.floatingCharts);

          setLastSavedAt(parsed.lastSavedAt ?? null);
          return;
        }
      } catch {}
      // defaults
      setInitialSlots([
        { id: 'lv1', accepts: ['lastValue'], widgetId: 'lastValue:lv1' },
        { id: 'lv2', accepts: ['lastValue'], widgetId: 'lastValue:lv2' },
        { id: 'lv3', accepts: ['lastValue'], widgetId: 'lastValue:lv3' },
        { id: 'lv4', accepts: ['lastValue'], widgetId: 'lastValue:lv4' },
      ]);
    })();
  }, []);

  /* ------------ SAVE ------------- */
  const saveState = async (slots: SlotState | null, fromAutosave = false) => {
    const payload = {
      pageTitle,
      slots,            // <— LV slot haritası
      lvSettings,
      chartSlots,
      floatingCharts,
      lastSavedAt: Date.now(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setLastSavedAt(payload.lastSavedAt);
    if (fromAutosave) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1200);
    }
  };

  // Chart state değişince autosave
  useEffect(() => {
    if (!autosave) return;
    saveState(latestSlots, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartSlots, floatingCharts, lvSettings]);

  if (!initialSlots) return <View style={{ flex: 1, backgroundColor: TOKENS.bg }} />;

  /* ------------ CHART handlers ------------- */
  const onPlus = () => { setEditDraft({ cfg: null }); setModalVisible(true); };

  const handleApplySettings = (settings: any, editingId?: string) => {
    const { tags, startTime, endTime, freq, sampleType } = settings;
    if (!startTime || !endTime || !sampleType || !freq || !Array.isArray(tags) || !tags.length) {
      alert('Lütfen tüm alanları doldurun.'); return;
    }

    if (editingId) {
      setChartSlots(prev => {
        const p = { ...prev };
        (['chartA','chartB'] as ChartSlotId[]).forEach(sid => {
          if (p[sid]?.id === editingId) p[sid] = { ...(p[sid] as ChartConfig), tags, startTime, endTime, freq, sampleType };
        });
        return p;
      });
      setModalVisible(false);
      return;
    }

    const cfg: ChartConfig = {
      id: uid(), tags, startTime, endTime, freq, sampleType,
      color: chartColors[Math.floor(Math.random() * chartColors.length)],
    };
    const spawnX = 16;
    const spawnY = Math.max(140, insets.top + 96);
    setFloatingCharts(prev => [...prev, { id: cfg.id, cfg, x: spawnX, y: spawnY }]);
    setModalVisible(false);
  };

  const attachToSlot = (chartId: string, zone: ChartSlotId) => {
    const item = floatingCharts.find(f => f.id === chartId); if (!item) return;
    setChartSlots(p => ({ ...p, [zone]: item.cfg }));
    setFloatingCharts(prev => prev.filter(f => f.id !== chartId));
    setHoveredSlot(null);
  };

  const removeFromSlot = (zone: ChartSlotId) => setChartSlots(p => ({ ...p, [zone]: null }));

  const undockFromSlot = (sid: ChartSlotId) => {
    const cfg = chartSlots[sid]; if (!cfg) return;
    setFloatingCharts(prev => [...prev, { id: cfg.id, cfg, x: 16, y: Math.max(140, insets.top + 96) }]);
    removeFromSlot(sid);
  };

  return (
    <View style={{ flex: 1, backgroundColor: TOKENS.bg }}>
      <DragDropProvider
        initialSlots={initialSlots}
        setScrollLocked={() => {}}
        // LV sürükle-bırak değişince kaydet
        onChange={(slots, meta) => {
          setLatestSlots(slots);
          // Meta ile LV swap/drop event’lerinde haptic
          try {
            if (meta?.type === 'drop' || meta?.type === 'swap') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
            }
          } catch {}
          if (autosave) saveState(slots, true);
        }}
      >
        {/* Header */}
        <Header
          insetsTop={insets.top}
          pageTitle={pageTitle}
          setPageTitle={setPageTitle}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          titleInput={titleInput}
          setTitleInput={setTitleInput}
          autosave={autosave}
          setAutosave={setAutosave}
          onManualSave={(slots)=> saveState(slots, false)}
          lastSavedAt={lastSavedAt}
        />

        {/* + FAB */}
        <Pressable
          onPress={onPlus}
          style={({ pressed }) => [styles.fab, pressed && { transform:[{ scale:0.98 }], opacity:0.95 }]}
          accessibilityRole="button"
          accessibilityLabel="Yeni grafik ekle"
        >
          <Feather name="plus" size={22} color="#0B1120" />
        </Pressable>

        {/* Floating charts */}
        {floatingCharts.map(f => {
          const p = toChartProps(f.cfg);
          return (
            <View key={f.id} style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <View style={{ position:'absolute', left:f.x, top:f.y, right:0 }} pointerEvents="box-none">
                <DraggableResizableChart
                  data={p.datasets}
                  labels={p.labels}
                  tags={f.cfg.tags}
                  sampleType={f.cfg.sampleType}
                  freq={f.cfg.freq}
                  mode="floating"
                  initialPosition={{ x:f.x, y:f.y }}
                  onDelete={() => setFloatingCharts(prev => prev.filter(x => x.id !== f.id))}
                  onDropGesture={({absX,absY}) => {
                    const z = whichZoneSync(absX,absY);
                    return Promise.resolve(z === 'chartA' ? 'slot1' : z === 'chartB' ? 'slot2' : null);
                  }}
                  onDrop={(zoneId) => attachToSlot(f.id, zoneId === 'slot1' ? 'chartA' : 'chartB')}
                  onDragMove={({absX,absY}) => setHoveredSlot(whichZoneSync(absX,absY))}
                />
              </View>
            </View>
          );
        })}

        {/* İçerik */}
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* LV Row 1 */}
          <View style={styles.row}>
            <LVSlot id="lv1" lvSettings={lvSettings} setLVSettings={setLVSettings} />
            <LVSlot id="lv2" lvSettings={lvSettings} setLVSettings={setLVSettings} />
          </View>

          {/* CHART SLOT A */}
          <ChartSlotBox
            title="CHART SLOT A"
            highlight={hoveredSlot==='chartA'}
            onLayoutRect={(r)=>setSlotRects(p=>({...p,chartA:r}))}
            onBodyHeight={(h)=>setSlotHeights(p=>({...p,chartA:h}))}
            onEdit={()=>{ const c = chartSlots.chartA; if(!c) return; setEditDraft({ cfg:c }); setModalVisible(true); }}
            onUndock={()=>undockFromSlot('chartA')}
          >
            {chartSlots.chartA && (()=>{
              const p = toChartProps(chartSlots.chartA!);
              const cfg = chartSlots.chartA!;
              return (
                <DraggableResizableChart
                  data={p.datasets}
                  labels={p.labels}
                  tags={cfg.tags}
                  sampleType={cfg.sampleType}
                  freq={cfg.freq}
                  mode="docked"
                  variant="card"
                  compact
                  idealHeight={slotHeights.chartA||0}
                  onDelete={() => removeFromSlot('chartA')}
                  onRequestUndock={()=>undockFromSlot('chartA')}
                />
              );
            })()}
          </ChartSlotBox>

          {/* LV Row 2 */}
          <View style={styles.row}>
            <LVSlot id="lv3" lvSettings={lvSettings} setLVSettings={setLVSettings} />
            <LVSlot id="lv4" lvSettings={lvSettings} setLVSettings={setLVSettings} />
          </View>

          {/* CHART SLOT B */}
          <ChartSlotBox
            title="CHART SLOT B"
            highlight={hoveredSlot==='chartB'}
            onLayoutRect={(r)=>setSlotRects(p=>({...p,chartB:r}))}
            onBodyHeight={(h)=>setSlotHeights(p=>({...p,chartB:h}))}
            onEdit={()=>{ const c = chartSlots.chartB; if(!c) return; setEditDraft({ cfg:c }); setModalVisible(true); }}
            onUndock={()=>undockFromSlot('chartB')}
          >
            {chartSlots.chartB && (()=>{
              const p = toChartProps(chartSlots.chartB!);
              const cfg = chartSlots.chartB!;
              return (
                <DraggableResizableChart
                  data={p.datasets}
                  labels={p.labels}
                  tags={cfg.tags}
                  sampleType={cfg.sampleType}
                  freq={cfg.freq}
                  mode="docked"
                  variant="card"
                  compact
                  idealHeight={slotHeights.chartB||0}
                  onDelete={() => removeFromSlot('chartB')}
                  onRequestUndock={()=>undockFromSlot('chartB')}
                />
              );
            })()}
          </ChartSlotBox>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Chart Settings */}
        <ChartSettingsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onApply={(payload)=>handleApplySettings(payload, editDraft.cfg?.id)}
          tagOptions={TAG_NAMES.map((name)=>({name}))}
          editData={editDraft.cfg ? {
            tags: editDraft.cfg.tags,
            startTime: editDraft.cfg.startTime,
            endTime: editDraft.cfg.endTime,
            freq: editDraft.cfg.freq,
            sampleType: editDraft.cfg.sampleType,
          } : null}
          editChartIndex={null}
        />

        {showToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✅ Kaydedildi</Text>
          </View>
        )}
      </DragDropProvider>
    </View>
  );
};

export default Template2Screen;

/* =========================
   LV Slot (drag & swap LV)
========================= */
const LVSlot: React.FC<{
  id: 'lv1' | 'lv2' | 'lv3' | 'lv4';
  lvSettings: Record<string, LastValueSettings | null>;
  setLVSettings: React.Dispatch<React.SetStateAction<Record<string, LastValueSettings | null>>>;
}> = ({ id, lvSettings, setLVSettings }) => {
  const { useDragDrop } = require('../components/dragdrop/DragDropContext');
  const { slots, dragging, overSlotId } = useDragDrop(); // <— hover/sürükleme bilgisi
  const [, force] = useState(0);
  const [open, setOpen] = useState(false);

  // Parlama & scale animasyonu (hover feedback)
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  // Mevcut slot ve widget kimliği
  const slot = slots[id];
  if (slot && !slot.widgetId) slot.widgetId = `lastValue:${id}`;
  const widgetId = slot?.widgetId ?? `lastValue:${id}`;
  const settings = lvSettings[widgetId] ?? null;

  // Hover olduğunda görsel geri bildirim + haptic
  useEffect(() => {
    const isHover = overSlotId === id && dragging != null;
    Animated.spring(scale, { toValue: isHover ? 1.02 : 1, useNativeDriver: true, friction: 7 }).start();
    Animated.timing(glow, { toValue: isHover ? 1 : 0, duration: 140, useNativeDriver: false }).start();
    if (isHover) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
  }, [overSlotId, dragging, id, scale, glow]);

  const onApply = (payload: { tag: string; title: string }) => {
    // Sadece isim/tag güncelle
    setLVSettings((prev) => ({ ...prev, [widgetId]: payload }));
    force((v) => v + 1);
  };
  const onClear = () => {
    setLVSettings((prev) => ({ ...prev, [widgetId]: null }));
    force((v) => v + 1);
  };

  return (
    <DropSlot id={id} style={styles.slotBare}>
      <Animated.View style={{ transform: [{ scale }], borderRadius: 18 }}>
        {settings ? (
          // Uzun bas – sürükle: başka slota bırakınca SWAP (DragDropProvider halledecek)
          <DraggableCard widget={{ id: widgetId, type: 'lastValue' } as Widget} fromSlotId={id}>
            <View>
              <LastValueCardUI
                title={settings.title}
                tag={settings.tag}
                onEdit={() => setOpen(true)}   // ✏️ sadece isim ve tag değiştirir
                onClear={onClear}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.swapOverlay,
                  {
                    opacity: glow.interpolate({ inputRange:[0,1], outputRange:[0,0.9] }),
                    borderColor: glow.interpolate({ inputRange:[0,1], outputRange:['rgba(96,165,250,0.0)','rgba(96,165,250,0.8)'] }) as any
                  }
                ]}
              >
                <Text style={styles.swapText}>Bırakınca yer değiştir</Text>
              </Animated.View>
            </View>
          </DraggableCard>
        ) : (
          // Boşsa: kart oluştur (isim & tag seç)
          <Pressable style={styles.addChartCta} onPress={() => setOpen(true)}>
            <Text style={styles.addChartText}>+ Kart Oluştur</Text>
            <Text style={styles.addChartHint}>Ad ver ve tag seç</Text>
          </Pressable>
        )}
      </Animated.View>

      <TagPickerModal
        visible={open}
        defaultTitle={settings?.title || 'Last Value'}
        defaultTag={settings?.tag}
        onClose={() => setOpen(false)}
        onApply={onApply}
      />
    </DropSlot>
  );
};

/* =========================
   Header
========================= */
const Header: React.FC<{
  insetsTop: number;
  pageTitle: string;
  setPageTitle: (s:string)=>void;
  editingTitle: boolean;
  setEditingTitle: (b:boolean)=>void;
  titleInput: string;
  setTitleInput: (s:string)=>void;
  autosave: boolean;
  setAutosave: React.Dispatch<React.SetStateAction<boolean>>;
  onManualSave: (slots: SlotState | null)=>void;
  lastSavedAt: number | null;
}> = ({ insetsTop, pageTitle, setPageTitle, editingTitle, setEditingTitle, titleInput, setTitleInput, autosave, setAutosave, onManualSave, lastSavedAt })=>{
  const { useDragDrop } = require('../components/dragdrop/DragDropContext');
  const { slots } = useDragDrop();
  return (
    <View style={[styles.headerBar, { paddingTop: insetsTop + 6 }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerLeft}>
        {!editingTitle ? (
          <View style={styles.titleRow}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.headerTitle}>{pageTitle}</Text>
            <TouchableOpacity onPress={() => { setEditingTitle(true); setTitleInput(pageTitle); }} style={styles.titleEditBtn} hitSlop={{ top:6,bottom:6,left:6,right:6 }}>
              <Feather name="edit-2" size={16} color="#9FB3D1" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.titleEditRow}>
            <TextInput
              value={titleInput}
              onChangeText={setTitleInput}
              onSubmitEditing={() => { setPageTitle(titleInput.trim() || 'Untitled'); setEditingTitle(false); }}
              onBlur={() => { setPageTitle(titleInput.trim() || 'Untitled'); setEditingTitle(false); }}
              style={styles.titleInput}
              placeholder="Sayfa adı"
              placeholderTextColor="#7b8da4"
              autoFocus
            />
            <TouchableOpacity onPress={() => { setPageTitle(titleInput.trim() || 'Untitled'); setEditingTitle(false); }} style={styles.titleSaveBtn}>
              <Feather name="check" size={16} color="#0B1120" />
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.headerSub}>Son kaydetme: {fmtTime(lastSavedAt)}</Text>
      </View>

      <View style={styles.headerActions}>
        <Pressable onPress={() => setAutosave(v => !v)} style={[styles.seg, autosave && styles.segOn]}>
          <Text style={[styles.segText, autosave && styles.segTextOn]}>{autosave ? 'Auto' : 'Manual'}</Text>
        </Pressable>
        <TouchableOpacity onPress={() => onManualSave(slots)} style={styles.iconBtnPrimary}>
          <Feather name="save" size={16} color="#0B1120" />
          <Text style={styles.iconBtnPrimaryText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* =========================
   Styles
========================= */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 96 },

  // Header
  headerBar: {
    minHeight: 72,
    paddingHorizontal: 16,
    backgroundColor: '#0b0f14',
    borderBottomWidth: 1,
    borderBottomColor: '#141a22',
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingBottom: 10,
  },
  headerLeft: { flex: 1, maxWidth: '58%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#EAF2FF', fontSize: 20, fontWeight: '900', letterSpacing: 0.2 },
  headerSub: { color: '#8CA3BF', fontSize: 12, marginTop: 3 },
  titleInput: {
    flex: 1,
    minWidth: 120,
    maxWidth: '100%',
    color: '#EAF2FF', fontSize: 18, fontWeight: '800',
    borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.35)',
    paddingVertical: 4,
  },
  titleEditBtn: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(148,163,184,0.12)' },
  titleSaveBtn: { padding: 8, borderRadius: 10, backgroundColor: '#60A5FA' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seg: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.3)', backgroundColor: 'rgba(2,6,23,0.6)'
  },
  segOn: { backgroundColor: 'rgba(96,165,250,0.18)', borderColor: 'rgba(96,165,250,0.45)' },
  segText: { color: '#9FB3D1', fontWeight: '800' },
  segTextOn: { color: '#E0F2FE' },

  iconBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#60A5FA', borderWidth: 1, borderColor: 'rgba(96,165,250,0.55)'
  },
  iconBtnPrimaryText: { color: '#0B1120', fontWeight: '900' },

  // Rows
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  slotBare: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginBottom: 0,
    zIndex: 1,
  },

  // Chart SlotBox styles
  slotOuter: {
    minHeight: 360,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: TOKENS.stroke,
    backgroundColor: TOKENS.surface,
    overflow: 'hidden',
    marginBottom: 16,
  },
  slotOuterHighlight: {
    borderColor: 'rgba(96,165,250,0.9)',
    shadowColor:'#60A5FA',
    shadowOpacity:0.25,
    shadowRadius:10,
    elevation:4,
  },
  slotHeader: {
    height: 42, paddingHorizontal: 12, flexDirection:'row', alignItems:'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(148,163,184,0.16)',
  },
  slotHeaderText: { color:'#BAE6FD', fontWeight:'800', fontSize:14, letterSpacing:1 },
  slotBody: { flex: 1, padding: 10 },
  dropHint: {
    flex:1, borderRadius:20, borderWidth:1.5, borderStyle:'dashed',
    borderColor:'rgba(148,163,184,0.28)', alignItems:'center', justifyContent:'center',
    gap:4, backgroundColor:'rgba(2,6,23,0.18)',
  },
  dropHintText: { color:'#94A3B8', fontSize:13 },
  dropHintSub: { color:'#64748B', fontSize:12 },

  // LV Cards
  squareCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#121821',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#1f2732',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 }, elevation: 4,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: { color: '#e6eef8', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  iconText: { fontSize: 16, color: '#a9b4c0' },

  lastValueBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lastValueNumber: { color: '#EAF2FF', fontSize: 34, fontWeight: '900', letterSpacing: 0.3, marginTop: 6 },
  placeholder: { color: '#6b7785', fontSize: 13 },

  addChartCta: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3442',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  addChartText: { color: '#c7d2de', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  addChartHint: { color: TOKENS.hint, fontSize: 12 },

  swapOverlay: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 6,
    bottom: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96,165,250,0.06)',
  },
  swapText: { color: '#bcd8ff', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },

  // FAB
  fab: {
    position:'absolute',
    right:18, bottom:24,
    width:56, height:56, borderRadius:28,
    backgroundColor: TOKENS.accent,
    alignItems:'center', justifyContent:'center',
    shadowColor:'#000', shadowOpacity:0.28, shadowRadius:10, shadowOffset:{ width:0, height:8 }, elevation:8,
    zIndex: 9,
  },

  // Toast
  toast: {
    position: 'absolute',
    left: 0, right: 0, bottom: 20,
    alignItems: 'center', justifyContent: 'center'
  },
  toastText: {
    backgroundColor: 'rgba(17,24,39,0.92)',
    borderWidth: 1, borderColor: 'rgba(147,197,253,0.35)',
    color: '#EAF2FF',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999,
    fontWeight: '900'
  },

  // Modal (TagPicker)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f141b',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e2530',
  },
  modalTitle: { color: '#e6eef8', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  fieldLabel: { color: '#9fb3d1', fontSize: 12, marginBottom: 6 },
  searchInput: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#253041',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#e6eef8',
    marginBottom: 10,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1f2732',
  },
  pickerItemText: { color: '#c5cfda', fontSize: 14 },
  btn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
});
