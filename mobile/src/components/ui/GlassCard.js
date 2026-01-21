// GlassCard - Glassmorphism card component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing, fontSize } from '../theme';

const GlassCard = ({ 
  children, 
  title, 
  icon, 
  accent = 'teal',
  style,
  headerRight,
}) => {
  const accentColors = {
    teal: colors.primary,
    purple: colors.purple,
    amber: colors.amber,
    rose: colors.danger,
    blue: colors.info,
    green: colors.success,
  };

  const accentColor = accentColors[accent] || colors.primary;

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
        style={styles.gradient}
      >
        {title && (
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {icon && <Text style={styles.icon}>{icon}</Text>}
              <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
            </View>
            {headerRight}
          </View>
        )}
        <View style={styles.content}>
          {children}
        </View>
      </LinearGradient>
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    backgroundColor: colors.glass,
  },
  gradient: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: fontSize.lg,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  content: {},
  accentLine: {
    height: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default GlassCard;
