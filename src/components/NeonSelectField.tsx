import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AnimatePresence, MotiView } from "moti";
import { ReactNode, cloneElement, isValidElement, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { Theme, useTheme } from "@/theme/ThemeProvider";

type Option = {
  label: string;
  value: string;
  description?: string;
  icon?: ReactNode;
};

type NeonSelectFieldProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  icon?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
};

const NeonSelectField = ({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  helpText,
  errorMessage,
  icon,
  disabled,
  style,
}: NeonSelectFieldProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const hint = errorMessage || helpText;
  const hintColor = errorMessage ? theme.palette.danger : theme.palette.textMuted;
  const isActive = isOpen || Boolean(selectedOption);

  const toggleOpen = () => {
    if (disabled) {
      return;
    }
    setIsOpen((current) => !current);
  };

  const handleSelect = (option: Option) => {
    onValueChange(option.value);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <MotiView
        style={styles.animatedShell}
        from={{ opacity: 0.9, scale: 0.98 }}
        animate={{
          opacity: isActive ? 1 : 0.9,
          scale: isOpen ? 1.02 : 0.99,
          shadowOpacity: isOpen ? 0.45 : 0,
        }}
        transition={{ type: "timing", duration: 200 }}
      >
        <MotiView
          pointerEvents="none"
          style={styles.glow}
          animate={{
            opacity: isOpen ? 0.42 : 0,
            scale: isOpen ? 1.01 : 0.97,
          }}
          transition={{ type: "timing", duration: 240 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={toggleOpen}
          disabled={disabled}
          style={[styles.fieldSurface, disabled && styles.fieldDisabled]}
        >
          {icon ? (
            <View style={styles.iconContainer}>
              {isValidElement(icon)
                ? cloneElement(icon as any, {
                    color: theme.components.icon.primary,
                  })
                : icon}
            </View>
          ) : null}
          <Text
            style={[
              styles.valueText,
              !selectedOption && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {selectedOption?.label ?? placeholder ?? "Selecciona"}
          </Text>
          <MaterialCommunityIcons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={22}
            color={theme.components.icon.primary}
          />
        </Pressable>
      </MotiView>

      <AnimatePresence>
        {isOpen ? (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -6 }}
            transition={{ type: "timing", duration: 200 }}
            style={styles.optionsWrapper}
          >
            {options.map((option) => {
              const isSelected = option.value === selectedOption?.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option)}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionSelected,
                  ]}
                  accessibilityRole="button"
                >
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {option.description ? (
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </MotiView>
        ) : null}
      </AnimatePresence>

      {hint ? (
        <Text style={[styles.hint, { color: hintColor }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.palette.textSecondary,
      letterSpacing: 0.4,
    },
    animatedShell: {
      borderRadius: theme.radii.xl,
      shadowColor: theme.components.input.focusGlow,
      position: "relative",
      overflow: "visible",
    },
    fieldSurface: {
      backgroundColor: theme.components.input.background,
      borderRadius: theme.radii.xl,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 18,
      paddingVertical: 16,
      gap: 12,
    },
    fieldDisabled: {
      opacity: 0.6,
    },
    iconContainer: {
      width: 28,
      height: 28,
      borderRadius: theme.radii.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.components.input.iconBackground,
    },
    valueText: {
      flex: 1,
      color: theme.palette.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    placeholderText: {
      color: theme.components.input.placeholder,
      fontWeight: "500",
    },
    glow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: theme.radii.xl,
      backgroundColor: theme.components.input.focusGlow,
      shadowColor: theme.components.input.focusGlow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 22,
      zIndex: -1,
    },
    optionsWrapper: {
      marginTop: 10,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.palette.border,
      backgroundColor: theme.palette.overlay,
      overflow: "hidden",
    },
    optionRow: {
      paddingVertical: 14,
      paddingHorizontal: 18,
      gap: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.border,
    },
    optionSelected: {
      backgroundColor: "rgba(240, 68, 44, 0.18)",
    },
    optionLabel: {
      color: theme.palette.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    optionDescription: {
      color: theme.palette.textSecondary,
      fontSize: 13,
    },
    hint: {
      fontSize: 12,
      marginLeft: 6,
    },
  });

export type { Option as NeonSelectOption };
export default NeonSelectField;
