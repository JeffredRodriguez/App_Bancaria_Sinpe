import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { PropsWithChildren, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/ThemeProvider";

type OrbConfig = {
  size: number;
  position: Partial<Record<"top" | "left" | "right" | "bottom", number>>;
  colors: [string, string];
  translate: { x: number; y: number };
  duration: number;
  delay: number;
};

type AuroraConfig = {
  width: number;
  height: number;
  position: Partial<Record<"top" | "bottom" | "left" | "right", number>>;
  rotation: string;
  colors: [string, string];
  opacity: number;
  duration: number;
  delay: number;
};

type MotifConfig = {
  position: Partial<Record<"top" | "bottom" | "left" | "right", number>>;
  scale: number;
  baseRotation: number;
  opacity: number;
  delay: number;
  spinDuration: number;
  spinDirection: 1 | -1;
  highlightOffset?: number;
  highlightWidth?: number;
  floatAmplitude: number;
  floatDuration: number;
  floatPhase?: number;
};

const ORBS: OrbConfig[] = [
  {
    size: 360,
    position: { top: -160, left: -120 },
    colors: ["rgba(248, 92, 47, 0.32)", "rgba(221, 20, 29, 0.1)"],
    translate: { x: 60, y: 80 },
    duration: 13800,
    delay: 0,
  },
  {
    size: 280,
    position: { top: 120, right: -80 },
    colors: ["rgba(240, 68, 44, 0.28)", "rgba(255, 225, 28, 0.12)"],
    translate: { x: -70, y: -60 },
    duration: 11600,
    delay: 600,
  },
  {
    size: 240,
    position: { bottom: -120, left: 10 },
    colors: ["rgba(221, 20, 29, 0.3)", "rgba(89, 19, 29, 0.12)"],
    translate: { x: 50, y: -70 },
    duration: 12400,
    delay: 400,
  },
  {
    size: 200,
    position: { top: 80, left: 120 },
    colors: ["rgba(255, 199, 37, 0.24)", "rgba(240, 67, 44, 0.1)"],
    translate: { x: -50, y: 60 },
    duration: 10400,
    delay: 1100,
  },
];

const AURORAS: AuroraConfig[] = [
  {
    width: 420,
    height: 280,
    position: { top: -60, right: -120 },
    rotation: "18deg",
    colors: ["rgba(240, 67, 44, 0.26)", "rgba(221, 20, 29, 0)"],
    opacity: 0.45,
    duration: 12000,
    delay: 0,
  },
  {
    width: 360,
    height: 260,
    position: { bottom: -120, left: -60 },
    rotation: "-24deg",
    colors: ["rgba(255, 193, 37, 0.22)", "rgba(221, 20, 29, 0)"],
    opacity: 0.42,
    duration: 11000,
    delay: 500,
  },
  {
    width: 320,
    height: 220,
    position: { top: 140, left: 40 },
    rotation: "12deg",
    colors: ["rgba(248, 107, 36, 0.2)", "rgba(221, 20, 29, 0)"],
    opacity: 0.36,
    duration: 13200,
    delay: 900,
  },
];

const ARCHES: MotifConfig[] = [
  {
    position: { bottom: 96, right: 28 },
    scale: 0.6,
    baseRotation: 4,
    opacity: 0.14,
    delay: 500,
    spinDuration: 23600,
    spinDirection: 1,
    highlightOffset: 94,
    highlightWidth: 16,
    floatAmplitude: 18,
    floatDuration: 18200,
    floatPhase: 0.35,
  },
];

const MOTIF_BASE = { width: 132, height: 88 };
const MOTIF_PATH = "M12 74 Q66 -6 120 74";

const Motif = ({ motif, strokeColor }: { motif: MotifConfig; strokeColor: string }) => {
  const spinProgress = useSharedValue(0);
  const floatProgress = useSharedValue(0);

  useEffect(() => {
    spinProgress.value = withDelay(
      motif.delay,
      withRepeat(
        withTiming(1, {
          duration: motif.spinDuration,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
    floatProgress.value = withDelay(
      motif.delay,
      withRepeat(
        withTiming(1, {
          duration: motif.floatDuration,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, [motif.delay, motif.spinDuration, motif.floatDuration, spinProgress, floatProgress]);

  const spinStyle = useAnimatedStyle(() => {
    const rotation = motif.baseRotation + motif.spinDirection * 360 * spinProgress.value;
    return {
      transform: [{ scale: motif.scale }, { rotate: `${rotation}deg` }],
    };
  });

  const flashStyle = useAnimatedStyle(() => {
    const rawRotation = motif.baseRotation + motif.spinDirection * 360 * spinProgress.value;
    const current = ((rawRotation % 360) + 360) % 360;
    const target = (((motif.baseRotation + (motif.highlightOffset ?? 90)) % 360) + 360) % 360;
    const diff = Math.abs(current - target);
    const shortest = Math.min(diff, 360 - diff);
    const width = motif.highlightWidth ?? 22;
    const intensity = Math.max(0, 1 - shortest / width);
    const flashStrength = Math.pow(intensity, 4);
    return { opacity: flashStrength };
  });

  const floatStyle = useAnimatedStyle(() => {
    const progress = floatProgress.value + (motif.floatPhase ?? 0);
    const translateY = Math.sin(progress * Math.PI * 2) * motif.floatAmplitude;
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.motif,
        {
          width: MOTIF_BASE.width,
          height: MOTIF_BASE.height,
          ...motif.position,
          opacity: motif.opacity,
        },
        floatStyle,
      ]}
      pointerEvents="none"
    >
      <Animated.View style={[styles.motifInner, spinStyle]} pointerEvents="none">
        <View style={styles.motifSvgWrapper} pointerEvents="none">
          <Svg
            width={MOTIF_BASE.width}
            height={MOTIF_BASE.height}
            viewBox="0 0 132 88"
            style={styles.motifSvg}
          >
            <Path
              d={MOTIF_PATH}
              stroke={strokeColor}
              strokeWidth={18}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
          <Animated.View style={[styles.motifOverlay, flashStyle]} pointerEvents="none">
            <Svg
              width={MOTIF_BASE.width}
              height={MOTIF_BASE.height}
              viewBox="0 0 132 88"
              style={styles.motifSvg}
            >
              <Path
                d={MOTIF_PATH}
                stroke="rgba(255,255,255,0.92)"
                strokeWidth={18}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const FuturisticBackground = ({ children }: PropsWithChildren) => {
  const { theme, themeName } = useTheme();
  const palette = theme.palette;
  
  // Colores específicos por tema
  const gradientColors: [string, string, string] = themeName === "aurora" 
    ? [palette.background, "#001a17", "#003d36"]
    : [palette.background, "#410707ff", "#7C131D"];
    
  const accentGradient: [string, string] = themeName === "aurora"
    ? ["rgba(0, 160, 148, 0.15)", "transparent"]
    : ["rgba(255, 37, 37, 0.12)", "transparent"];
    
  const noiseColor = themeName === "aurora"
    ? "rgba(0, 240, 255, 0.04)"
    : "rgba(255, 220, 210, 0.12)";
  
  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <MotiView
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        from={{ opacity: 0.25, translateY: -30 }}
        animate={{ opacity: 0.5, translateY: 30 }}
        transition={{ loop: true, type: "timing", duration: 9000 }}
      >
        <LinearGradient
          colors={accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </MotiView>
      <View style={[styles.noiseLayer, { backgroundColor: noiseColor }]} />
      <View pointerEvents="none" style={styles.auroraLayer}>
        {AURORAS.map((aurora, index) => {
          const auroraColors: [string, string] = themeName === "aurora"
            ? ["rgba(0, 160, 148, 0.20)", "rgba(0, 240, 255, 0)"]
            : aurora.colors;
          
          return (
            <MotiView
              key={`aurora-${index}`}
              style={[
                styles.aurora,
                {
                  width: aurora.width,
                  height: aurora.height,
                  borderRadius: Math.max(aurora.width, aurora.height) / 1.8,
                  ...aurora.position,
                  transform: [{ rotate: aurora.rotation }],
                },
              ]}
              from={{ opacity: aurora.opacity * 0.6, scale: 0.92 }}
              animate={{ opacity: aurora.opacity, scale: 1.05 }}
              transition={{
                loop: true,
                type: "timing",
                duration: aurora.duration,
                delay: aurora.delay,
                easing: Easing.inOut(Easing.quad),
              }}
            >
              <LinearGradient
                colors={auroraColors}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </MotiView>
          );
        })}
      </View>
      <View pointerEvents="none" style={styles.orbLayer}>
        {ORBS.map((orb, index) => {
          const orbColors: [string, string] = themeName === "aurora"
            ? ["rgba(0, 160, 148, 0.25)", "rgba(0, 201, 184, 0.08)"]
            : orb.colors;
            
          const highlightColor = themeName === "aurora"
            ? "rgba(0, 240, 255, 0.15)"
            : "rgba(255, 180, 150, 0.18)";
          
          return (
            <MotiView
              key={index}
              style={[
                styles.orb,
                {
                  width: orb.size,
                  height: orb.size,
                  borderRadius: orb.size / 2,
                  ...orb.position,
                },
              ]}
              from={{
                opacity: 0.2,
                translateX: 0,
                translateY: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 0.48,
                translateX: orb.translate.x,
                translateY: orb.translate.y,
                scale: 1.05,
              }}
              transition={{
                loop: true,
                type: "timing",
                duration: orb.duration,
                delay: orb.delay,
                easing: Easing.inOut(Easing.quad),
              }}
            >
              <LinearGradient
                colors={orbColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.orbHighlight, { backgroundColor: highlightColor }]} />
            </MotiView>
          );
        })}
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  noiseLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  auroraLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  aurora: {
    position: "absolute",
    overflow: "hidden",
    opacity: 0.4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  orbLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  orbHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.3,
  },
  motifLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  motif: {
    position: "absolute",
  },
  motifInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  motifSvgWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  motifSvg: {
    width: "100%",
    height: "100%",
  },
  motifOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default FuturisticBackground;
