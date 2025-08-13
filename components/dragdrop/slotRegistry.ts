// components/dragdrop/slotRegistry.ts
import type { LayoutRectangle } from 'react-native';
import type { SlotId } from './types';

const frames: Record<SlotId, LayoutRectangle> = {};

export const registerSlotFrame = (id: SlotId, rect: LayoutRectangle) => {
  frames[id] = rect;
};

export const unregisterSlotFrame = (id: SlotId) => {
  delete frames[id];
};

export const getSlotAtPoint = (x: number, y: number): SlotId | null => {
  for (const [id, r] of Object.entries(frames)) {
    if (x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
      return id as SlotId;
    }
  }
  return null;
};
