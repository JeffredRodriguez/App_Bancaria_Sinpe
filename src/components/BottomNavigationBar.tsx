import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGlobalSearchParams, usePathname, useRouter, useSegments } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing as AnimatedEasing,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Easing } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { themes } from "@/theme/colors";
import { Theme, useTheme } from "@/theme/ThemeProvider";

export type BottomNavItem = {
  key: string;
  label: string;
  icon: string;
  route: string;
  accent: string;
};

const items: BottomNavItem[] = [
  {
    key: "balance",
    label: "Saldo",
    icon: "wallet",
    route: "/(app)/home",
    accent: "",
  },
  {
    key: "transfer",
    label: "Transferir",
    icon: "bank-transfer",
    route: "/(app)/transfer",
    accent: "",
  },
  {
    key: "history",
    label: "Historial",
    icon: "history",
    route: "/(app)/history",
    accent: "",
  },
  {
    key: "recharge",
    label: "Recarga",
    icon: "cellphone-nfc",
    route: "/(app)/mobile-recharge",
    accent: "",
  },
  {
    key: "charges",
    label: "Cobros",
    icon: "hand-coin-outline",
    route: "/(app)/charges",
    accent: "",
  },
  {
    key: "profile",
    label: "Perfil",
    icon: "account-circle",
    route: "/(app)/profile",
    accent: "",
  },
];

type ItemLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const segmentToKey: Record<string, BottomNavItem["key"]> = {
  home: "balance",
  history: "history",
  transfer: "transfer",
  "confirm-transfer": "transfer",
  "mobile-recharge": "recharge",
  charges: "charges",
  profile: "profile",
  "profile-qr": "profile",
  "financial-education": "profile",
  automations: "profile",
  notifications: "profile",
  contacts: "transfer",
  scan: "transfer",
  envelopes: "balance",
};

const INDICATOR_INSET = 6;

const layoutMemory: Record<string, ItemLayout> = {};
let indicatorMemory = {
  lastLayout: null as ItemLayout | null,
  flow: "right" as "right" | "left",
  ready: false,
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const BottomNavigationBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const searchParams = useGlobalSearchParams<{ from?: string }>();
  const insets = useSafeAreaInsets();
  const { theme, themeName } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [disabledRoutes, setDisabledRoutes] = useState<Set<string>>(new Set());
  const isNavigatingRef = useRef(false);
  const disabledRoutesRef = useRef<Set<string>>(new Set());

  const routeSegment = useMemo(() => {
    const reversed = [...segments].reverse();
    const matching = reversed.find(
      (segment) => segment && !segment.startsWith("(")
    );
    return matching ?? "home";
  }, [segments]);

  const originRoute = useMemo(() => {
    const raw = searchParams.from;
    if (typeof raw !== "string" || raw.length === 0) {
      return null;
    }
    try {
      return decodeURIComponent(raw);
    } catch (error) {
      console.warn("No se pudo decodificar la ruta de origen", error);
      return raw;
    }
  }, [searchParams.from]);

  const originKey = useMemo<BottomNavItem["key"] | null>(() => {
    if (!originRoute) {
      return null;
    }
    const matched = items.find((item) => originRoute.startsWith(item.route));
    if (matched) {
      return matched.key;
    }
    const tokens = originRoute
      .split("/")
      .filter(Boolean)
      .filter((token) => !token.startsWith("("));
    const last = tokens[tokens.length - 1];
    if (!last) {
      return null;
    }
    return segmentToKey[last] ?? null;
  }, [originRoute]);

  const activeKey = useMemo(() => {
    if (routeSegment === "notifications") {
      return originKey ?? "balance";
    }
    const fromSegment = segmentToKey[routeSegment];
    if (fromSegment) {
      return fromSegment;
    }

    const byRoute = items.find((item) => pathname.startsWith(item.route));
    return byRoute?.key ?? "balance";
  }, [pathname, routeSegment, originKey]);

  const [layouts, setLayouts] = useState<Record<string, ItemLayout>>(
    () => ({ ...layoutMemory })
  );
  const [indicatorFlow, setIndicatorFlow] = useState<"right" | "left">(() => indicatorMemory.flow);
  const [indicatorReady, setIndicatorReady] = useState(() => indicatorMemory.ready);
  const lastXRef = useRef<number | null>(indicatorMemory.lastLayout?.x ?? null);
  const lastLayoutRef = useRef<ItemLayout | null>(indicatorMemory.lastLayout);

  const handleLayout = (key: string) => (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setLayouts((prev) => {
      const current = prev[key];
      if (
        current &&
        current.x === x &&
        current.y === y &&
        current.width === width &&
        current.height === height
      ) {
        return prev;
      }
      const nextLayouts = { ...prev, [key]: { x, y, width, height } };
      layoutMemory[key] = { x, y, width, height };
      return nextLayouts;
    });
  };

  const activeLayout = layouts[activeKey];
  
  // Colores dinámicos del indicador según el tema
  const indicatorColors = useMemo<[string, string]>(() => {
    const primarySoft = themeName === "aurora" 
      ? "rgba(0, 160, 148, 0.64)" 
      : "rgba(221, 20, 29, 0.64)";
    const primaryFade = themeName === "aurora"
      ? "rgba(0, 160, 148, 0.08)"
      : "rgba(221, 20, 29, 0.08)";
    return [primarySoft, primaryFade];
  }, [themeName]);
  
  const indicatorGlowColor = useMemo(() => {
    return themeName === "aurora" 
      ? "rgba(0, 160, 148, 0.22)" 
      : "rgba(221, 20, 29, 0.22)";
  }, [themeName]);
  
  const iconWrapperActiveStyle = useMemo(() => ({
    shadowColor: indicatorGlowColor,
    borderColor: "rgba(255, 255, 255, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.32)",
  }), [indicatorGlowColor]);

  useEffect(() => {
    if (!activeLayout) {
      return;
    }
    const nextX = activeLayout.x;
    const prevX = lastXRef.current;
    if (prevX !== null && Math.abs(nextX - prevX) > 1) {
      const nextFlow = nextX > prevX ? "right" : "left";
      indicatorMemory = { ...indicatorMemory, flow: nextFlow };
      setIndicatorFlow(nextFlow);
    }
    lastXRef.current = nextX;
  }, [activeLayout]);

  useEffect(() => {
    if (activeLayout) {
      lastLayoutRef.current = activeLayout;
      if (!indicatorReady) {
        setIndicatorReady(true);
      }
      indicatorMemory = {
        ...indicatorMemory,
        lastLayout: activeLayout,
        ready: true,
      };
    }
  }, [activeLayout, indicatorReady]);

  // Reset navigation state when route changes
  useEffect(() => {
    isNavigatingRef.current = false;
    setIsNavigating(false);

    setDisabledRoutes(() => {
      const cleared = new Set<string>();
      disabledRoutesRef.current = cleared;
      return cleared;
    });
  }, [pathname, disabledRoutesRef, isNavigatingRef]);

  const handleNavigation = (item: BottomNavItem) => {
    // Prevent navigation if already navigating or route is disabled
    if (isNavigatingRef.current || disabledRoutesRef.current.has(item.route)) {
      return;
    }

    // Check if we're not already on this route
    if (!pathname.startsWith(item.route)) {
      isNavigatingRef.current = true;
      setIsNavigating(true);

      setDisabledRoutes((prev) => {
        const updated = new Set(prev);
        updated.add(item.route);
        disabledRoutesRef.current = updated;
        return updated;
      });

      router.replace(item.route);

      // Re-enable after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
        setIsNavigating(false);

        setDisabledRoutes((prev) => {
          const updated = new Set(prev);
          updated.delete(item.route);
          disabledRoutesRef.current = updated;
          return updated;
        });
      }, 500);
    }
  };

  const targetLayout = activeLayout ?? lastLayoutRef.current;

  const gradientOrientation = indicatorFlow === "right"
    ? { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }
    : { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 10) + 18 },
      ]}
    >
      <View style={styles.bar}>
        <MotiView
          pointerEvents="none"
          style={styles.indicator}
          animate={{
            opacity: indicatorReady ? 1 : 0,
            width: targetLayout ? targetLayout.width : 0,
            height: targetLayout ? targetLayout.height : 0,
            translateX: targetLayout ? targetLayout.x - 0.7 : 0,
            translateY: targetLayout ? targetLayout.y + 10 : 0,
          }}
          transition={{
            type: "timing",
            duration: 360,
            easing: indicatorFlow === "right"
              ? Easing.out(Easing.cubic)
              : Easing.out(Easing.cubic),
          }}
        >
          <LinearGradient
            colors={indicatorColors}
            start={gradientOrientation.start}
            end={gradientOrientation.end}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              styles.indicatorGlow,
              { backgroundColor: indicatorGlowColor },
            ]}
          />
        </MotiView>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const isDisabled = isNavigating || disabledRoutes.has(item.route);
          
          return (
            <View
              key={item.key}
              style={styles.slot}
              onLayout={handleLayout(item.key)}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.label}
                disabled={isDisabled}
                onPress={() => handleNavigation(item)}
                style={({ pressed }) => [
                  styles.button,
                  pressed && !isActive ? styles.buttonPressed : null,
                  isDisabled && styles.buttonDisabled,
                ]}
              >
                <View
                  style={[
                    styles.iconWrapper,
                    isActive && [
                      styles.iconWrapperActive,
                      iconWrapperActiveStyle,
                    ],
                    isDisabled && styles.iconWrapperDisabled,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={22}
                    color={
                      isDisabled
                        ? theme.components.icon.muted
                        : isActive
                        ? theme.components.nav.iconActive
                        : theme.components.nav.iconInactive
                    }
                  />
                </View>
                <NavLabel text={item.label} isActive={isActive} isDisabled={isDisabled} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      position: "relative",
      borderRadius: theme.radii.xl,
      paddingHorizontal: 12,
      paddingVertical: 14,
      backgroundColor: theme.components.nav.background,
      borderWidth: 1,
      borderColor: theme.components.nav.border,
      shadowColor: theme.components.nav.indicator,
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.25,
      shadowRadius: 32,
      overflow: "visible",
    },
    slot: {
      flex: 1,
      paddingHorizontal: 4,
      paddingVertical: 4,
      minWidth: 0,
    },
    indicator: {
      position: "absolute",
      top: 0,
      left: 0,
      borderRadius: theme.radii.full,
      backgroundColor: theme.palette.overlay,
      overflow: "hidden",
      shadowColor: theme.components.nav.indicator,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.28,
      shadowRadius: 26,
    },
    indicatorGlow: {
      ...StyleSheet.absoluteFillObject,
    },
    button: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 6,
    },
    buttonPressed: {
      opacity: 0.7,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: theme.radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.palette.overlay,
      borderWidth: 1,
      borderColor: theme.palette.border,
    },
    iconWrapperActive: {
      borderColor: "transparent",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.32,
      shadowRadius: 22,
    },
    iconWrapperDisabled: {
      backgroundColor: theme.palette.overlay,
      borderColor: theme.palette.border,
    },
  });

const createNavLabelStyles = (theme: Theme) =>
  StyleSheet.create({
    label: {
      color: theme.components.nav.label,
      fontSize: 10.2,
      fontWeight: "600",
      lineHeight: 12.6,
      letterSpacing: 0.15,
      textAlign: "center",
      paddingHorizontal: 2,
      flexShrink: 0,
    },
    labelActive: {
      color: theme.palette.textPrimary,
      textShadowColor: theme.components.nav.indicator,
      textShadowRadius: 6,
    },
    labelDisabled: {
      color: theme.components.icon.muted,
      opacity: 0.6,
    },
    labelContainer: {
      width: "100%",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    labelContainerOverflow: {
      alignItems: "flex-start",
    },
    labelOverflow: {
      textAlign: "left",
    },
    labelScroll: {
      width: "100%",
    },
    labelScrollContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "100%",
    },
    labelScrollOverflow: {
      justifyContent: "flex-start",
    },
  });

export default BottomNavigationBar;
export { items as bottomNavigationItems };

const MARQUEE_GAP = 14;

const NavLabel = ({
  text,
  isActive,
  isDisabled = false,
}: {
  text: string;
  isActive: boolean;
  isDisabled?: boolean;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createNavLabelStyles(theme), [theme]);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [labelWidth, setLabelWidth] = useState(0);

  const overflow = containerWidth > 0 && labelWidth > containerWidth + 2;

  useEffect(() => {
    return () => {
      animationRef.current?.stop();
      scrollAnim.stopAnimation();
    };
  }, [scrollAnim]);

  useEffect(() => {
    const listenerId = scrollAnim.addListener(({ value }) => {
      scrollRef.current?.scrollTo({ x: value, animated: false });
    });

    return () => {
      scrollAnim.removeListener(listenerId);
    };
  }, [scrollAnim]);

  useEffect(() => {
    if (!overflow) {
      animationRef.current?.stop();
      animationRef.current = null;
      scrollAnim.stopAnimation();
      scrollAnim.setValue(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      return;
    }

    const travel = Math.max(0, labelWidth + MARQUEE_GAP);
    if (travel === 0) {
      return;
    }

    animationRef.current?.stop();
    scrollAnim.stopAnimation();
    scrollAnim.setValue(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });

    const duration = Math.min(7200, Math.max(2400, travel * 40));

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(540),
        Animated.timing(scrollAnim, {
          toValue: travel,
          duration,
          easing: AnimatedEasing.linear,
          useNativeDriver: false,
        }),
        Animated.delay(760),
        Animated.timing(scrollAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );

    animationRef.current = animation;
    animation.start();

    return () => {
      animation.stop();
    };
  }, [overflow, labelWidth, scrollAnim]);

  const labelStyles = [
    styles.label,
    isActive ? styles.labelActive : null,
    isDisabled ? styles.labelDisabled : null,
    overflow ? styles.labelOverflow : null,
  ];

  return (
    <View
      style={[
        styles.labelContainer,
        overflow ? styles.labelContainerOverflow : null,
      ]}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width;
        if (Math.abs(width - containerWidth) > 1) {
          setContainerWidth(width);
        }
      }}
    >
      <AnimatedScrollView
        ref={(node) => {
          scrollRef.current = node as unknown as ScrollView | null;
        }}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        style={styles.labelScroll}
        contentContainerStyle={[
          styles.labelScrollContent,
          overflow ? styles.labelScrollOverflow : null,
          overflow ? { width: labelWidth * 2 + MARQUEE_GAP } : null,
        ]}
      >
        <Text
          style={labelStyles}
          numberOfLines={1}
          ellipsizeMode="clip"
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            if (Math.abs(width - labelWidth) > 1) {
              setLabelWidth(width);
            }
          }}
        >
          {text}
        </Text>
        {overflow ? (
          <>
            <View style={{ width: MARQUEE_GAP }} />
            <Text
              style={labelStyles}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {text}
            </Text>
          </>
        ) : null}
      </AnimatedScrollView>
    </View>
  );
};
