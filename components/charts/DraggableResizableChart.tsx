import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Dataset = { data: number[]; color: () => string };
type Mode = 'floating' | 'docked';
type Variant = 'card' | 'fill';

interface Props {
  data: Dataset[];
  labels: string[];
  tags: string[];
  sampleType: string;
  freq: number;

  onDelete: () => void;

  mode?: Mode;
  initialPosition?: { x: number; y: number };

  onDropGesture?: (g: { absX: number; absY: number }) => Promise<'slot1' | 'slot2' | null>;
  onDrop?: (zoneId: 'slot1' | 'slot2') => void;
  onDraggingChange?: (dragging: boolean) => void;
  onDragMove?: (g: { absX: number; absY: number }) => void;

  idealHeight?: number;
  variant?: Variant;
  onRequestUndock?: () => void;

  compact?: boolean;

  /** Slot içinde de pinch açılsın mı? (sadece yükseklik değişir) */
  pinchEnabledInDocked?: boolean;

  /** Kıvrımlı çizgi (gifted-charts 'curved') */
  curved?: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const MIN_H = 120;
const MAX_H = 560;
const MIN_W = 220;

// Kart padding’i (card stilinde 10)
const CARD_PAD = 10;
const CARD_HPAD_TOTAL = CARD_PAD * 2;

const TOKENS = {
  surface: '#141C2B',
  stroke: '#253349',
  textSecondary: '#B8C7E6',
  chipTextOnColor: '#0B1120',
  tooltipBg: 'rgba(2,6,23,0.92)',
  tooltipStroke: 'rgba(147,197,253,0.35)',
};

// iki dokunuş arası mesafe
const pinchDistance = (touches: readonly any[]) => {
  if (!touches || touches.length < 2) return 0;
  const [a, b] = touches as any[];
  const dx = (a.pageX ?? a.locationX) - (b.pageX ?? b.locationX);
  const dy = (a.pageY ?? a.locationY) - (b.pageY ?? b.locationY);
  return Math.hypot(dx, dy);
};

export default function DraggableResizableChart({
  data, labels, tags, sampleType, freq, onDelete,
  mode = 'floating',
  initialPosition = { x: 16, y: 120 },
  onDropGesture, onDrop, onDraggingChange, onDragMove,
  idealHeight,
  variant = 'card',
  onRequestUndock,
  compact = false,
  pinchEnabledInDocked = true,
  curved = true, // ← varsayılan: kıvrımlı
}: Props) {
  const insets = useSafeAreaInsets();

  // ekran/safe-area → güvenli max genişlik
  const computeMaxW = (w: number) => {
    const SAFE_SIDE_MARGINS = 24 + insets.left + insets.right; // 12px sağ/sol + insets
    return Math.max(MIN_W, w - SAFE_SIDE_MARGINS);
  };

  const [winW, setWinW] = useState(Dimensions.get('window').width);
  const [maxW, setMaxW] = useState<number>(computeMaxW(winW));

  // Cihaza göre “dar” başlangıç
  const computeInitialFloatingW = (w: number) => {
    const safe = computeMaxW(w);
    let ratio = 0.84;
    if (w <= 360) ratio = 0.90;
    else if (w >= 430) ratio = 0.80;
    else if (w >= 768) ratio = 0.60;
    return clamp(safe * ratio, MIN_W, safe);
  };

  // Boyut durumları
  const [containerW, setContainerW] = useState<number>(
    mode === 'floating' ? computeInitialFloatingW(winW) : 0
  );
  const [chartH, setChartH] = useState<number>(compact ? 160 : 280);
  const [ready, setReady] = useState<boolean>(mode === 'floating'); // docked: ölçmeden çizme

  // Orientation & insets değişimi
  useEffect(() => {
    const onChange = ({ window }: { window: any }) => {
      setWinW(window.width);
      const newMax = computeMaxW(window.width);
      setMaxW(newMax);
      if (mode === 'floating') setContainerW((prev) => clamp(prev, MIN_W, newMax));
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, [mode, insets.left, insets.right]);

  useEffect(() => {
    const newMax = computeMaxW(winW);
    setMaxW(newMax);
    if (mode === 'floating') {
      setContainerW((prev) => (prev === 0 ? computeInitialFloatingW(winW) : clamp(prev, MIN_W, newMax)));
    }
  }, [insets.left, insets.right]);

  // Slot içi yükseklik yönetimi
  useEffect(() => {
    if (mode === 'docked') {
      if (compact) { setChartH(160); return; }
      if (idealHeight && idealHeight > 0) {
        const h = variant === 'fill' ? idealHeight : Math.max(140, idealHeight - 64);
        setChartH(clamp(h, MIN_H, MAX_H));
      }
    }
  }, [idealHeight, mode, variant, compact]);

  // Floating konum/sürükleme
  const [pos, setPos] = useState(initialPosition);
  const startPos = useRef(pos);
  const [dragging, setDragging] = useState(false);

  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => mode === 'floating',
      onPanResponderGrant: () => {
        if (mode !== 'floating') return;
        startPos.current = { ...pos };
        setDragging(true);
        onDraggingChange?.(true);
      },
      onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
        if (mode !== 'floating') return;
        const nx = clamp(startPos.current.x + g.dx, 0, Math.max(0, winW - containerW - 4));
        const ny = Math.max(0, startPos.current.y + g.dy);
        setPos({ x: nx, y: ny });
        onDragMove?.({ absX: g.moveX, absY: g.moveY });
      },
      onPanResponderRelease: async (_e, g) => {
        if (mode !== 'floating') return;
        setDragging(false);
        onDraggingChange?.(false);
        if (onDropGesture && onDrop) {
          const zone = await onDropGesture({ absX: g.moveX, absY: g.moveY });
          if (zone) onDrop(zone);
        }
      },
    }),
  ).current;

  // Pinch zoom: floating → W+H, docked → sadece H
  const pinchBase = useRef({ dist: 0, w: 0, h: 0 });
  const pinchResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) =>
        (mode === 'floating' || (mode === 'docked' && pinchEnabledInDocked)) &&
        e.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (e) =>
        (mode === 'floating' || (mode === 'docked' && pinchEnabledInDocked)) &&
        e.nativeEvent.touches.length >= 2,
      onPanResponderGrant: (e) => {
        pinchBase.current = {
          dist: pinchDistance(e.nativeEvent.touches),
          w: containerW,
          h: chartH,
        };
      },
      onPanResponderMove: (e) => {
        const d = pinchDistance(e.nativeEvent.touches);
        if (!d || !pinchBase.current.dist) return;
        const scale = d / pinchBase.current.dist;

        if (mode === 'floating') {
          const safeMax = maxW;
          const newW = clamp(pinchBase.current.w * scale, MIN_W, safeMax);
          const newH = clamp(pinchBase.current.h * scale, MIN_H, MAX_H);
          setContainerW(newW);
          setChartH(newH);
          setPos((p) => ({ x: clamp(p.x, 0, Math.max(0, winW - newW - 4)), y: p.y }));
        } else if (mode === 'docked' && pinchEnabledInDocked) {
          const newH = clamp(pinchBase.current.h * scale, MIN_H, MAX_H);
          setChartH(newH); // genişlik sabit (slot’a tam otursun)
        }
      },
      onPanResponderRelease: () => {},
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  /* --- DATA hazırlığı --- */
  const trimmed = useMemo(() => {
    const n = Math.min(labels?.length ?? 0, ...(data?.map(d => d.data.length) ?? [0]));
    const useLabels = (labels || []).slice(0, n);
    const useSeries = (data || []).slice(0, 4).map(ds => ({
      color: ds.color,
      values: ds.data.slice(0, n),
    }));
    return { labels: useLabels, series: useSeries, n };
  }, [labels, data]);

  const series = useMemo(() => {
    const { n } = trimmed;
    const mid = n > 0 ? Math.floor((n - 1) / 2) : 0;
    return trimmed.series.map((ds, si) =>
      ds.values.map((v, i) => ({
        value: Number.isFinite(v) ? v : 0,
        label: i === 0 || i === mid || i === n - 1 ? (trimmed.labels?.[i] ?? String(i)) : '',
        _series: tags?.[si] ?? `Series ${si + 1}`,
      })),
    );
  }, [trimmed, tags]);

  const allVals = useMemo(() => series.flat().map(p => p.value).filter(Number.isFinite), [series]);
  const { minY, maxY } = useMemo(() => {
    if (!allVals.length) return { minY: 0, maxY: 1 };
    let min = Math.min(...allVals);
    let max = Math.max(...allVals);
    if (min === max) { min -= 1; max += 1; }
    const pad = Math.max(1, (max - min) * 0.1);
    return { minY: Math.floor(min - pad), maxY: Math.ceil(max + pad) };
  }, [allVals]);
  const domainProps = useMemo(() => (minY < 0 ? { mostNegativeValue: minY } : ({} as Record<string, unknown>)), [minY]);

  const c1 = data?.[0]?.color?.() ?? '#60A5FA';
  const c2 = data?.[1]?.color?.();
  const c3 = data?.[2]?.color?.();
  const c4 = data?.[3]?.color?.();

  // KONTEYNER + iç genişlik
  const containerStyle: (ViewStyle | undefined)[] = [styles.card];
  if (mode === 'docked' && variant === 'fill') {
    containerStyle.push({ padding: 0, borderWidth: 0, borderRadius: 0, marginBottom: 0, backgroundColor: 'transparent' });
  }
  if (mode === 'floating') {
    containerStyle.push({
      width: containerW,
      position: 'absolute',
      left: pos.x,
      top: pos.y,
      zIndex: dragging ? 999 : 500,
      shadowColor: '#000',
      shadowOpacity: dragging ? 0.4 : 0.25,
      shadowRadius: dragging ? 22 : 14,
      shadowOffset: { width: 0, height: dragging ? 18 : 10 },
      elevation: dragging ? 22 : 10,
      transform: [{ scale: dragging ? 0.98 : 1 }],
      marginHorizontal: 12,
    });
  } else {
    containerStyle.push({ width: '100%', marginHorizontal: 0 });
  }

  const showHeader = !(mode === 'docked' && variant === 'fill');

  // Card padding çıkarılmış iç genişlik
  const innerW = Math.max(1, containerW - (variant === 'card' ? CARD_HPAD_TOTAL : 0));

  const renderPointerLabel = (items: { value: number; label?: string; datasetIndex?: number }[]) => {
    if (!items || !items.length) return null;
    const timeLabel = items[0]?.label ?? '';
    const colorArr = [c1, c2, c3, c4].filter(Boolean) as string[];
    return (
      <View style={styles.tooltip}>
        <Text style={styles.tooltipTime}>{timeLabel}</Text>
        {items.map((it, idx) => {
          const color = colorArr[(it?.datasetIndex ?? idx) % colorArr.length] || '#93C5FD';
          const tagName = tags[(it?.datasetIndex ?? idx)] ?? `Series ${((it?.datasetIndex ?? idx) + 1)}`;
          return (
            <View key={`pt-${idx}`} style={styles.tooltipRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.tooltipTxt}>
                {tagName}: <Text style={styles.tooltipVal}>{Number(it.value).toLocaleString('tr-TR')}</Text>
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const ChartCard = (
    <View
      style={containerStyle}
      onLayout={(e) => {
        if (mode === 'docked') {
          const w = e.nativeEvent.layout.width;
          if (w && (containerW === 0 || Math.abs(w - containerW) > 1)) {
            setContainerW(clamp(w, MIN_W, maxW));
            if (!ready) setReady(true);
          }
        }
      }}
    >
      {showHeader && (
        <View style={styles.header}>
          {mode === 'floating' && (
            <View {...dragResponder.panHandlers} style={styles.dragHandle}>
              <MaterialCommunityIcons name="drag-vertical" size={22} color="#93C5FD" />
            </View>
          )}
          <Text style={styles.title}>{(sampleType || 'RAW').toUpperCase()}</Text>
          <View style={styles.tagsRow}>
            {tags.slice(0, 4).map((t, i) => (
              <View key={`${t}-${i}`} style={[styles.tag, { backgroundColor: data?.[i]?.color?.() ?? '#60A5FA' }]}>
                <Text style={styles.tagText} numberOfLines={1}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection:'row', gap:8 }}>
            {mode === 'docked' && (
              <TouchableOpacity onPress={onRequestUndock} style={styles.iconBtn} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Feather name="maximize-2" size={18} color="#93C5FD" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onDelete} style={[styles.iconBtn, { backgroundColor:'rgba(239,68,68,0.12)', borderColor:'rgba(239,68,68,0.25)'}]}>
              <Feather name="trash-2" size={18} color="#F87171" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Chart alanı – pinch hem floating’te hem (opsiyonel) docked’ta */}
      <View
        style={[
          styles.chartWrap,
          variant === 'fill' ? { marginTop: 0, width: '100%', height: chartH } : { width: innerW },
        ]}
        {...((mode === 'floating' || (mode === 'docked' && pinchEnabledInDocked)) ? pinchResponder.panHandlers : {})}
      >
        {ready && innerW > 0 && (
          <LineChart
            height={chartH}
            width={innerW}
            data={series[0] ?? []}
            data2={series[1] ?? undefined}
            data3={series[2] ?? undefined}
            data4={series[3] ?? undefined}
            curved={curved}              // ← kıvrım burada aktif
            thickness={2}
            color={c1}
            color2={series[1] ? (c2 as string) : undefined}
            color3={series[2] ? (c3 as string) : undefined}
            color4={series[3] ? (c4 as string) : undefined}
            hideDataPoints={true}
            yAxisTextStyle={{ color: TOKENS.textSecondary, fontSize: compact ? 10 : 12 }}
            xAxisLabelTextStyle={{ color: TOKENS.textSecondary, fontSize: compact ? 10 : 12, fontWeight: '600' }}
            yAxisLabelWidth={compact ? 30 : 40}
            xAxisThickness={0}
            yAxisThickness={0}
            rulesType={'solid'}
            rulesColor={'rgba(148,163,184,0.16)'}
            noOfSections={4}
            maxValue={maxY}
            {...domainProps}
            initialSpacing={14}
            spacing={Math.max(12, (innerW - 42) / Math.max(1, (trimmed.labels.length || 2) - 1))}
            pointerConfig={{
              showPointerStrip: true,
              pointerStripColor: 'rgba(148,163,184,0.35)',
              pointerStripWidth: 1.5,
              pointerStripUptoDataPoint: true,
              pointerColor: '#93C5FD',
              radius: 3,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelWidth: 180,
              pointerVanishDelay: 1200,
              pointerLabelComponent: (items: any[]) => renderPointerLabel(items as any),
            } as any}
          />
        )}

        {/* Docked’ta uzun basıp undock – pinch açıksa bu overlay’i kaldırıyoruz */}
        {mode === 'docked' && !pinchEnabledInDocked && (
          <Pressable
            onLongPress={onRequestUndock}
            delayLongPress={280}
            style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
            hitSlop={10}
          />
        )}

        {mode === 'docked' && variant === 'fill' && (
          <TouchableOpacity onPress={onRequestUndock} style={styles.undockBtn} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
            <Feather name="external-link" size={16} color="#93C5FD" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return ChartCard;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: TOKENS.surface,
    padding: CARD_PAD,
    borderWidth: 1,
    borderColor: TOKENS.stroke,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: { height:44, paddingHorizontal:8, flexDirection:'row', alignItems:'center' },
  dragHandle: { paddingHorizontal: 6, paddingVertical: 4, marginRight: 6 },
  title: { color:'#38BDF8', fontWeight:'900', fontSize:14, marginRight:10 },
  tagsRow: { flexDirection:'row', flexWrap:'wrap', gap:6, flex:1, paddingRight:6 },
  tag: { paddingHorizontal:10, paddingVertical:4, borderRadius:12, maxWidth: 140 },
  tagText: { color:TOKENS.chipTextOnColor, fontSize:12, fontWeight:'700' },

  iconBtn: {
    paddingHorizontal:8, paddingVertical:6, borderRadius:10,
    backgroundColor:'rgba(30,41,59,0.6)', borderWidth:1, borderColor:'rgba(147,197,253,0.35)',
  },

  chartWrap: { marginTop:8, position:'relative' },

  undockBtn: {
    position:'absolute', right:8, top:8,
    padding:6, borderRadius:8,
    backgroundColor:'rgba(30,41,59,0.6)',
    borderWidth:1, borderColor:'rgba(147,197,253,0.35)',
  },

  // Tooltip
  tooltip: {
    paddingHorizontal:10,
    paddingVertical:8,
    borderRadius:12,
    backgroundColor: TOKENS.tooltipBg,
    borderWidth:1,
    borderColor: TOKENS.tooltipStroke,
  },
  tooltipTime: { color:'#E2E8F0', fontSize:12, fontWeight:'800', marginBottom:6 },
  tooltipRow: { flexDirection:'row', alignItems:'center', marginTop:2 },
  dot: { width:8, height:8, borderRadius:4, marginRight:6 },
  tooltipTxt: { color:'#CBD5E1', fontSize:12 },
  tooltipVal: { color:'#F8FAFC', fontWeight:'800' },
});
