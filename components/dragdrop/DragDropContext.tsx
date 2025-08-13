// components/dragdrop/DragDropContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LayoutRectangle } from 'react-native';
import type { Slot, SlotId, WidgetType } from './types';

/**
 * SlotState: her slot id -> Slot (widgetId dahil) map'i
 * BUNU export ediyoruz; Template2Screen bundan import ediyor.
 */
export type SlotState = Record<SlotId, Slot>;

/** ---- internal types ---- */
type DragToken = {
  widgetId: string;
  from: SlotId;
  type: WidgetType;
};

type SlotMeta = {
  frame?: LayoutRectangle;
  accepts?: WidgetType[];
};
type SlotMetaMap = Record<SlotId, SlotMeta>;

type CtxValue = {
  // data
  slots: SlotState;
  hoveredSlotId: SlotId | null;

  // drag api
  beginDrag: (payload: DragToken) => void;
  updateHover: (x: number, y: number) => void;
  finishDrag: () => void;
  cancelDrag: () => void;

  // drop-slot api
  setSlotFrame: (slotId: SlotId, rect: LayoutRectangle) => void;
  upsertSlotMeta: (slotId: SlotId, meta: Partial<SlotMeta>) => void;
};

const Ctx = createContext<CtxValue | null>(null);

type ProviderProps = {
  children: React.ReactNode;
  /** ilk yükte slot dizisi (id/accepts/widgetId içeren)  */
  initialSlots?: Slot[];
  /** Scroll'u kilitlemek istiyorsan dışarıya event */
  setScrollLocked?: (v: boolean) => void;
  /** Slots değiştiğinde haber verme */
  onChange?: (slots: SlotState) => void;
};

export const DragDropProvider: React.FC<ProviderProps> = ({
  children,
  initialSlots = [],
  setScrollLocked: _setScrollLocked,
  onChange,
}) => {
  const [slots, setSlots] = useState<SlotState>(() => {
    const map: SlotState = {} as SlotState;
    initialSlots.forEach((s) => (map[s.id] = { ...s }));
    return map;
  });

  // DropSlot ölçümleri
  const slotMetaRef = useRef<SlotMetaMap>({});

  // drag state
  const dragRef = useRef<DragToken | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<SlotId | null>(null);

  /** dışarıya onChange */
  useEffect(() => {
    onChange?.(slots);
  }, [slots, onChange]);

  /** kullanışlı yardımcılar */
  const pointInRect = (x: number, y: number, r?: LayoutRectangle) =>
    !!r && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;

  /** drag api */
  const beginDrag = useCallback((payload: DragToken) => {
    dragRef.current = payload;
    _setScrollLocked?.(true);
  }, [_setScrollLocked]);

  const updateHover = useCallback((x: number, y: number) => {
    // hangi frame'in üstündeyiz?
    let next: SlotId | null = null;
    const meta = slotMetaRef.current;
    for (const sid in meta) {
      const fr = meta[sid].frame;
      if (pointInRect(x, y, fr)) {
        next = sid as SlotId;
        break;
      }
    }
    setHoveredSlotId(next);
  }, []);

  const finishDrag = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    _setScrollLocked?.(false);

    setSlots((prev) => {
      // hiçbir şeyin üstüne bırakılmadıysa değişiklik yok
      if (!hoveredSlotId || hoveredSlotId === drag.from) return prev;

      // kabul kontrolü (accepts)
      const meta = slotMetaRef.current;
      const accepts = meta[hoveredSlotId]?.accepts;
      if (accepts && !accepts.includes(drag.type)) return prev;

      // SWAP mantığı
      const fromSlot = prev[drag.from];
      const toSlot = prev[hoveredSlotId];
      if (!fromSlot || !toSlot) return prev;

      const next: SlotState = { ...prev, [drag.from]: { ...fromSlot }, [hoveredSlotId]: { ...toSlot } };
      const tmp = next[hoveredSlotId].widgetId;
      next[hoveredSlotId].widgetId = drag.widgetId;
      next[drag.from].widgetId = tmp; // toSlot boşsa undefined olur, “taşıma” gibi davranır

      return next;
    });

    dragRef.current = null;
    setHoveredSlotId(null);
  }, [_setScrollLocked, hoveredSlotId]);

  const cancelDrag = useCallback(() => {
    dragRef.current = null;
    setHoveredSlotId(null);
    _setScrollLocked?.(false);
  }, [_setScrollLocked]);

  /** drop-slot api */
  const setSlotFrame = useCallback((slotId: SlotId, rect: LayoutRectangle) => {
    slotMetaRef.current[slotId] = {
      ...(slotMetaRef.current[slotId] ?? {}),
      frame: rect,
    };
  }, []);

  const upsertSlotMeta = useCallback((slotId: SlotId, meta: Partial<SlotMeta>) => {
    slotMetaRef.current[slotId] = {
      ...(slotMetaRef.current[slotId] ?? {}),
      ...meta,
    };
  }, []);

  const value = useMemo<CtxValue>(
    () => ({
      slots,
      hoveredSlotId,
      beginDrag,
      updateHover,
      finishDrag,
      cancelDrag,
      setSlotFrame,
      upsertSlotMeta,
    }),
    [slots, hoveredSlotId, beginDrag, updateHover, finishDrag, cancelDrag, setSlotFrame, upsertSlotMeta]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useDragDrop = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDragDrop must be used inside DragDropProvider');
  return v;
};
