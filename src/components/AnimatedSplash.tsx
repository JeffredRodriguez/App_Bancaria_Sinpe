import { LinearGradient } from "expo-linear-gradient";
import { AnimatePresence, MotiView } from "moti";
import { Image, Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

const logo = require("../../assets/bancocostarica.png");

type AnimatedSplashProps = {
  visible: boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedSplash = ({ visible, style }: AnimatedSplashProps) => {
  const { theme } = useTheme();
  const { palette } = theme;

  return (
    <AnimatePresence>
      {visible ? (
        <MotiView
          key="app-bancaria-splash"
          pointerEvents="auto"
          style={[StyleSheet.absoluteFillObject, styles.overlay, style]}
          from={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "timing", duration: 420 }}
        >
          <LinearGradient
            colors={[palette.background, "#4b0710", "#a31625"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.content}>
            <MotiView
              style={styles.logoWrapper}
              from={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "timing", duration: 620, delay: 120 }}
            >
              {Platform.OS !== "web" && <View style={styles.logoGlow} />}
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </MotiView>

            <MotiView
              style={styles.copyWrapper}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500, delay: 340 }}
            >
              <Text style={styles.copyTitle}>Banco Costa Rica</Text>
            </MotiView>
          </View>
        </MotiView>
      ) : null}
    </AnimatePresence>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
    justifyContent: "center",
    backgroundColor: "#180305",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 26,
  },
  logoWrapper: {
    width: 160,
    height: 160,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  logoGlow: {
    position: "absolute",
    width: "120%",
    height: "120%",
    borderRadius: 60,
    backgroundColor: "rgba(255, 214, 205, 0.22)",
    shadowColor: "rgba(255, 78, 57, 0.8)",
    shadowOpacity: 0.6,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
  },
  logo: {
    width: "92%",
    height: "92%",
  },
  copyWrapper: {
    alignItems: "center",
    gap: 8,
  },
  copyTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "#FFF4F2",
    textTransform: "uppercase",
  },
  copySubtitle: {
    fontSize: 14,
    color: "rgba(255,240,238,0.78)",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AnimatedSplash;
