import { mockChartData } from '@/mock/mockChartData';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

export default function LineChartScreen() {
  const { selected } = useLocalSearchParams(); // 🔄 Doğru parametre
  const [chartData, setChartData] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (selected) {
      const parsed = typeof selected === 'string' ? JSON.parse(selected) : selected;
      const tag = parsed[0]?.trim()?.toUpperCase();
      const data = mockChartData[tag];
      if (data) {
        setChartData(data);
        setSelectedTag(tag);
      } else {
        console.warn('Mock veri bulunamadı:', tag);
      }
    }
  }, [selected]);

  if (!chartData) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>Görüntülenecek tag verisi bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>{selectedTag} için Line Chart</Text>
      <LineChart
        data={{
          labels: chartData.labels,
          datasets: [{ data: chartData.values }],
        }}
        width={Dimensions.get('window').width - 32}
        height={220}
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#000',
          backgroundGradientFrom: '#1E1E1E',
          backgroundGradientTo: '#3E3E3E',
          decimalPlaces: 2,
          color: (opacity = 1) => `rgba(0, 255, 255, ${opacity})`,
          labelColor: () => '#fff',
        }}
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
    color: '#fff',
  },
  info: {
    fontSize: 16,
    color: 'gray',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
