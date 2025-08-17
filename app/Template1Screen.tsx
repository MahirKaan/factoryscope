// screens/Template1Screen.tsx
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  LayoutRectangle,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

import DraggableResizableChart from '../components/charts/DraggableResizableChart';
import ChartSettingsModal from '../components/ChartSettingsModal';
import SaveTemplateModal from '../components/SaveTemplateModal';
import { mockChartData } from '../mock/mockChartData';
import { getTemplate, saveNewTemplate, TemplateSnapshot } from '../storage/savedTemplates';

// ✅ Yeni eklenen component
import TagBox from '../components/TagBox';

type ChartConfig = {
  id: string;
  tags: string[];
  startTime: string;
  endTime: string;
  freq: number;
  sampleType: string;
  color: string;
};
type SlotId = 'slot1' | 'slot2';

const uid = () => Math.random().toString(36).slice(2);

// Design tokens
const TOKENS = {
  bg: '#0B1120',
  surface: 'rgba(2,6,23,0.35)',
  stroke: 'rgba(148,163,184,0.22)',
  strokeStrong: 'rgba(148,163,184,0.30)',
  textPrimary: '#E6F0FF',
  textSecondary: '#8FA3BF',
  accent: '#7DD3FC',
  accentDeep: '#38BDF8',
};
const HEADER_EXPANDED = 132;
const HEADER_COLLAPSED = 64;

const chartColors = [
  '#38BDF8', '#F472B6', '#34D399', '#FBBF24',
  '#A78BFA', '#60A5FA', '#FB7185', '#4ADE80',
  '#F87171', '#818CF8', '#FDBA74',
];

const generateTimeLabels = (start: string, end: string, freqInSec: number): string[] => {
  const result: string[] = [];
  const s = new Date(start); const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || freqInSec <= 0 || s > e) return result;
  for (let t = s.getTime(); t <= e.getTime(); t += freqInSec * 1000) {
    result.push(new Date(t).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  }
  return result;
};

export default function Template1Screen() {
  const router = useRouter();
  const { openSavedId } = useLocalSearchParams<{ openSavedId?: string }>();

  const [slots, setSlots] = useState<{ slot1: ChartConfig | null; slot2: ChartConfig | null }>({
    slot1: null, slot2: null,
  });
  const [floating, setFloating] = useState<{ id: string; cfg: ChartConfig; x: number; y: number }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editDraft, setEditDraft] = useState<{ cfg: ChartConfig | null }>({ cfg: null });

  // Save modal
  const [saveModal, setSaveModal] = useState<{ visible: boolean; defaultName: string }>({
    visible: false, defaultName: '',
  });

  // Sticky/collapsing header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerProgress = Animated.diffClamp(scrollY, 0, HEADER_EXPANDED - HEADER_COLLAPSED).interpolate({
    inputRange: [0, HEADER_EXPANDED - HEADER_COLLAPSED],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const headerHeight = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [HEADER_EXPANDED, HEADER_COLLAPSED],
  });
  const titleSize = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 20],
  });
  const titleTranslateY = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const actionsScale = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });

  // slot measure + hover
  const [slotRects, setSlotRects] = useState<Record<SlotId, LayoutRectangle | null>>({ slot1: null, slot2: null });
  const [slotHeights, setSlotHeights] = useState<Record<SlotId, number>>({ slot1: 0, slot2: 0 });
  const [hoveredSlot, setHoveredSlot] = useState<SlotId | null>(null);
  const lastHover = useRef<SlotId | null>(null);

  const isInside = (r: LayoutRectangle | null, x: number, y: number) =>
    !!r && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  const whichZoneSync = (x: number, y: number): SlotId | null => {
    if (isInside(slotRects.slot1, x, y)) return 'slot1';
    if (isInside(slotRects.slot2, x, y)) return 'slot2';
    return null;
  };

  React.useEffect(() => {
    if (hoveredSlot && hoveredSlot !== lastHover.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
    }
    lastHover.current = hoveredSlot;
  }, [hoveredSlot]);

  const onPlus = () => { setEditDraft({ cfg: null }); setModalVisible(true); };

  const handleApplySettings = (settings: any, editingId?: string) => {
    const { tags, startTime, endTime, freq, sampleType } = settings;
    if (!startTime || !endTime || !sampleType || !freq || !Array.isArray(tags) || !tags.length) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm alanları doldurun.'); return;
    }

    if (editingId) {
      setSlots(prev => {
        const p = { ...prev };
        (['slot1','slot2'] as SlotId[]).forEach(sid => {
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
    const spawnY = HEADER_EXPANDED + 12;
    setFloating(prev => [...prev, { id: cfg.id, cfg, x: spawnX, y: spawnY }]);
    setModalVisible(false);
  };

  const attachToSlot = (chartId: string, zone: SlotId) => {
    const item = floating.find(f => f.id === chartId); if (!item) return;
    setSlots(p => ({ ...p, [zone]: item.cfg }));
    setFloating(prev => prev.filter(f => f.id !== chartId));
    setHoveredSlot(null);
  };
  const removeFromSlot = (zone: SlotId) => setSlots(p => ({ ...p, [zone]: null }));

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

  const undockFromSlot = (sid: SlotId) => {
    const cfg = slots[sid]; if (!cfg) return;
    setFloating(prev => [...prev, { id: cfg.id, cfg, x: 16, y: HEADER_EXPANDED + 12 }]);
    removeFromSlot(sid);
  };

  // Saved template yükleme
  React.useEffect(()=>{
    if(!openSavedId) return;
    (async ()=>{
      const snap = await getTemplate(String(openSavedId));
      if (snap?.state) {
        setSlots(snap.state.slots ?? { slot1:null, slot2:null });
        setFloating(snap.state.floating ?? []);
      }
    })();
  },[openSavedId]);

  // header gölge görünürlük
  const headerShadowOpacity = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  });

  return (
    <View style={styles.root}>
      {/* Sticky collapsing header */}
      <Animated.View
        style={[
          styles.header,
          { height: headerHeight, shadowOpacity: headerShadowOpacity },
        ]}
      >
        <LinearGradient colors={[TOKENS.bg, TOKENS.bg]} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(56,189,248,0.12)','transparent']}
          start={{x:0.2,y:0}} end={{x:0.8,y:1}}
          style={styles.topGlow}
        />

        <Animated.Text
          style={[
            styles.title,
            { fontSize: titleSize, transform: [{ translateY: titleTranslateY }] },
          ]}
          numberOfLines={1}
        >
          Template 1
        </Animated.Text>

        <Animated.View style={[styles.headerActionsBar, { transform: [{ scale: actionsScale }] }]}>
          <Pressable
            onPress={()=>{
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
              const defaultName = `Template1 - ${new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}`;
              setSaveModal({ visible:true, defaultName });
            }}
            style={({pressed})=>[
              styles.actionBtn,
              styles.actionPrimary,
              pressed && styles.actionPressed,
            ]}
          >
            <Feather name="save" size={16} color="#0B1120" />
            <Text style={[styles.actionText, { color:'#0B1120' }]}>Kaydet</Text>
          </Pressable>

          <Pressable
            onPress={()=>{
              Haptics.selectionAsync().catch(()=>{});
              router.push('/saved-templates');
            }}
            style={({pressed})=>[
              styles.actionBtn,
              styles.actionGhost,
              pressed && styles.actionPressed,
            ]}
          >
            <Feather name="folder" size={16} color="#BAE6FD" />
            <Text style={[styles.actionText, { color:'#BAE6FD' }]}>Kayıtlar</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* FAB */}
      <Pressable
        onPress={onPlus}
        style={({ pressed }) => [styles.fab, pressed && { transform:[{ scale:0.98 }], opacity:0.95 }]}
        accessibilityRole="button"
        accessibilityLabel="Yeni grafik ekle"
      >
        <Feather name="plus" size={22} color="#0B1120" />
      </Pressable>

      {/* Floating charts */}
      {floating.map(f => {
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
                onDelete={() => setFloating(prev => prev.filter(x => x.id !== f.id))}
                onDropGesture={({absX,absY}) => Promise.resolve(whichZoneSync(absX,absY))}
                onDrop={(zoneId) => attachToSlot(f.id, zoneId)}
                onDragMove={({absX,absY}) => setHoveredSlot(whichZoneSync(absX,absY))}
              />
            </View>
          </View>
        );
      })}

      {/* Content */}
      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_EXPANDED + 8 }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* SLOT 1 üstüne iki kutu */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TagBox title="Kutucuk 1" />
          <TagBox title="Kutucuk 2" />
        </View>

        <SlotBox
          title="SLOT 1"
          highlight={hoveredSlot==='slot1'}
          onLayoutRect={(r)=>setSlotRects(p=>({...p,slot1:r}))}
          onBodyHeight={(h)=>setSlotHeights(p=>({...p,slot1:h}))}
          onEdit={()=>{
            const c = slots.slot1; if(!c) return;
            setEditDraft({ cfg:c }); setModalVisible(true);
          }}
          onUndock={()=>undockFromSlot('slot1')}
        >
          {slots.slot1 && (() => {
            const p = toChartProps(slots.slot1!);
            const cfg = slots.slot1!;
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
                idealHeight={slotHeights.slot1||0}
                onDelete={() => removeFromSlot('slot1')}
                onRequestUndock={()=>undockFromSlot('slot1')}
              />
            );
          })()}
        </SlotBox>

        {/* SLOT 1 ile SLOT 2 arasına iki kutu */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TagBox title="Ara Kutucuk 1" />
          <TagBox title="Ara Kutucuk 2" />
        </View>

        <SlotBox
          title="SLOT 2"
          highlight={hoveredSlot==='slot2'}
          onLayoutRect={(r)=>setSlotRects(p=>({...p,slot2:r}))}
          onBodyHeight={(h)=>setSlotHeights(p=>({...p,slot2:h}))}
          onEdit={()=>{
            const c = slots.slot2; if(!c) return;
            setEditDraft({ cfg:c }); setModalVisible(true);
          }}
          onUndock={()=>undockFromSlot('slot2')}
        >
          {slots.slot2 && (() => {
            const p = toChartProps(slots.slot2!);
            const cfg = slots.slot2!;
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
                idealHeight={slotHeights.slot2||0}
                onDelete={() => removeFromSlot('slot2')}
                onRequestUndock={()=>undockFromSlot('slot2')}
              />
            );
          })()}
        </SlotBox>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Chart Settings */}
      <ChartSettingsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onApply={(payload)=>handleApplySettings(payload, editDraft.cfg?.id)}
        tagOptions={Object.keys(mockChartData)}
        editData={
          editDraft?.cfg ? {
            tags: editDraft.cfg.tags,
            startTime: editDraft.cfg.startTime,
            endTime: editDraft.cfg.endTime,
            freq: editDraft.cfg.freq,
            sampleType: editDraft.cfg.sampleType,
          } : undefined
        }
      />

      {/* Save Modal */}
      <SaveTemplateModal
        visible={saveModal.visible}
        defaultName={saveModal.defaultName}
        onCancel={()=>setSaveModal({ visible:false, defaultName:'' })}
        onSave={async (name)=>{
          try{
            const snapshot: TemplateSnapshot = {
              id: uid(),
              name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              screen: 'Template1',
              state: { slots, floating },
            };
            await saveNewTemplate(snapshot);
            setSaveModal({ visible:false, defaultName:'' });
            router.push('/saved-templates');
          }catch(e){
            Alert.alert('Hata','Kaydetme sırasında bir hata oluştu.');
          }
        }}
      />
    </View>
  );
}

/* ---------- SlotBox ---------- */
const SlotBox = ({
  title, highlight, onLayoutRect, onBodyHeight, onEdit, onUndock, children,
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
      style={[
        styles.slotOuter,
        highlight ? styles.slotHighlight : null,
      ]}
      onLayout={(e)=>{
        outerRef.current?.measure((x,y,w,h,pageX,pageY)=>{
          onLayoutRect?.({ x:pageX,y:pageY,width:w,height:h });
        });
        onBodyHeight?.(e.nativeEvent.layout.height);
      }}
    >
      <View style={styles.slotHeader}>
        <Text style={styles.slotTitle}>{title}</Text>
        {onEdit && <Pressable onPress={onEdit} style={styles.slotHeaderBtn}>
          <Feather name="edit-3" size={14} color={TOKENS.textSecondary} />
        </Pressable>}
        {onUndock && <Pressable onPress={onUndock} style={styles.slotHeaderBtn}>
          <Feather name="arrow-up-right" size={14} color={TOKENS.textSecondary} />
        </Pressable>}
      </View>
      <View style={styles.slotBody}>{children}</View>
    </View>
  );
};

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:TOKENS.bg },
  header: {
    position:'absolute', top:0, left:0, right:0,
    zIndex:30, elevation:30,
    justifyContent:'flex-end', paddingHorizontal:16, paddingBottom:12,
    shadowColor:'#000', shadowOffset:{ width:0, height:2 }, shadowRadius:6,
  },
  topGlow: { height:HEADER_EXPANDED*0.66, opacity:0.8 },
  title: { fontWeight:'700', color:TOKENS.textPrimary },
  headerActionsBar: { flexDirection:'row', alignItems:'center', marginTop:8, gap:8 },
  actionBtn: {
    flexDirection:'row', alignItems:'center',
    paddingHorizontal:12, paddingVertical:8, borderRadius:8,
  },
  actionPrimary: { backgroundColor:TOKENS.accent },
  actionGhost: { backgroundColor:'rgba(125,211,252,0.12)', borderWidth:1, borderColor:'rgba(125,211,252,0.4)' },
  actionPressed: { opacity:0.75 },
  actionText: { fontWeight:'600', fontSize:13, marginLeft:6 },
  fab: {
    position:'absolute', right:16, bottom:28, zIndex:20,
    width:56, height:56, borderRadius:28,
    backgroundColor:TOKENS.accent, justifyContent:'center', alignItems:'center',
    shadowColor:'#000', shadowOpacity:0.3, shadowOffset:{ width:0, height:4 }, shadowRadius:6,
    elevation:6,
  },
  scrollContainer: { paddingHorizontal:16, paddingBottom:80, gap:16 },
  slotOuter: {
    backgroundColor:TOKENS.surface, borderRadius:16, borderWidth:1, borderColor:TOKENS.stroke,
    overflow:'hidden',
  },
  slotHighlight: { borderColor:TOKENS.accentDeep, borderWidth:2 },
  slotHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:8, borderBottomWidth:1, borderColor:TOKENS.strokeStrong },
  slotTitle: { flex:1, fontWeight:'600', color:TOKENS.textPrimary, fontSize:15 },
  slotHeaderBtn: { marginLeft:6, padding:4 },
  slotBody: { padding:12, minHeight:120 },
});
