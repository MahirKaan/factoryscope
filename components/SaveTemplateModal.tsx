// components/SaveTemplateModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SaveTemplateModal({
  visible, defaultName = '', onCancel, onSave,
}: {
  visible: boolean;
  defaultName?: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  useEffect(()=>{ if(visible) setName(defaultName); },[visible,defaultName]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Text style={s.title}>Kaydet</Text>
          <Text style={s.label}>Bu sayfayı hangi isimle kaydetmek istersin?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Örn: Vardiya - Sabah 08:00"
            placeholderTextColor="#94A3B8"
            style={s.input}
          />
          <View style={s.row}>
            <TouchableOpacity onPress={onCancel} style={[s.btn,{ backgroundColor:'rgba(148,163,184,0.15)'}]}>
              <Text style={[s.btnText,{ color:'#E2E8F0'}]}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>name.trim() && onSave(name.trim())} style={[s.btn,{ backgroundColor:'#38BDF8'}]}>
              <Text style={[s.btnText,{ color:'#0B1120'}]}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',alignItems:'center',justifyContent:'center',padding:20},
  card:{width:'100%',maxWidth:520,backgroundColor:'#0B1120',borderRadius:18,borderWidth:1,borderColor:'rgba(148,163,184,0.25)',padding:16},
  title:{color:'#E0F2FE',fontSize:18,fontWeight:'900',marginBottom:8},
  label:{color:'#93C5FD',fontSize:13,marginBottom:8},
  input:{backgroundColor:'#111827',borderWidth:1,borderColor:'rgba(148,163,184,0.25)',borderRadius:12,color:'#E5E7EB',paddingHorizontal:12,paddingVertical:10},
  row:{flexDirection:'row',justifyContent:'flex-end',gap:10,marginTop:12},
  btn:{paddingVertical:10,paddingHorizontal:14,borderRadius:12},
  btnText:{fontWeight:'900',fontSize:14},
});
