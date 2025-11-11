import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export type MarqueeTextProps = {
  text: string;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  speedFactor?: number;
  gap?: number;
  delay?: number;
  isActive?: boolean;
};

const MarqueeText = ({
  text,
  containerStyle,
  textStyle,
  speedFactor = 48,
  gap = 32,
  delay = 600,
  isActive = true,
}: MarqueeTextProps) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const shouldAnimate = useMemo(() => {
    return isActive && contentWidth > containerWidth && containerWidth > 0;
  }, [containerWidth, contentWidth, isActive]);

  const stopAnimation = () => {
    animationRef.current?.stop();
    animationRef.current = null;
    translateX.stopAnimation();
    translateX.setValue(0);
  };

  useEffect(() => {
    if (!shouldAnimate) {
      stopAnimation();
      return;
    }

    const distance = contentWidth + gap;
    const duration = Math.max(400, (distance / speedFactor) * 1000);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateX, {
          toValue: -distance,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animationRef.current = animation;
    animation.start();

    return () => {
      stopAnimation();
    };
  }, [delay, gap, shouldAnimate, speedFactor, contentWidth, translateX]);

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (!Number.isFinite(width) || width <= 0) {
      return;
    }
    setContentWidth((prev) => (Math.abs(prev - width) < 0.5 ? prev : width));
  };

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={handleContainerLayout}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.track,
          shouldAnimate ? { transform: [{ translateX }] } : null,
        ]}
      >
        <Text style={[styles.text, textStyle]} numberOfLines={1}>
          {text}
        </Text>
        {shouldAnimate ? (
          <Text
            style={[styles.text, textStyle, { marginLeft: gap }]}
            numberOfLines={1}
          >
            {text}
          </Text>
        ) : null}
      </Animated.View>
      <Text
        style={[styles.text, textStyle, styles.measure]}
        numberOfLines={1}
        onLayout={handleContentLayout}
        pointerEvents="none"
        accessible={false}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  track: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    color: "#fff",
  },
  measure: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    flexShrink: 0,
  },
});

export default MarqueeText;
