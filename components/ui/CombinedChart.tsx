// components/ui/CombinedChart.tsx
import React from 'react';
import { Dimensions, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: () => '#4B9CD3',
  labelColor: () => '#333',
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
 
};

const CombinedChartComponent = () => {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const barData = [20, 60, 45, 30, 80];

  return (
    <View>
      <BarChart
        data={{
          labels,
          datasets: [{ data: barData }],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel=""
        yAxisSuffix="%" // ✅ DOĞRU YER BURASI
        chartConfig={chartConfig}
        style={{
          marginBottom: 20,
          borderRadius: 12,
        }}
      />
    </View>
  );
};

export default CombinedChartComponent;
