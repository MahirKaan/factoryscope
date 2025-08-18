// components/dragdrop/DragDropContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DragDropContextValue, Slot, SlotId, SlotRect } from './types';

type ProviderProps = {
  children: React.ReactNode;

  // Template2Screen’den veriyoruz
  initialSlots?: Slot[];

  // Scroll kilidi (drag sırasında)
  setScrollLocked?: (v: boolean) => void;

  // Dışarıya slot değişimini bildirmek için
  onChange?: (slots: Partial<Record<SlotId, Slot>> | null) => void;
};

const DragDropContext = createContext<DragDropContextValue>({
  slots: null,
  hoveredSlotId: null,
  registerSlot: (_id, _slot, _rect) => {},
  updateHover: (_absX: number, _absY: number) => {},
  cancelDrag: () => {},
});

export function DragDropProvider({
  children,
  initialSlots,
  setScrollLocked,
  onChange,
}: ProviderProps) {
  // Sadece Slot map’i (rect’ler ayrı tutulur)
  const [slotMap, setSlotMap] = useState<Partial<Record<SlotId, Slot>> | null>(
    null
  );

  // Slot’ların ekran rect’leri (hover hesaplamak için)
  const rectMapRef = useRef<Partial<Record<SlotId, SlotRect>>>({});

  const [hoveredSlotId, setHoveredSlotId] = useState<SlotId | null>(null);

  // İlk slotları yerleştir
  useEffect(() => {
    if (!initialSlots || !initialSlots.length) {
      setSlotMap(null);
      return;
    }
    const next: Partial<Record<SlotId, Slot>> = {};
    initialSlots.forEach((s) => {
      next[s.id] = { ...s };
    });
    setSlotMap(next);
    onChange?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSlots]);

  // DropZone’dan kayıt/güncelleme
  const registerSlot = (id: SlotId, slot: Slot, rect: SlotRect) => {
    setSlotMap((prev) => {
      const cur = prev ? { ...prev } : {};
      const before = cur[id];
      const changed =
        !before ||
        before.widgetId !== slot.widgetId ||
        before.accepts !== slot.accepts;

      if (changed) {
        cur[id] = { ...slot };
      }

      // rect’i internal map’te tut
      const prevRect = rectMapRef.current[id];
      const rectChanged =
        !prevRect ||
        Math.abs(prevRect.x - rect.x) > 0.5 ||
        Math.abs(prevRect.y - rect.y) > 0.5 ||
        Math.abs(prevRect.width - rect.width) > 0.5 ||
        Math.abs(prevRect.height - rect.height) > 0.5;

      if (rectChanged) {
        rectMapRef.current[id] = rect;
      }

      if (changed) {
        onChange?.(cur);
        return cur;
      }
      return prev ?? cur;
    });
  };

  // Drag sırasında hover güncelleme
  const updateHover = (absX: number, absY: number) => {
    let hit: SlotId | null = null;
    const rectMap = rectMapRef.current;
    const keys = Object.keys(rectMap) as SlotId[];
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const r = rectMap[k];
      if (!r) continue;
      const inside =
        absX >= r.x &&
        absX <= r.x + r.width &&
        absY >= r.y &&
        absY <= r.y + r.height;
      if (inside) {
        hit = k;
        break;
      }
    }
    if (hit !== hoveredSlotId) {
      setHoveredSlotId(hit);
    }
  };

  const cancelDrag = () => {
    setHoveredSlotId(null);
    setScrollLocked?.(false);
  };

  const value = useMemo<DragDropContextValue>(
    () => ({
      slots: slotMap,
      hoveredSlotId,
      registerSlot,
      updateHover,
      cancelDrag,
    }),
    [slotMap, hoveredSlotId]
  );

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  );
}

export const useDragDrop = () => useContext(DragDropContext);
