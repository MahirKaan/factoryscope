// components/dragdrop/types.ts
export type LVSlotId = 'lv1' | 'lv2' | 'lv3' | 'lv4';
export type SlotId = LVSlotId;

// Kabul edilen widget tipleri
export type AcceptKind = 'lastValue';

// Drop alanı tanımı
export type Slot = {
  id: SlotId;
  accepts: AcceptKind[];
  widgetId?: string; // örn: "lastValue:lv1"
};

// Ekran koordinatları (absolute)
export type SlotRect = { x: number; y: number; width: number; height: number };

// Context’in dışarı verdiği API
export type DragDropContextValue = {
  // Sadece slot bilgileri (rect’ler internal)
  slots: Partial<Record<SlotId, Slot>> | null;

  // Hover edilen slot (drag sırasında)
  hoveredSlotId: SlotId | null;

  // DropZone’lar kayıt/ölçüm güncellemesi yapar
  registerSlot: (id: SlotId, slot: Slot, rect: SlotRect) => void;

  // LV kartını sürüklerken çağırıp hover slot’u hesaplar
  updateHover: (absX: number, absY: number) => void;

  // Drag bitti/iptal → hover temizle
  cancelDrag: () => void;
};
