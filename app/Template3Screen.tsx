import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// ✅ Projene göre güncel path'ler
import ChartSettingsModal from '../components/ChartSettingsModal';
import DraggableResizableChart from '../components/charts/DraggableResizableChart';
import { mockChartData } from '../mock/mockChartData';

// ---------------------------------------------
// Types
// ---------------------------------------------
type ChartSettings = {
  tags: string[]; // seçili tag isimleri
  startTime: string; // ISO
  endTime: string;   // ISO
  freq: number;      // seconds
  sampleType: string; // 'AVG' | 'MIN' | 'MAX' | 'RAW'
};

type ChartSlotId = 'slotA' | 'slotB';

type TagOption = { name: string };

type Dataset = { data: number[]; color: () => string };

type Rect = { x: number; y: number; w: number; h: number };

// ---------------------------------------------
// Utilities
// ---------------------------------------------
const STORAGE_KEY = 'template3_state_v5';

const TAG_NAMES: string[] = Object.keys(mockChartData);
const TAG_OPTIONS: TagOption[] = TAG_NAMES.map((name) => ({ name }));

const lastValueOf = (tagName?: string) => {
  if (!tagName) return undefined;
  const rec = mockChartData[tagName];
  if (!rec || !rec.values || rec.values.length === 0) return undefined;
  return rec.values[rec.values.length - 1];
};

const COLORS = ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA', '#FCA5A5'];
const colorFn = (idx: number) => () => COLORS[idx % COLORS.length];

const buildChartIO = (settings: ChartSettings | undefined): { labels: string[]; data: Dataset[] } => {
  if (!settings || !settings.tags?.length) return { labels: [], data: [] };
  const labels = mockChartData[settings.tags[0]]?.labels ?? [];
  const data: Dataset[] = settings.tags.slice(0, 4).map((t, i) => ({
    data: (mockChartData[t]?.values ?? []).map((v: number) => (Number.isFinite(v) ? Number(v) : 0)),
    color: colorFn(i),
  }));
  return { labels, data };
};

const inside = (pt: { x: number; y: number }, r?: Rect | null) => !!r && pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;

const fmtTime = (d?: number | null) => {
  if (!d) return '—';
  const dt = new Date(d);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

// ---------------------------------------------
// Small modal for picking a single tag (searchable)
// ---------------------------------------------
const TagPickerModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onPick: (tag: string) => void;
}> = ({ visible, onClose, onPick }) => {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => TAG_NAMES.filter((t) => t.toLowerCase().includes(q.toLowerCase())), [q]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.pickerCard}>
          <Text style={styles.modalTitle}>Bir Tag Seç</Text>
          <TextInput
            placeholder="CA_PRESSURE, VCM_TEMP..."
            placeholderTextColor="#9aa0a6"
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable style={styles.pickerItem} onPress={() => { onPick(item); onClose(); }}>
                <Text style={styles.pickerItemText}>{item}</Text>
              </Pressable>
            )}
            style={{ maxHeight: 320 }}
          />
          <Pressable onPress={onClose} style={[styles.btn, { marginTop: 12 }]}>
            <Text style={styles.btnText}>Kapat</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------
// Last Value Card (square) + mini sparkline
// ---------------------------------------------
const LastValueCard: React.FC<{
  selectedTag?: string;
  onChange: (tag?: string) => void;
  title?: string;
  onMove?: () => void;
  containerRef?: React.RefObject<View | null>;
  onLayout?: (e: LayoutChangeEvent) => void;
}> = ({ selectedTag, onChange, title, onMove, containerRef, onLayout }) => {
  const [open, setOpen] = useState(false);
  const val = lastValueOf(selectedTag);
  const [w, setW] = useState(0);

  const spark = useMemo(() => {
    if (!selectedTag) return [] as { value: number }[];
    const arr = (mockChartData[selectedTag]?.values ?? []).map((n) => (Number.isFinite(n) ? Number(n) : 0));
    return arr.map((n) => ({ value: n }));
  }, [selectedTag]);

  return (
    <View ref={containerRef as any} onLayout={(e) => { setW(e.nativeEvent.layout.width); onLayout?.(e); }} style={styles.squareCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title ?? 'Last Value'}</Text>
        <View style={styles.iconRow}>
          {!!selectedTag && (
            <Pressable onPress={onMove} hitSlop={8}>
              <Text style={styles.iconText}>↕︎</Text>
            </Pressable>
          )}
          {!!selectedTag && (
            <Pressable onPress={() => setOpen(true)} hitSlop={8}>
              <Text style={[styles.iconText, { marginLeft: 8 }]}>✏️</Text>
            </Pressable>
          )}
          {selectedTag ? (
            <Pressable onPress={() => onChange(undefined)} hitSlop={8}>
              <Text style={[styles.iconText, { marginLeft: 8 }]}>🗑️</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {selectedTag && (
        <View style={styles.pill}>
          <View style={styles.dotSmall} />
          <Text style={styles.pillText} numberOfLines={1}>{selectedTag}</Text>
        </View>
      )}

      <Pressable style={styles.lastValueBody} onPress={() => setOpen(true)} onLongPress={onMove} delayLongPress={260}>
        {selectedTag ? (
          <>
            <Text style={styles.lastValueNumber}>{val !== undefined ? String(val) : '—'}</Text>
            {/* Sparkline */}
            <View style={{ width: '100%', marginTop: 8 }}>
              {!!spark.length && (
                <LineChart
                  height={44}
                  width={Math.max(120, w - 24)}
                  data={spark}
                  hideDataPoints
                  hideRules
                  thickness={2}
                  curved
                  color={'#60A5FA'}
                  xAxisThickness={0}
                  yAxisThickness={0}
                />
              )}
            </View>
            <Text style={styles.lastValueHint}>Uzun bas ve taşı</Text>
          </>
        ) : (
          <Text style={styles.placeholder}>Seçmek için dokun</Text>
        )}
      </Pressable>

      <TagPickerModal
        visible={open}
        onClose={() => setOpen(false)}
        onPick={(tag) => onChange(tag)}
      />
    </View>
  );
};

// ---------------------------------------------
// Chart Slot (wide rectangle) + move icon
// ---------------------------------------------
const ChartSlot: React.FC<{
  slotId: ChartSlotId;
  settings?: ChartSettings;
  onAddOrEdit: (slotId: ChartSlotId, existing?: ChartSettings) => void;
  onDelete: (slotId: ChartSlotId) => void;
  onMove: (slotId: ChartSlotId) => void;
  containerRef: React.RefObject<View | null>;
  onLayout: (e: LayoutChangeEvent) => void;
}> = ({ slotId, settings, onAddOrEdit, onDelete, onMove, containerRef, onLayout }) => {
  const { labels, data } = useMemo(() => buildChartIO(settings), [settings]);

  return (
    <View ref={containerRef as any} onLayout={onLayout} style={styles.rectCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Chart</Text>
        <View style={styles.iconRow}>
          {settings ? (
            <>
              <Pressable onPress={() => onMove(slotId)}>
                <Text style={styles.iconText}>⤴︎</Text>
              </Pressable>
              <Pressable onPress={() => onAddOrEdit(slotId, settings)}>
                <Text style={[styles.iconText, { marginLeft: 8 }]}>✏️</Text>
              </Pressable>
              <Pressable onPress={() => onDelete(slotId)}>
                <Text style={[styles.iconText, { marginLeft: 8 }]}>🗑️</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>

      {settings ? (
        <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
          <DraggableResizableChart
            mode="docked"
            variant="card"
            idealHeight={240}
            data={data}
            labels={labels}
            tags={settings.tags}
            sampleType={settings.sampleType}
            freq={settings.freq}
            onDelete={() => onDelete(slotId)}
          />
        </View>
      ) : (
        <Pressable style={styles.addChartCta} onPress={() => onAddOrEdit(slotId)}>
          <Text style={styles.addChartText}>+ Add Chart</Text>
          <Text style={styles.addChartHint}>ChartSettingsModal ile yapılandır</Text>
        </Pressable>
      )}
    </View>
  );
};

// ---------------------------------------------
// Screen
// ---------------------------------------------
const Template3Screen: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [pageTitle, setPageTitle] = useState<string>('Template 3');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('Template 3');

  const [chartSlots, setChartSlots] = useState<Partial<Record<ChartSlotId, ChartSettings>>>({});
  const [modalOpenFor, setModalOpenFor] = useState<ChartSlotId | null>(null);
  const [editSeed, setEditSeed] = useState<ChartSettings | null>(null);

  // Last Value 2x2 Grid (reorderable)
  const [lv, setLv] = useState<(string | undefined)[]>([undefined, undefined, undefined, undefined]);

  // MOVE chart: floating chart
  const [moving, setMoving] = useState<null | { from: ChartSlotId; settings: ChartSettings }>(null);
  const slotARef = useRef<View | null>(null);
  const slotBRef = useRef<View | null>(null);
  const rects = useRef<{ slotA?: Rect; slotB?: Rect; lv0?: Rect; lv1?: Rect; lv2?: Rect; lv3?: Rect }>({});

  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [autosave, setAutosave] = useState<boolean>(true);
  const [showToast, setShowToast] = useState(false);

  const refreshRects = () => {
    slotARef.current?.measureInWindow?.((x, y, w, h) => (rects.current.slotA = { x, y, w, h }));
    slotBRef.current?.measureInWindow?.((x, y, w, h) => (rects.current.slotB = { x, y, w, h }));
  };

  // LOAD
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setPageTitle(parsed.pageTitle ?? 'Template 3');
          setTitleInput(parsed.pageTitle ?? 'Template 3');
          setChartSlots(parsed.chartSlots ?? {});
          const arr = parsed.lv ?? [undefined, undefined, undefined, undefined];
          setLv([arr[0], arr[1], arr[2], arr[3]]);
          setLastSavedAt(parsed.lastSavedAt ?? null);
        }
      } catch {}
    })();
  }, []);

  const saveState = async (fromAutosave = false) => {
    const payload = { pageTitle, chartSlots, lv, lastSavedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setLastSavedAt(payload.lastSavedAt);
    if (fromAutosave) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1200);
    }
  };

  // AUTOSAVE (debounced)
  useEffect(() => {
    if (!autosave) return;
    const t = setTimeout(() => { saveState(true); }, 800);
    return () => clearTimeout(t);
  }, [pageTitle, chartSlots, lv, autosave]);

  const openAdd = (slotId: ChartSlotId, existing?: ChartSettings) => {
    setModalOpenFor(slotId);
    setEditSeed(existing ?? null);
  };

  const onApplyChart = (payload: { tags: string[]; startTime: string; endTime: string; freq: number; sampleType: string; }) => {
    if (!modalOpenFor) return;
    const next: ChartSettings = {
      tags: payload.tags ?? [],
      startTime: payload.startTime,
      endTime: payload.endTime,
      freq: typeof payload.freq === 'number' ? payload.freq : Number(payload.freq ?? 300),
      sampleType: String(payload.sampleType ?? 'AVG'),
    };
    setChartSlots((prev) => ({ ...prev, [modalOpenFor]: next }));
    setModalOpenFor(null);
    setEditSeed(null);
  };

  const onDeleteChart = (slotId: ChartSlotId) => {
    setChartSlots((prev) => {
      const copy = { ...prev } as any;
      delete copy[slotId];
      return copy;
    });
  };

  const onMoveChart = (slotId: ChartSlotId) => {
    const settings = chartSlots[slotId];
    if (!settings) return;
    setMoving({ from: slotId, settings });
  };

  const onDropGesture = async ({ absX, absY }: { absX: number; absY: number }): Promise<'slot1' | 'slot2' | null> => {
    const pt = { x: absX, y: absY };
    // slot ölçümlerini tazele
    refreshRects();
    if (inside(pt, rects.current.slotA)) return 'slot1';
    if (inside(pt, rects.current.slotB)) return 'slot2';
    return null;
  };

  const onDrop = (zoneId: 'slot1' | 'slot2') => {
    if (!moving) return;
    const dest: ChartSlotId = zoneId === 'slot1' ? 'slotA' : 'slotB';
    const from = moving.from;
    const item = moving.settings;
    setChartSlots((prev) => {
      const next = { ...prev } as Partial<Record<ChartSlotId, ChartSettings>>;
      if (dest === from) return next;
      const temp = next[dest];
      next[dest] = item;
      if (temp) next[from] = temp; else delete next[from];
      return next;
    });
    setMoving(null);
  };

  // ---------- Last Value reorder (drag & drop) ----------
  const [lvMoving, setLvMoving] = useState<null | { from: number; tag?: string; rect?: Rect }>(null);
  const [lvFloatPos, setLvFloatPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lvStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lvRefs = [useRef<View | null>(null), useRef<View | null>(null), useRef<View | null>(null), useRef<View | null>(null)];

  const measureLvRects = () => {
    lvRefs[0].current?.measureInWindow?.((x, y, w, h) => (rects.current.lv0 = { x, y, w, h }));
    lvRefs[1].current?.measureInWindow?.((x, y, w, h) => (rects.current.lv1 = { x, y, w, h }));
    lvRefs[2].current?.measureInWindow?.((x, y, w, h) => (rects.current.lv2 = { x, y, w, h }));
    lvRefs[3].current?.measureInWindow?.((x, y, w, h) => (rects.current.lv3 = { x, y, w, h }));
  };

  const startMoveLV = (idx: number) => {
    const key = (`lv${idx}` as 'lv0' | 'lv1' | 'lv2' | 'lv3');
    measureLvRects();
    const r = (rects.current as any)[key] as Rect | undefined;
    const tag = lv[idx];
    if (!r) return;
    setLvMoving({ from: idx, tag, rect: r });
    setLvFloatPos({ x: r.x, y: r.y });
    lvStartRef.current = { x: r.x, y: r.y };
  };

  const lvDropIndex = ({ absX, absY }: { absX: number; absY: number }) => {
    const pt = { x: absX, y: absY };
    if (inside(pt, rects.current.lv0)) return 0;
    if (inside(pt, rects.current.lv1)) return 1;
    if (inside(pt, rects.current.lv2)) return 2;
    if (inside(pt, rects.current.lv3)) return 3;
    return -1;
  };

  const lvPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lvStartRef.current = { ...lvFloatPos };
      },
      onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
        setLvFloatPos({ x: lvStartRef.current.x + g.dx, y: lvStartRef.current.y + g.dy });
      },
      onPanResponderRelease: (_e, g) => {
        const idx = lvDropIndex({ absX: g.moveX, absY: g.moveY });
        if (idx >= 0 && lvMoving && idx !== lvMoving.from) {
          setLv((prev) => {
            const next = [...prev];
            const tmp = next[idx];
            next[idx] = prev[lvMoving.from];
            next[lvMoving.from] = tmp;
            return next;
          });
        }
        setLvMoving(null);
      },
    })
  ).current;

  // HEADER
  const topHeader = (
    <View style={[styles.headerBar, { paddingTop: insets.top + 6 }]}> 
      <StatusBar barStyle="light-content" />
      {/* LEFT */}
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

      {/* RIGHT ACTIONS */}
      <View style={styles.headerActions}>
        <Pressable onPress={() => setAutosave((v) => !v)} style={[styles.seg, autosave && styles.segOn]}>
          <Text style={[styles.segText, autosave && styles.segTextOn]}>{autosave ? 'Auto' : 'Manual'}</Text>
        </Pressable>
        <TouchableOpacity onPress={() => saveState(false)} style={styles.iconBtnPrimary}>
          <Feather name="save" size={16} color="#0B1120" />
          <Text style={styles.iconBtnPrimaryText}>Kaydet</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setChartSlots({}); setLv([undefined, undefined, undefined, undefined]); }} style={styles.iconBtn}>
          <Feather name="trash-2" size={16} color="#9FB3D1" />
          <Text style={styles.iconBtnText}>Temizle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0f14' }}>
      {topHeader}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top row: 2 squares (Last Value) */}
        <View style={styles.row}>
          <LastValueCard title="Last Value" selectedTag={lv[0]} onChange={(t) => setLv((a) => { const c=[...a]; c[0]=t; return c; })} onMove={() => startMoveLV(0)} containerRef={lvRefs[0]} onLayout={measureLvRects} />
          <LastValueCard title="Last Value" selectedTag={lv[1]} onChange={(t) => setLv((a) => { const c=[...a]; c[1]=t; return c; })} onMove={() => startMoveLV(1)} containerRef={lvRefs[1]} onLayout={measureLvRects} />
        </View>

        {/* Middle wide rectangle with chart */}
        <ChartSlot
          slotId="slotA"
          settings={chartSlots.slotA}
          onAddOrEdit={openAdd}
          onDelete={onDeleteChart}
          onMove={onMoveChart}
          containerRef={slotARef}
          onLayout={refreshRects}
        />

        {/* Third row: 2 squares (Last Value) */}
        <View style={styles.row}>
          <LastValueCard title="Last Value" selectedTag={lv[2]} onChange={(t) => setLv((a) => { const c=[...a]; c[2]=t; return c; })} onMove={() => startMoveLV(2)} containerRef={lvRefs[2]} onLayout={measureLvRects} />
          <LastValueCard title="Last Value" selectedTag={lv[3]} onChange={(t) => setLv((a) => { const c=[...a]; c[3]=t; return c; })} onMove={() => startMoveLV(3)} containerRef={lvRefs[3]} onLayout={measureLvRects} />
        </View>

        {/* Bottom wide rectangle with chart */}
        <ChartSlot
          slotId="slotB"
          settings={chartSlots.slotB}
          onAddOrEdit={openAdd}
          onDelete={onDeleteChart}
          onMove={onMoveChart}
          containerRef={slotBRef}
          onLayout={refreshRects}
        />
      </ScrollView>

      {/* MOVE MODE (charts) overlay + floating chart */}
      {moving && (
        <>
          <View pointerEvents="none" style={[styles.dropHighlight, rects.current.slotA && { left: rects.current.slotA.x, top: rects.current.slotA.y, width: rects.current.slotA.w, height: rects.current.slotA.h }]} />
          <View pointerEvents="none" style={[styles.dropHighlight, rects.current.slotB && { left: rects.current.slotB.x, top: rects.current.slotB.y, width: rects.current.slotB.w, height: rects.current.slotB.h }]} />

          {(() => {
            const io = buildChartIO(moving.settings);
            return (
              <DraggableResizableChart
                mode="floating"
                data={io.data}
                labels={io.labels}
                tags={moving.settings.tags}
                sampleType={moving.settings.sampleType}
                freq={moving.settings.freq}
                onDelete={() => setMoving(null)}
                onDropGesture={onDropGesture}
                onDrop={onDrop}
                onDraggingChange={() => {}}
              />
            );
          })()}

          <TouchableOpacity onPress={() => setMoving(null)} style={styles.cancelMoveBtn}>
            <Text style={styles.cancelMoveText}>İptal</Text>
          </TouchableOpacity>
        </>
      )}

      {/* LV REORDER overlay */}
      {lvMoving && lvMoving.rect && (
        <>
          {/* Drop hedef highlightları */}
          <View pointerEvents="none" style={[styles.dropHighlight, rects.current.lv0 && { left: rects.current.lv0.x, top: rects.current.lv0.y, width: rects.current.lv0.w, height: rects.current.lv0.h }]} />
          <View pointerEvents="none" style={[styles.dropHighlight, rects.current.lv1 && { left: rects.current.lv1.x, top: rects.current.lv1.y, width: rects.current.lv1.w, height: rects.current.lv1.h }]} />
          <View pointerEvents="none" style={[styles.dropHighlight, rects.current.lv2 && { left: rects.current.lv2.x, top: rects.current.lv2.y, width: rects.current.lv2.w, height: rects.current.lv2.h }]} />
          <View pointerEvents="none" style={[styles.dropHighlight, rects.current.lv3 && { left: rects.current.lv3.x, top: rects.current.lv3.y, width: rects.current.lv3.w, height: rects.current.lv3.h }]} />

          {/* Yüzen LV kartı */}
          <View
            style={{ position: 'absolute', left: lvFloatPos.x, top: lvFloatPos.y, width: lvMoving.rect.w, height: lvMoving.rect.h }}
            {...lvPanResponder.panHandlers}
          >
            <View style={[styles.squareCard, { width: '100%', height: '100%' }]}> 
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Last Value</Text>
              </View>
              <View style={styles.lastValueBody}>
                {lvMoving.tag ? (
                  <>
                    <Text style={styles.lastValueNumber}>{String(lastValueOf(lvMoving.tag) ?? '—')}</Text>
                  </>
                ) : (
                  <Text style={styles.placeholder}>Boş</Text>
                )}
              </View>
            </View>
          </View>
        </>
      )}

      {/* Toast */}
      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✅ Kaydedildi</Text>
        </View>
      )}

      {/* Chart settings modal */}
      <ChartSettingsModal
        visible={!!modalOpenFor}
        onClose={() => { setModalOpenFor(null); setEditSeed(null); }}
        onApply={onApplyChart}
        tagOptions={TAG_OPTIONS}
        editData={editSeed}
        editChartIndex={null}
      />
    </View>
  );
};

export default Template3Screen;

// ---------------------------------------------
// Styles
// ---------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 64 },
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

  iconBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(2,6,23,0.6)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.25)'
  },
  iconBtnText: { color: '#CFE2FF', fontWeight: '800' },
  iconBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: '#60A5FA', borderWidth: 1, borderColor: 'rgba(96,165,250,0.55)'
  },
  iconBtnPrimaryText: { color: '#0B1120', fontWeight: '900' },

  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  squareCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#121821',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2732',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  rectCard: {
    width: '100%',
    height: 280,
    backgroundColor: '#121821',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2732',
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: { color: '#e6eef8', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  iconText: { fontSize: 16, color: '#a9b4c0' },
  lastValueBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lastValueNumber: { color: '#EAF2FF', fontSize: 32, fontWeight: '900', letterSpacing: 0.3 },
  lastValueHint: { color: '#73839A', fontSize: 11, marginTop: 8 },
  placeholder: { color: '#6b7785', fontSize: 13 },

  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
    backgroundColor: 'rgba(96,165,250,0.12)', borderColor: 'rgba(96,165,250,0.35)'
  },
  pillText: { color: '#DCEBFF', fontSize: 12, fontWeight: '700', maxWidth: '80%' },
  dotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#60A5FA' },

  addChartCta: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3442',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addChartText: { color: '#c7d2de', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  addChartHint: { color: '#7a8796', fontSize: 12 },

  // Tag picker modal
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
    backgroundColor: '#1a68ff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },

  // Drag & drop highlight
  dropHighlight: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(96,165,250,0.6)',
    borderRadius: 16,
    backgroundColor: 'rgba(96,165,250,0.08)'
  },
  cancelMoveBtn: {
    position: 'absolute', right: 16, bottom: 20,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: 'rgba(2,6,23,0.9)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.35)'
  },
  cancelMoveText: { color: '#E5E7EB', fontWeight: '800' },

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
  }
});
