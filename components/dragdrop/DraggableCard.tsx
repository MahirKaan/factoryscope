// components/dragdrop/DraggableCard.tsx
import React, { useRef } from 'react';
import { Animated, PanResponder, ViewStyle } from 'react-native';
import { useDragDrop } from './DragDropContext';
import type { SlotId, Widget } from './types';

type Props = {
  widget: Widget;        // { id, type }
  fromSlotId: SlotId;    // bulunduğu slot
  children: React.ReactNode;
  style?: ViewStyle;
};

const DraggableCard: React.FC<Props> = ({ widget, fromSlotId, children, style }) => {
  const { beginDrag, updateHover, finishDrag, cancelDrag } = useDragDrop();
  const scale = useRef(new Animated.Value(1)).current;

  const lift = () =>
    Animated.spring(scale, { toValue: 1.04, useNativeDriver: true, friction: 6, tension: 120 });
  const drop = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 });

  // tıklama vs. için küçük eşik
  const THRESHOLD = 6;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dx) + Math.abs(g.dy) > THRESHOLD,
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderGrant: () => {
        // drag başlat
        beginDrag({ widgetId: widget.id, from: fromSlotId, type: widget.type });
        lift().start();
      },

      onPanResponderMove: (_evt, gesture) => {
        // ekran koordinatı ile hover güncelle
        updateHover(gesture.moveX, gesture.moveY);
      },

      onPanResponderRelease: () => {
        finishDrag();
        drop().start();
      },
      onPanResponderTerminate: () => {
        cancelDrag();
        drop().start();
      },
      onPanResponderTerminationRequest: () => true,
    })
  ).current;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]} {...responder.panHandlers}>
      {children}
    </Animated.View>
  );
};

export { DraggableCard };
export default DraggableCard;
