import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

type ChartOption = {
  title: string;
  icon: any;
  route: string;
  description: string;
};

const chartOptions: ChartOption[] = [
  { title: 'Line Chart', icon: 'trending-up', route: '/charts/LineChartScreen', description: 'Zamana göre veri trendi' },
  { title: 'Bar Chart', icon: 'bar-chart', route: '/charts/BarChartScreen', description: 'Kategorik veri karşılaştırma' },
  { title: 'Pie Chart', icon: 'pie-chart', route: '/charts/PieChartScreen', description: 'Oransal dağılım analizi' },
  { title: 'Area Chart', icon: 'analytics', route: '/charts/AreaChartScreen', description: 'Kümülatif veri görünümü' },
  { title: 'Combined Chart', icon: 'options', route: '/charts/CombinedChartScreen', description: 'Çoklu grafik tipi birleştirme' },
];

const ChartCard = ({ item, onPress }: { item: ChartOption; onPress: () => void }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    setTimeout(onPress, 150);
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale }], opacity }]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={{ flex: 1 }}>
        <BlurView intensity={30} tint="dark" style={styles.blurBox}>
          <Ionicons name={item.icon} size={50} color="#00FFFF" style={styles.neonIcon} />
          <Text style={styles.cardText}>{item.title}</Text>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
};

const ChartTypeScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const { selected } = useLocalSearchParams();
  const selectedTags = selected ? JSON.parse(selected as string) : [];

  const filteredOptions = chartOptions.filter((item) =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderItem = ({ item }: { item: ChartOption }) => (
    <ChartCard
      item={item}
      onPress={() =>
        router.push({
          pathname: item.route,
          params: { selected: JSON.stringify(selectedTags) },
        })
      }
    />
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <LinearGradient
        colors={['#0f2027', '#203a43', '#2c5364']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={{ marginLeft: 10 }} />
        <TextInput
          placeholder="Search charts..."
          placeholderTextColor="#9ca3af"
          style={styles.searchInput}
          onChangeText={setSearchText}
          value={searchText}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" style={{ marginRight: 10 }} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredOptions}
        numColumns={2}
        keyExtractor={(item) => item.title}
        renderItem={renderItem}
        contentContainerStyle={styles.gridContainer}
      />
    </SafeAreaView>
  );
};

export default ChartTypeScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 60,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#101824aa',
    borderColor: '#2c5364',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: RFValue(14),
    color: '#fff',
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingTop: 40,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    margin: 10,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  blurBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
  },
  cardText: {
    marginTop: 10,
    color: '#ffffff',
    fontWeight: '600',
    fontSize: RFValue(14),
  },
  descriptionText: {
    marginTop: 6,
    fontSize: RFValue(12),
    color: '#cbd5e1',
    textAlign: 'center',
  },
  neonIcon: {
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
