// app/saved-templates.tsx
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { deleteTemplate, loadList, renameTemplate } from '../storage/savedTemplates';

export default function SavedTemplatesRoute() {
  const [items, setItems] = React.useState<any[]>([]);
  const [ren, setRen] = React.useState<{ open: boolean; id?: string; value: string }>({ open: false, value: '' });
  const router = useRouter();

  // sayfaya odaklanınca kayıtları yenile
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        const list = await loadList();
        if (mounted) setItems(list);
      })();
      return () => { mounted = false; };
    }, [])
  );

  const refresh = async () => {
    const list = await loadList();
    setItems(list);
  };

  const onOpen = (id: string) => {
    // Template1 ekrano /MainScreen route'unda
    router.push({ pathname: '/MainScreen', params: { openSavedId: id } });
  };

  const onDelete = (id: string) => {
    Alert.alert('Silinsin mi?', 'Bu kaydı silmek istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => { await deleteTemplate(id); refresh(); },
      },
    ]);
  };

  const onRename = (id: string, currentName: string) => {
    // Platform bağımsız rename modal
    setRen({ open: true, id, value: currentName });
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity onPress={() => onOpen(item.id)} style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Feather name="file-text" size={18} color="#93C5FD" />
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
      </View>
      <Text style={s.time}>{new Date(item.updatedAt ?? item.createdAt).toLocaleString('tr-TR')}</Text>
      <View style={s.actions}>
        <TouchableOpacity onPress={() => onRename(item.id, item.name)} style={s.actionBtn}>
          <Feather name="edit-2" size={14} color="#93C5FD" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={[s.actionBtn, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.25)' }]}
        >
          <Feather name="trash-2" size={14} color="#F87171" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      <Text style={s.title}>Kayıtlar</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        numColumns={2}
        ListEmptyComponent={<Text style={s.empty}>Henüz kayıt yok. Üstten “Kaydet” ile yeni kayıt oluştur.</Text>}
      />

      {/* Rename Modal (Android + iOS) */}
      <Modal visible={ren.open} transparent animationType="fade" onRequestClose={()=>setRen(p=>({ ...p, open:false }))}>
        <View style={s.mBackdrop}>
          <View style={s.mCard}>
            <Text style={s.mTitle}>Yeniden Adlandır</Text>
            <TextInput
              value={ren.value}
              onChangeText={(t)=>setRen(p=>({ ...p, value:t }))}
              placeholder="Yeni isim"
              placeholderTextColor="#94A3B8"
              style={s.mInput}
            />
            <View style={s.mRow}>
              <TouchableOpacity onPress={()=>setRen(p=>({ ...p, open:false }))} style={[s.mBtn, { backgroundColor:'rgba(148,163,184,0.15)'}]}>
                <Text style={s.mBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async ()=>{
                  if(!ren.id || !ren.value.trim()) return;
                  await renameTemplate(ren.id, ren.value.trim());
                  setRen({ open:false, value:'', id:undefined });
                  refresh();
                }}
                style={[s.mBtn, { backgroundColor:'#38BDF8' }]}
              >
                <Text style={[s.mBtnText, { color:'#0B1120' }]}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:'#0B1120', paddingHorizontal:14, paddingTop:56 },
  title:{ color:'#E0F2FE', fontSize:22, fontWeight:'900', marginBottom:12 },
  list:{ paddingBottom:80, gap:12 },
  card:{ flex:1, minHeight:120, margin:6, padding:12, borderRadius:16, borderWidth:1, borderColor:'rgba(148,163,184,0.22)', backgroundColor:'rgba(2,6,23,0.35)' },
  name:{ color:'#BAE6FD', fontSize:14, fontWeight:'900', flexShrink:1 },
  time:{ color:'#94A3B8', fontSize:11, marginTop:6 },
  actions:{ flexDirection:'row', gap:8, marginTop:10 },
  actionBtn:{ paddingVertical:6, paddingHorizontal:8, borderRadius:8, borderWidth:1, borderColor:'rgba(147,197,253,0.35)', backgroundColor:'rgba(30,41,59,0.6)' },
  empty:{ color:'#94A3B8', textAlign:'center', marginTop:40, fontSize:13 },

  // modal
  mBackdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center', padding:20 },
  mCard:{ width:'100%', maxWidth:520, backgroundColor:'#0B1120', borderRadius:18, borderWidth:1, borderColor:'rgba(148,163,184,0.25)', padding:16 },
  mTitle:{ color:'#E0F2FE', fontSize:18, fontWeight:'900', marginBottom:8 },
  mInput:{ backgroundColor:'#111827', borderWidth:1, borderColor:'rgba(148,163,184,0.25)', borderRadius:12, color:'#E5E7EB', paddingHorizontal:12, paddingVertical:10 },
  mRow:{ flexDirection:'row', justifyContent:'flex-end', gap:10, marginTop:12 },
  mBtn:{ paddingVertical:10, paddingHorizontal:14, borderRadius:12 },
  mBtnText:{ fontWeight:'900', fontSize:14, color:'#E2E8F0' },
});
