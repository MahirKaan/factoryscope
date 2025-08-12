import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const squareSize = (width * 0.9 - 40) / 2;

export default function Template2Screen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Template 2</Text>
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.square}>
            <Ionicons name="trending-up" size={28} color="#38BDF8" />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width * 0.9,
    justifyContent: 'space-between',
  },
  square: {
    backgroundColor: '#1E293B',
    width: squareSize,
    height: squareSize,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});
