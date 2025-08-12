import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TagSelectionScreen = () => {
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const handleClearSearch = () => {
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Etiket Seçimi</Text>
        <TouchableOpacity onPress={() => router.push('/ChartSelector')}>
          <Ionicons name="arrow-forward-circle-outline" size={32} color="#4FAAF7" />
        </TouchableOpacity>
      </View>

      {/* SearchBar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="Etiket ara..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close-circle" size={24} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Örnek sabit liste */}
      <FlatList
        data={['VCM_110_TEMP', 'PTA_150_PRESSURE', 'HDGO_FLOW', 'C100_PRESSURE']}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.tagCard}>
            <Text style={styles.tagText}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default TagSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F36',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  tagCard: {
    backgroundColor: '#1E2A47',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    color: '#fff',
    fontSize: 16,
  },
});
