import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const tagList = ['TAG1', 'TAG2', 'TAG3', 'TAG4', 'TAG5'];

const ChartCenterScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length < 2) {
        setSelectedTags([...selectedTags, tag]);
      } else {
        alert('Sadece 2 tag seçebilirsiniz.');
      }
    }
  };

  const handleCompare = () => {
    if (selectedTags.length === 2) {
      router.push({
        pathname: '/TrendCompareScreen',
        params: {
          tag1: selectedTags[0],
          tag2: selectedTags[1],
        },
      });
    } else {
      alert('Lütfen 2 tag seçiniz.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Karşılaştırmak istediğin 2 tag’i seç
      </Text>

      <View style={styles.tagContainer}>
        {tagList.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagBox,
              {
                backgroundColor: selectedTags.includes(tag) ? colors.primary : colors.card,
                borderColor: selectedTags.includes(tag) ? colors.primary : colors.border,
              },
            ]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={{ color: selectedTags.includes(tag) ? '#fff' : colors.text }}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.compareButton, { borderColor: colors.primary }]} onPress={handleCompare}>
        <Text style={[styles.compareButtonText, { color: colors.primary }]}>📈 Karşılaştır</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ChartCenterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tagBox: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    margin: 6,
  },
  compareButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
