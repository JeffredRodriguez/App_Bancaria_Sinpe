import { MotiView } from "moti";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/theme/ThemeProvider";

export type LeitmotivBadgeProps = {
  size?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  position?: "absolute" | "relative";
};

const MOTIF_PATH = "M4 46 Q42 -26 80 46";

const LeitmotivBadge = ({
  size = 96,
  opacity = 0.38,
  position = "absolute",
  style,
}: LeitmotivBadgeProps) => {
  const { theme } = useTheme();
  const color = theme.palette.primary;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrapper,
        { width: size, height: size * 0.68, opacity, position },
        style,
      ]}
    >
      <MotiView
        style={styles.container}
        from={{ translateY: -6, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "timing", duration: 600 }}
      >
        <Svg
          width={size}
          height={size * 0.68}
          viewBox="0 -32 84 96"
          style={styles.svg}
        >
          <Path
            d={MOTIF_PATH}
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d={MOTIF_PATH}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.7}
          />
        </Svg>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    width: "100%",
    height: "100%",
  },
});

export default LeitmotivBadge;
