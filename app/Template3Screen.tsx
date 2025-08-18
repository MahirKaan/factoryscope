// screens/Template1Screen.tsx
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Svg, { Rect } from "react-native-svg"; // ✅ grid için
import DraggableResizableChartFloating from "../components/charts/DraggableResizableChartFloating";
import ChartSettingsModal from "../components/ChartSettingsModal";
import SaveTemplateModal from "../components/SaveTemplateModal";
import { mockChartData } from "../mock/mockChartData";
import { saveNewTemplate, TemplateSnapshot } from "../storage/savedTemplates";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type ChartConfig = {
  id: string;
  type: "line" | "last"; // ✅ chart türü
  tags: string[];
  startTime: string;
  endTime: string;
  freq: number;
  sampleType: string;
  color: string;
};

const uid = () => Math.random().toString(36).slice(2);

// ✅ Küçük kare grid ayarları
const CELL_SIZE = 10;
const CELL_MARGIN = 1;
const STEP = CELL_SIZE + CELL_MARGIN * 2;
const GRID_COLUMNS = Math.floor(SCREEN_WIDTH / STEP);
const GRID_ROWS = Math.ceil(SCREEN_HEIGHT / STEP);

const chartColors = [
  "#38BDF8",
  "#F472B6",
  "#34D399",
  "#FBBF24",
  "#A78BFA",
  "#60A5FA",
  "#FB7185",
  "#4ADE80",
  "#F87171",
  "#818CF8",
  "#FDBA74",
];

export default function Template1Screen() {
  const router = useRouter();
  const { openSavedId } = useLocalSearchParams<{ openSavedId?: string }>();

  const [floating, setFloating] = useState<
    { id: string; cfg: ChartConfig; x: number; y: number; w: number; h: number }[]
  >([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editDraft, setEditDraft] = useState<{ cfg: ChartConfig | null }>({
    cfg: null,
  });
  const [saveModal, setSaveModal] = useState<{
    visible: boolean;
    defaultName: string;
  }>({
    visible: false,
    defaultName: "",
  });

  const [fabOpen, setFabOpen] = useState(false); // ✅ FAB menü açık mı
  const [activeCells, setActiveCells] = useState<Set<string>>(new Set()); // ✅ highlight kareler

  const onPlus = () => setFabOpen((prev) => !prev);

  // Chart ekleme
  const createFloating = (type: "line" | "last") => {
    const cfg: ChartConfig = {
      id: uid(),
      type,
      tags: [],
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      freq: 60,
      sampleType: "AVG",
      color: chartColors[Math.floor(Math.random() * chartColors.length)],
    };
    setFloating((prev) => [
      ...prev,
      { id: cfg.id, cfg, x: 50, y: 150, w: 160, h: 120 },
    ]);
  };

  // Snap-to-grid
  const snapToGrid = (x: number, y: number, w: number, h: number) => {
    const col = Math.round(x / STEP);
    const row = Math.round(y / STEP);
    return {
      x: col * STEP,
      y: row * STEP,
      w: Math.round(w / STEP) * STEP,
      h: Math.round(h / STEP) * STEP,
    };
  };

  // ✅ highlight için aktif kare hesapla
  const updateActiveCells = (x: number, y: number, w: number, h: number) => {
    const newSet = new Set<string>();
    const startCol = Math.floor(x / STEP);
    const startRow = Math.floor(y / STEP);
    const endCol = Math.ceil((x + w) / STEP);
    const endRow = Math.ceil((y + h) / STEP);

    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        newSet.add(`${r}-${c}`);
      }
    }
    setActiveCells(newSet);
  };

  // ✅ HATA FIX: ChartSettingsModal’dan gelen ayarları uygula
    // ✅ handleApplySettings fonksiyonunu güncelle
const handleApplySettings = (
  payload: {
    tags: string[];
    startTime: string | null;
    endTime: string | null;
    freq: number | null;
    sampleType: string | null;
  },
  id?: string
) => {
  if (!id) return;

  setFloating((prev) =>
    prev.map((f) =>
      f.id === id
        ? {
            ...f,
            cfg: {
              ...f.cfg,
              tags: payload.tags,
              startTime: payload.startTime ?? "",   // null ise boş string
              endTime: payload.endTime ?? "",       // null ise boş string
              freq: payload.freq ?? 0,              // null ise 0
              sampleType: payload.sampleType ?? "AVG", // null ise default "AVG"
            },
          }
        : f
    )
  );

  setModalVisible(false);
};



  

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={["#0B1120", "#0B1120"]}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.title}>Template 1</Text>

        <View style={styles.headerActionsBar}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
                () => {}
              );
              const defaultName = `Template1 - ${new Date().toLocaleTimeString(
                "tr-TR",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}`;
              setSaveModal({ visible: true, defaultName });
            }}
            style={[styles.actionBtn, styles.actionPrimary]}
          >
            <Feather name="save" size={16} color="#0B1120" />
            <Text style={[styles.actionText, { color: "#0B1120" }]}>
              Kaydet
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/saved-templates")}
            style={[styles.actionBtn, styles.actionGhost]}
          >
            <Feather name="folder" size={16} color="#BAE6FD" />
            <Text style={[styles.actionText, { color: "#BAE6FD" }]}>
              Kayıtlar
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ✅ Grid (SVG) */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.gridSvg}>
        {Array.from({ length: GRID_ROWS }).map((_, row) =>
          Array.from({ length: GRID_COLUMNS }).map((_, col) => {
            const key = `${row}-${col}`;
            const isActive = activeCells.has(key);
            return (
              <Rect
                key={key}
                x={col * STEP}
                y={row * STEP}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                ry={2}
                fill={isActive ? "rgba(56,189,248,0.8)" : "rgba(255,255,255,0.05)"}
                stroke={
                  isActive
                    ? "rgba(56,189,248,1)"
                    : "rgba(255,255,255,0.08)"
                }
                strokeWidth={isActive ? 1 : 0.5}
              />
            );
          })
        )}
      </Svg>

      {/* Floating charts */}
      {floating.map((f) => (
        <DraggableResizableChartFloating
          key={f.id}
          data={[]}
          labels={[]}
          tags={f.cfg.tags}
          sampleType={f.cfg.sampleType}
          freq={f.cfg.freq}
          mode="floating"
          initialPosition={{ x: f.x, y: f.y }}
          initialSize={{ width: f.w, height: f.h }}
          onDelete={() =>
            setFloating((prev) => prev.filter((x) => x.id !== f.id))
          }
          onDragMove={({ absX, absY, width, height }) => {
            updateActiveCells(absX, absY, width, height);
          }}
          onDrop={({ absX, absY, width, height }) => {
            const snapped = snapToGrid(absX, absY, width, height);
            setFloating((prev) =>
              prev.map((x) =>
                x.id === f.id
                  ? {
                      ...x,
                      x: snapped.x,
                      y: snapped.y,
                      w: snapped.w,
                      h: snapped.h,
                    }
                  : x
              )
            );
            setActiveCells(new Set());
          }}
        />
      ))}

      {/* ✅ FAB Menü */}
      <View style={styles.fabContainer}>
        {fabOpen && (
          <>
            {/* Line Chart butonu */}
            <Pressable
              onPress={() => {
                createFloating("line");
                setFabOpen(false);
              }}
              style={[styles.fabSmall, { right: 80 }]}
            >
              <Feather name="activity" size={18} color="#0B1120" />
            </Pressable>

            {/* Last Value butonu */}
            <Pressable
              onPress={() => {
                createFloating("last");
                setFabOpen(false);
              }}
              style={[styles.fabSmall, { right: 150 }]}
            >
              <Feather name="hash" size={18} color="#0B1120" />
            </Pressable>
          </>
        )}

        {/* Ana FAB */}
        <Pressable onPress={onPlus} style={styles.fabMain}>
          <Feather name={fabOpen ? "x" : "plus"} size={22} color="#0B1120" />
        </Pressable>
      </View>

      {/* Modals */}
      <ChartSettingsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onApply={(payload) =>
          handleApplySettings(payload, editDraft.cfg?.id)
        }
        tagOptions={Object.keys(mockChartData)}
      />
      <SaveTemplateModal
        visible={saveModal.visible}
        defaultName={saveModal.defaultName}
        onCancel={() =>
          setSaveModal({ visible: false, defaultName: "" })
        }
        onSave={async (name) => {
          try {
            const snapshot: TemplateSnapshot = {
              id: uid(),
              name,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              screen: "Template1",
              state: { slots: {}, floating },
            };
            await saveNewTemplate(snapshot);
            setSaveModal({ visible: false, defaultName: "" });
            router.push("/saved-templates");
          } catch (e) {
            Alert.alert("Hata", "Kaydetme sırasında bir hata oluştu.");
          }
        }}
      />
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B1120" },

  header: {
    paddingTop: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#E0F2FE", fontWeight: "900", fontSize: 28 },
  headerActionsBar: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 10,
  },
  actionPrimary: { backgroundColor: "#7DD3FC" },
  actionGhost: {
    backgroundColor: "rgba(30,41,59,0.65)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.30)",
  },
  actionText: { fontSize: 13, fontWeight: "900" },

  gridSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  fabContainer: {
    position: "absolute",
    right: 18,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7DD3FC",
    alignItems: "center",
    justifyContent: "center",
  },
  fabSmall: {
    position: "absolute",
    bottom: 0,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#7DD3FC",
    alignItems: "center",
    justifyContent: "center",
  },
});