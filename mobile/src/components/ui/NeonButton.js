// NeonButton - Glowing button component
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, fontSize } from '../theme';

const NeonButton = ({ 
  children, 
  onPress, 
  variant = 'teal',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}) => {
  const variants = {
    teal: {
      gradient: ['#14B8A6', '#0D9488'],
      text: '#FFFFFF',
      shadow: colors.primary,
    },
    cyan: {
      gradient: ['#06B6D4', '#0891B2'],
      text: '#FFFFFF',
      shadow: colors.cyan,
    },
    purple: {
      gradient: ['#A855F7', '#9333EA'],
      text: '#FFFFFF',
      shadow: colors.purple,
    },
    rose: {
      gradient: ['#F43F5E', '#E11D48'],
      text: '#FFFFFF',
      shadow: colors.rose,
    },
    white: {
      gradient: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
      text: '#FFFFFF',
      shadow: 'transparent',
    },
    success: {
      gradient: ['#22C55E', '#16A34A'],
      text: '#FFFFFF',
      shadow: colors.success,
    },
    danger: {
      gradient: ['#EF4444', '#DC2626'],
      text: '#FFFFFF',
      shadow: colors.danger,
    },
  };

  const sizes = {
    sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: fontSize.sm },
    md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: fontSize.base },
    lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, fontSize: fontSize.lg },
  };

  const v = variants[variant] || variants.teal;
  const s = sizes[size] || sizes.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.container,
        { opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={v.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            paddingVertical: s.paddingVertical,
            paddingHorizontal: s.paddingHorizontal,
            shadowColor: v.shadow,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.text} size="small" />
        ) : (
          <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>
            {children}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NeonButton;
