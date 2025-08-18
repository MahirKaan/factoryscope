import { Feather } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

type Props = {
  id: string;
  title: string;
  onSwap: (id: string, overId: string) => void;
  boxRects: React.MutableRefObject<Record<string, {x:number,y:number,w:number,h:number}>>;
};

export default function DraggableTagBox({ id, title, onSwap, boxRects }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useRef(false);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.offsetX = translateX.value;
      ctx.offsetY = translateY.value;
      dragging.current = true;
    },
    onActive: (event, ctx: any) => {
      translateX.value = ctx.offsetX + event.translationX;
      translateY.value = ctx.offsetY + event.translationY;
    },
    onEnd: (event) => {
      dragging.current = false;
      const dropX = event.absoluteX;
      const dropY = event.absoluteY;

      // başka kutucuğun üstüne bırakıldı mı kontrol et
      for (const key in boxRects.current) {
        if (key !== id) {
          const rect = boxRects.current[key];
          if (
            dropX >= rect.x &&
            dropX <= rect.x + rect.w &&
            dropY >= rect.y &&
            dropY <= rect.y + rect.h
          ) {
            onSwap(id, key);
            break;
          }
        }
      }

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
  });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    zIndex: dragging.current ? 10 : 0,
  }));

  return (
    <Animated.View
      style={[styles.box, style]}
      onLayout={(e) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        boxRects.current[id] = { x, y, w: width, h: height };
      }}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {/* sadece ikona basınca drag başlar */}
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={styles.dragHandle}>
            <Feather name="move" size={18} color="#93C5FD" />
          </Animated.View>
        </PanGestureHandler>
      </View>
      <Text style={styles.text}>tag</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    backgroundColor: 'rgba(2,6,23,0.35)',
    padding: 8,
    margin: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#E6F0FF', fontWeight: 'bold' },
  text: { color: '#8FA3BF', marginTop: 4 },
  dragHandle: { padding: 6 },
});
