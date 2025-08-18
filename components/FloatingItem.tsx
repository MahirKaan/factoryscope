// components/FloatingItem.tsx
import React, { useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";

type FloatingItemProps = {
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
};

export default function FloatingItem({
  children,
  initialPosition = { x: 50, y: 50 },
}: FloatingItemProps) {
  const pan = useRef(new Animated.ValueXY(initialPosition)).current;
  const [zIndex, setZIndex] = useState(1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setZIndex(99); // sürüklenen item öne gelsin
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setZIndex(1); // bırakınca eski haline dön
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.floating,
        {
          transform: pan.getTranslateTransform(),
          zIndex,
        },
      ]}
    >
      <View>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: "absolute",
  },
});
