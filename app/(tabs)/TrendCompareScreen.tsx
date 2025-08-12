import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const mockData = {
  labels: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25'],
  datasets: [
    {
      data: [22, 23, 21, 24, 25, 23],
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      strokeWidth: 2,
    },
    {
      data: [18, 19, 17, 20, 21, 20],
      color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
      strokeWidth: 2,
    },
  ],
  legend: ['Tag1 - TEMP', 'Tag2 - PRESSURE'],
};

const TrendCompareScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Trend Karşılaştırması</Text>

      <LineChart
        data={mockData}
        width={screenWidth - 32}
        height={260}
        chartConfig={{
          backgroundGradientFrom: colors.card,
          backgroundGradientTo: colors.card,
          decimalPlaces: 1,
          color: () => colors.text,
          labelColor: () => colors.text,
          propsForDots: {
            r: '4',
            strokeWidth: '1',
            stroke: colors.border,
          },
          yAxisSuffix: '°C',
        } as any}
        bezier
        style={styles.chart}
      />

      <View style={styles.legendContainer}>
        <Text style={[styles.legendText, { color: colors.primary }]}>🟦 Tag1 - TEMP</Text>
        <Text style={[styles.legendText, { color: colors.primary }]}>🟥 Tag2 - PRESSURE</Text>
      </View>
    </ScrollView>
  );
};

export default TrendCompareScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'center',
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  legendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  legendText: {
    fontSize: 14,
    marginVertical: 4,
  },
});
