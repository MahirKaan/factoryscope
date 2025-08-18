import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { mockChartData } from "../../mock/mockChartData";

type Props = {
  tags: string[];
  color?: string;
};

export default function LastValueBox({ tags, color = "#38BDF8" }: Props) {
  const tag = tags[0];
  const values = mockChartData[tag]?.values ?? [];
  const lastVal = values.length ? values[values.length - 1] : null;

  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={styles.label}>{tag}</Text>
      <Text style={[styles.value, { color }]}>
        {lastVal !== null ? lastVal.toString() : "-"}
      </Text>
      <Feather name="hash" size={20} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
});
