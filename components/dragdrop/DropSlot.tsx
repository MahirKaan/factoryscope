// components/dragdrop/DropSlot.tsx
import React, { useCallback, useEffect, useRef } from 'react';
import { View, ViewStyle } from 'react-native';
import { useDragDrop } from './DragDropContext';
import type { SlotId, WidgetType } from './types';

type Props = {
  id: SlotId;
  style?: ViewStyle;
  children?: React.ReactNode;
  /** Bu slot hangi widget tiplerini kabul eder */
  accepts?: WidgetType[];
};

export const DropSlot: React.FC<Props> = ({ id, style, children, accepts }) => {
  const ref = useRef<View>(null);
  const { setSlotFrame, upsertSlotMeta, hoveredSlotId } = useDragDrop();

  // mount olduğunda meta yaz + ilk ölçümü yap
  useEffect(() => {
    if (accepts?.length) upsertSlotMeta(id, { accepts });
    // küçük bir zaman verip ölç
    const t = setTimeout(() => {
      ref.current?.measureInWindow?.((x, y, width, height) => {
        setSlotFrame(id, { x, y, width, height });
      });
    }, 0);
    return () => clearTimeout(t);
  }, [id, accepts, setSlotFrame, upsertSlotMeta]);

  // layout değiştikçe tekrar ölç
  const onLayout = useCallback(() => {
    ref.current?.measureInWindow?.((x, y, width, height) => {
      setSlotFrame(id, { x, y, width, height });
    });
  }, [id, setSlotFrame]);

  const isHovered = hoveredSlotId === id;

  return (
    <View
      ref={ref}
      onLayout={onLayout}
      style={[
        {
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isHovered ? '#4C88FF' : '#2a3442',
          backgroundColor: 'transparent',
          padding: 0,
          minHeight: 140,
        },
        isHovered && { shadowColor: '#4C88FF', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default DropSlot;
