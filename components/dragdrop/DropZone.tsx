// components/dragdrop/DropZone.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { View, ViewStyle } from 'react-native';
import { useDragDrop } from './DragDropContext';
import type { Slot, SlotId } from './types';

type Rect = { x: number; y: number; width: number; height: number };

const rectChanged = (a?: Rect, b?: Rect, eps = 0.5) => {
  if (!a || !b) return true;
  return (
    Math.abs(a.x - b.x) > eps ||
    Math.abs(a.y - b.y) > eps ||
    Math.abs(a.width - b.width) > eps ||
    Math.abs(a.height - b.height) > eps
  );
};

export default function DropZone({
  id,
  accepts,
  style,
  children,
  onHoverChange,
}: {
  id: SlotId;
  accepts: Slot['accepts'];
  style?: ViewStyle;
  children?: React.ReactNode;
  onHoverChange?: (hover: boolean) => void;
}) {
  const { registerSlot, hoveredSlotId } = useDragDrop();
  const ref = useRef<View>(null);

  const slotDescriptor = useMemo<Slot>(() => {
    return { id, accepts, widgetId: `lastValue:${id}` };
  }, [id, accepts]);

  const lastRectRef = useRef<Rect | null>(null);
  const lastHoverRef = useRef<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const measureAndRegister = () => {
      if (!mounted) return;
      ref.current?.measureInWindow?.((x, y, width, height) => {
        const rect = { x, y, width, height };
        if (rectChanged(lastRectRef.current ?? undefined, rect)) {
          lastRectRef.current = rect;
          registerSlot(id, slotDescriptor, rect);
        }
      });
    };

    // İlk ölçüm + aralıklı
    const t0 = setTimeout(measureAndRegister, 0);
    const t = setInterval(measureAndRegister, 800);

    return () => {
      mounted = false;
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [id, slotDescriptor, registerSlot]);

  // Hover değişimini sadece değiştiğinde bildir
  useEffect(() => {
    const isHover = hoveredSlotId === id;
    if (isHover !== lastHoverRef.current) {
      lastHoverRef.current = isHover;
      onHoverChange?.(isHover);
    }
  }, [hoveredSlotId, id, onHoverChange]);

  return (
    <View ref={ref} style={[{ flex: 1 }, style]} pointerEvents="box-none">
      {children}
    </View>
  );
}
