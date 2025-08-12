import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const tags = [
  'CA_PRESSURE', 'VCM_TEMP', 'EOEG_FLOW', 'PTA_LEVEL', 'AYPET_TEMP',
  'PA_PRESSURE', 'PP_FLOW', 'YYPE_TEMP', 'BUEU_STATUS', 'AGU_LEVEL',
  'ACN_PRESSURE', 'AYPE_TEMP', 'ETILEN_FLOW', 'AROM_TEMP', 'PVC_LEVEL',
  'YNSUART_PRESSURE', 'ESUART_TEMP', 'UNIT100_FLOW', 'UNIT110_LEVEL',
  'UNIT150_PRESSURE', 'UNIT190_TEMP',
];

export default function TagSelectionScreen() {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const router = useRouter();

  const handleTagPress = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredTags = tags.filter((tag) =>
    tag.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/HomeScreen')}>
          <Ionicons name="arrow-back-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tag Seçimi</Text>

        <TouchableOpacity
          onPress={() => {
            if (selectedTags.length === 0) {
              Alert.alert('Uyarı', 'Lütfen en az bir etiket seçiniz.');
              return;
            }
            router.push({
              pathname: '/charts/ChartTypeScreen',
              params: { selected: JSON.stringify(selectedTags) },
            });
          }}
        >
          <Ionicons name="arrow-forward-circle-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.input}
          placeholder="Tag ara..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredTags}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isSelected = selectedTags.includes(item);
          return (
            <TouchableOpacity
              style={[styles.tagCard, isSelected && styles.selectedCard]}
              onPress={() => handleTagPress(item)}
            >
              <Text style={styles.tagText}>{item}</Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#0af" />
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a23',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: '#fff',
    marginLeft: 8,
  },
  tagCard: {
    backgroundColor: '#1a1a2e',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: '#0af',
    borderWidth: 1.5,
  },
  tagText: {
    color: '#fff',
    fontSize: 16,
  },
});
