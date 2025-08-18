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
  View,
  ViewStyle,
} from 'react-native';

import DraggableResizableChart from '../components/charts/DraggableResizableChart';
import ChartSettingsModal from '../components/ChartSettingsModal';
import SaveTemplateModal from '../components/SaveTemplateModal';
import { mockChartData } from '../mock/mockChartData';
import { getTemplate, saveNewTemplate, TemplateSnapshot } from '../storage/savedTemplates';

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
highlight ? styles.slotOuterHighlight : undefined,
]}
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

<View  
    style={[  
      styles.slotBody,  
      children ? ({ padding: 0 } as ViewStyle) : undefined,  
    ]}  
    onLayout={(e)=>onBodyHeight?.(e.nativeEvent.layout.height)}  
  >  
    {children ? (  
      children  
    ) : (  
      <View style={[styles.dropHint, highlight && { borderColor: TOKENS.accentDeep, backgroundColor: 'rgba(56,189,248,0.08)' }]}>  
        <Feather name="move" size={20} color="#64748B" />  
        <Text style={styles.dropHintText}>Grafiği buraya bırak</Text>  
        <Text style={styles.dropHintSub}>veya alttaki + ile oluştur</Text>  
      </View>  
    )}  
  </View>  
</View>

);
};

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
root: { flex: 1, backgroundColor: TOKENS.bg },

/* Header */
header: {
position: 'absolute',
left: 0, right: 0, top: 0,
zIndex: 10,
paddingTop: 16,
paddingHorizontal: 14,
justifyContent: 'flex-end',
shadowColor:'#000',
shadowRadius: 12,
shadowOffset:{ width:0, height:6 },
},
topGlow: {
position:'absolute', height:220, left:-50, right:-50, top:-40,
borderBottomLeftRadius:300, borderBottomRightRadius:300,
},
title: {
color:'#E0F2FE',
fontWeight:'800',
letterSpacing:0.5,
},
headerActionsBar: {
alignSelf: 'flex-end',
flexDirection: 'row',
gap: 10,
padding: 6,
paddingRight: 12,
marginTop: 8,
marginBottom: 10,
backgroundColor: 'rgba(2,6,23,0.55)',
borderWidth: 1,
borderColor: 'rgba(148,163,184,0.20)',
borderRadius: 14,
},
actionBtn: {
flexDirection: 'row',
alignItems: 'center',
gap: 8,
height: 34,
paddingHorizontal: 12,
borderRadius: 10,
},
actionPrimary: { backgroundColor: TOKENS.accent },
actionGhost: {
backgroundColor: 'rgba(30,41,59,0.65)',
borderWidth: 1,
borderColor: 'rgba(147,197,253,0.30)',
},
actionText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
actionPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },

/* FAB */
fab: {
position:'absolute',
right:18, bottom:24,
width:56, height:56, borderRadius:28,
backgroundColor: TOKENS.accent,
alignItems:'center', justifyContent:'center',
shadowColor:'#000', shadowOpacity:0.28, shadowRadius:10, shadowOffset:{ width:0, height:8 }, elevation:8,
zIndex: 9,
},

/* Scroll content */
scrollContainer: { paddingBottom:120, paddingHorizontal:14, gap:18 },

/* Slot */
slotOuter: {
minHeight: 260,
borderRadius: 24,
borderWidth: 1,
borderColor: TOKENS.stroke,
backgroundColor: TOKENS.surface,
overflow: 'hidden',
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
slotBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 4 },
dropHint: {
flex:1, borderRadius:20, borderWidth:1.5, borderStyle:'dashed',
borderColor:'rgba(148,163,184,0.28)', alignItems:'center', justifyContent:'center',
gap:4, backgroundColor:'rgba(2,6,23,0.18)',
},
dropHintText: { color:'#94A3B8', fontSize:13 },
dropHintSub: { color:'#64748B', fontSize:12 },
});