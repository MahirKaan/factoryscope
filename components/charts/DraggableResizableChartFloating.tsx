import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    GestureResponderEvent,
    PanResponder,
    PanResponderGestureState,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Dataset = { data: number[]; color: () => string };
type Mode = 'floating' | 'docked' | 'free';
type Variant = 'card' | 'fill';
type VisualScale = 'auto' | 'raw' | 'minmax';

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
  pinchEnabledInDocked?: boolean;
  curved?: boolean;
  onHeightChange?: (h: number) => void;
  persistKey?: string;
  visualScale?: VisualScale; // default: 'auto'
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const MIN_H = 120;
const MAX_H = 560;
const MIN_W = 220;

const MIN_SPACING = 6;
const SPACING_TIGHT_FACTOR = 0.75;
const CARD_PAD = 10;
const CARD_HPAD_TOTAL = CARD_PAD * 2;

const TOKENS = {
  surface: '#141C2B',
  stroke: '#253349',
  textSecondary: '#B8C7E6',
  chipTextOnColor: '#0B1120',
  tooltipBg: 'rgba(15,23,42,0.95)',
  tooltipStroke: '#64748b',
};

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
  curved = true,
  onHeightChange,
  visualScale = 'auto',
}: Props) {
  const insets = useSafeAreaInsets();
  const isFloating = mode === 'floating' || mode === 'free';
  const isDocked = mode === 'docked';

  const computeMaxW = (w: number) => {
    const SAFE_SIDE_MARGINS = 24 + insets.left + insets.right;
    return Math.max(MIN_W, w - SAFE_SIDE_MARGINS);
  };

  const [winW, setWinW] = useState(Dimensions.get('window').width);
  const [maxW, setMaxW] = useState<number>(computeMaxW(winW));
  const computeInitialFloatingW = (w: number) => {
    const safe = computeMaxW(w);
    let ratio = 0.84;
    if (w <= 360) ratio = 0.90;
    else if (w >= 430) ratio = 0.80;
    else if (w >= 768) ratio = 0.60;
    return clamp(safe * ratio, MIN_W, safe);
  };

  const [containerW, setContainerW] = useState<number>(isFloating ? computeInitialFloatingW(winW) : 0);
  const [chartH, setChartH] = useState<number>(compact ? 160 : 280);
  const [ready, setReady] = useState<boolean>(isFloating);

  const [pointerEnabled, setPointerEnabled] = useState<boolean>(!isFloating ? true : false);
  useEffect(() => {
    if (isFloating) {
      const t = setTimeout(() => setPointerEnabled(true), 500);
      return () => clearTimeout(t);
    } else {
      setPointerEnabled(true);
    }
  }, [isFloating]);

  useEffect(() => { onHeightChange?.(chartH); }, [chartH, onHeightChange]);

  useEffect(() => {
    const onChange = ({ window }: { window: any }) => {
      setWinW(window.width);
      const newMax = computeMaxW(window.width);
      setMaxW(newMax);
      if (isFloating) setContainerW(prev => clamp(prev, MIN_W, newMax));
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub?.remove();
  }, [isFloating, insets.left, insets.right]);

  useEffect(() => {
    const newMax = computeMaxW(winW);
    setMaxW(newMax);
    if (isFloating) {
      setContainerW(prev => (prev === 0 ? computeInitialFloatingW(winW) : clamp(prev, MIN_W, newMax)));
    }
  }, [insets.left, insets.right, winW, isFloating]);

  useEffect(() => {
    if (isDocked) {
      if (compact) { setChartH(160); return; }
      if (idealHeight && idealHeight > 0) {
        const h = variant === 'fill' ? idealHeight : Math.max(140, idealHeight - 64);
        setChartH(clamp(h, MIN_H, MAX_H));
      }
    }
  }, [idealHeight, isDocked, variant, compact]);

  // Floating drag
  const [pos, setPos] = useState(initialPosition);
  const startPos = useRef(pos);
  const [dragging, setDragging] = useState(false);

  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e: GestureResponderEvent) =>
        isFloating && (e.nativeEvent.touches?.length ?? 0) === 1,
      onPanResponderGrant: () => {
        if (!isFloating) return;
        startPos.current = { ...pos };
        setDragging(true);
        onDraggingChange?.(true);
      },
      onPanResponderMove: (_e: GestureResponderEvent, g: PanResponderGestureState) => {
        if (!isFloating) return;
        const nx = clamp(startPos.current.x + g.dx, 0, Math.max(0, winW - containerW - 4));
        const ny = Math.max(0, startPos.current.y + g.dy);
        setPos({ x: nx, y: ny });
        onDragMove?.({ absX: g.moveX, absY: g.moveY });
      },
      onPanResponderRelease: async (_e, g) => {
        if (!isFloating) return;
        setDragging(false);
        onDraggingChange?.(false);
        if (onDropGesture && onDrop) {
          const zone = await onDropGesture({ absX: g.moveX, absY: g.moveY });
          if (zone) onDrop(zone);
        }
      },
    }),
  ).current;

  // ✅ Pinch zoom: hem genişlik hem yükseklik için + docked modda da aktif
  const pinchBase = useRef({ dist: 0, w: 0, h: 0 });
  const pinchResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) =>
        (isFloating || (isDocked && pinchEnabledInDocked)) && e.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (e) =>
        (isFloating || (isDocked && pinchEnabledInDocked)) && e.nativeEvent.touches.length >= 2,
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
        // ✅ Hem W hem H büyüsün / küçülsün
        const newW = clamp(pinchBase.current.w * scale, MIN_W, maxW);
        const newH = clamp(pinchBase.current.h * scale, MIN_H, MAX_H);
        setContainerW(newW);
        setChartH(newH);
        setPos(p => ({ x: clamp(p.x, 0, Math.max(0, winW - newW - 4)), y: p.y }));
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  /* --- DATA hazırlığı --- */
  const trimmed = useMemo(() => {
    const n = Math.min(labels?.length ?? 0, ...(data?.map(d => d.data.length) ?? [0]));
    const useLabels = (labels || []).slice(0, n);
    const useSeries = (data || []).slice(0, 4).map(ds => ({
      color: ds.color,
      values: ds.data.slice(0, n).map(v => (Number.isFinite(v) ? Number(v) : 0)),
    }));
    return { labels: useLabels, series: useSeries, n };
  }, [labels, data]);

  const scaleMode: VisualScale =
    visualScale === 'auto'
      ? (trimmed.series.length > 1 ? 'minmax' : 'raw')
      : visualScale;

  const normalized = useMemo(() => {
    if (scaleMode !== 'minmax') return trimmed.series.map(s => s.values);
    return trimmed.series.map(s => {
      const min = Math.min(...s.values);
      const max = Math.max(...s.values);
      if (!isFinite(min) || !isFinite(max) || max === min) {
        if (!isFinite(min) || !isFinite(max) || max === min) {
  return s.values.map(() => 50);
}

      }
      return s.values.map(v => ((v - min) / (max - min)) * 100);
    });
  }, [trimmed.series, scaleMode]);

  // ✅ Saat etiketleri sadece tam saatlerde
  const series = useMemo(() => {
    return normalized.map((vals, si) =>
      vals.map((v, i) => {
        const raw = trimmed.labels?.[i] ?? String(i);
        const d = new Date(raw);
        let hhmm = "";
        if (!isNaN(d.getTime())) {
          hhmm = d.getMinutes() === 0
            ? `${d.getHours().toString().padStart(2, '0')}:00`
            : "";
        }
        return {
          value: Number.isFinite(v) ? v : 0,
          label: hhmm,
          _series: tags?.[si] ?? `Series ${si + 1}`,
        };
      })
    );
  }, [normalized, trimmed, tags]);

  const allVals = useMemo(() => series.flat().map(p => p.value).filter(Number.isFinite), [series]);
  const { minY, maxY } = useMemo(() => {
    if (scaleMode === 'minmax') return { minY: 0, maxY: 100 };
    if (!allVals.length) return { minY: 0, maxY: 1 };
    let min = Math.min(...allVals);
    let max = Math.max(...allVals);
    if (min === max) { min -= 1; max += 1; }
    const pad = Math.max(1, (max - min) * 0.1);
    return { minY: Math.floor(min - pad), maxY: Math.ceil(max + pad) };
  }, [allVals, scaleMode]);

  const domainProps = useMemo(
    () => (minY < 0 ? { mostNegativeValue: minY } : ({} as Record<string, unknown>)),
    [minY]
  );

  const c1 = data?.[0]?.color?.() ?? '#60A5FA';
  const c2 = data?.[1]?.color?.();
  const c3 = data?.[2]?.color?.();
  const c4 = data?.[3]?.color?.();

  const containerStyle: (ViewStyle | undefined)[] = [styles.card];
  if (isDocked && variant === 'fill') {
    containerStyle.push({ padding: 0, borderWidth: 0, borderRadius: 0, marginBottom: 0, backgroundColor: 'transparent' });
  }
  if (isFloating) {
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

  const showHeader = !(isDocked && variant === 'fill');
  const innerW = Math.max(1, containerW - (variant === 'card' ? CARD_HPAD_TOTAL : 0));

  const denseSpacing = useMemo(() => {
    const points = Math.max(1, (trimmed.labels.length || 2) - 1);
    const ideal = (innerW - 36) / points;
    return Math.max(MIN_SPACING, ideal * SPACING_TIGHT_FACTOR);
  }, [innerW, trimmed.labels.length]);

  const renderPointerLabel = (items: { value: number; label?: string; datasetIndex?: number }[]) => {
    if (!items || !items.length) return null;
    const colorArr = [c1, c2, c3, c4].filter(Boolean) as string[];
    return (
      <View style={styles.tooltip}>
        {items.map((it, idx) => {
          const color = colorArr[(it?.datasetIndex ?? idx) % colorArr.length] || '#93C5FD';
          const tagName = tags[(it?.datasetIndex ?? idx)] ?? `Series ${((it?.datasetIndex ?? idx) + 1)}`;
          const valTxt =
            scaleMode === 'minmax'
              ? `${Number(it.value).toFixed(0)}`
              : Number(it.value).toLocaleString('tr-TR');
          return (
            <View key={`pt-${idx}`} style={styles.tooltipRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.tooltipTxt}>
                {tagName}: <Text style={styles.tooltipVal}>{valTxt}</Text>
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
        if (isDocked) {
          const w = e.nativeEvent.layout.width;
          const h = e.nativeEvent.layout.height;
          if (w && (containerW === 0 || Math.abs(w - containerW) > 1)) {
            setContainerW(clamp(w, MIN_W, maxW));
            if (!ready) setReady(true);
          }
          if (h && (chartH === 0 || Math.abs(h - chartH) > 1)) {
            setChartH(clamp(h - 40, MIN_H, MAX_H));
          }
        }
      }}
    >
      {showHeader && (
        <View style={styles.header}>
          {isFloating && (
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
            {isDocked && (
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

      <View
        style={[
          styles.chartWrap,
          variant === 'fill'
            ? { marginTop: 0, width: '100%', height: chartH }
            : { width: innerW, height: chartH }
        ]}
        {...((isFloating || (isDocked && pinchEnabledInDocked)) ? pinchResponder.panHandlers : {})}
      >
        {ready && (
          <LineChart
  curved
  thickness={2}
  color1={c1}
  color2={c2}
  color3={c3}
  color4={c4}
  data={series[0]}
  data2={series[1]}
  data3={series[2]}
  data4={series[3]}
  xAxisLabelTexts={labels}
  width={containerW}       // 🔥 -20 kaldırıldı
  height={chartH}          // 🔥 -20 kaldırıldı
  disableScroll            // 🔥 kayma engelle
  adjustToWidth            // 🔥 genişliği veriye uydur
  areaChart={false}

            startFillColor="transparent"
            endFillColor="transparent"
            startOpacity={0}
            endOpacity={0}
            yAxisOffset={minY}
            initialSpacing={12}
            spacing={denseSpacing}
            yAxisTextStyle={{ color: TOKENS.textSecondary, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: TOKENS.textSecondary, fontSize: 11 }}
            hideDataPoints
            xAxisColor={TOKENS.stroke}
            yAxisColor={TOKENS.stroke}
            rulesColor={TOKENS.stroke}
            hideRules={false}
            yAxisThickness={0}
            xAxisThickness={0}
            {...domainProps}
            pointerConfig={{
              pointerStripColor:'#E5E7EB',
              pointerStripWidth:1,
              pointerColor:'#E5E7EB',
              pointerLabelComponent: renderPointerLabel,
            }}
            isAnimated
            animateOnDataChange
            animationDuration={1200}
          />
        )}
      </View>
    </View>
  );

  return ChartCard;
}

const styles = StyleSheet.create({
  card:{ 
    backgroundColor:TOKENS.surface, 
    borderRadius:14, 
    padding:12, 
    borderWidth:1, 
    borderColor:'rgba(148,163,184,0.18)', 
    marginBottom:12 
  },
  header:{ 
    flexDirection:'row', 
    alignItems:'center', 
    justifyContent:'space-between', 
    marginBottom:6 
  },
  dragHandle:{ padding:4, marginRight:6 },
  title:{ fontSize:13, fontWeight:'600', color:'#E0E7FF', marginRight:6 },
  tagsRow:{ flexDirection:'row', flex:1, gap:6 },
  tag:{ 
    paddingHorizontal:6, 
    paddingVertical:2, 
    borderRadius:6, 
    minWidth:28, 
    justifyContent:'center', 
    alignItems:'center' 
  },
  tagText:{ fontSize:11, color:TOKENS.chipTextOnColor },
  iconBtn:{ 
    padding:6, 
    borderWidth:1, 
    borderRadius:8, 
    borderColor:'rgba(148,163,184,0.3)' 
  },
  chartWrap:{ marginTop:6 },
  tooltip:{
    backgroundColor:TOKENS.tooltipBg,
    padding:10,
    borderRadius:8,
    borderWidth:1,
    borderColor:TOKENS.tooltipStroke,
    shadowColor:'#000',
    shadowOpacity:0.3,
    shadowRadius:6,
    shadowOffset:{width:0,height:3},
    minWidth:120,
    alignItems:'flex-start',
  },
  tooltipArrow:{
    position:'absolute',
    bottom:-6,
    left:'50%',
    marginLeft:-6,
    width:0,
    height:0,
    borderLeftWidth:6,
    borderRightWidth:6,
    borderTopWidth:6,
    borderStyle:'solid',
    backgroundColor:'transparent',
    borderLeftColor:'transparent',
    borderRightColor:'transparent',
    borderTopColor:TOKENS.tooltipBg,
  },
  tooltipRow:{ flexDirection:'row', alignItems:'center', marginBottom:3 },
  dot:{ width:10, height:10, borderRadius:5, marginRight:6 },
  tooltipTxt:{ fontSize:12, color:'#e2e8f0' },
  tooltipVal:{ fontWeight:'700', color:'#facc15' },
});