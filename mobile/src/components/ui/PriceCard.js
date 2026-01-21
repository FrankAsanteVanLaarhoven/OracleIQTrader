// PriceCard - Market price display component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize } from '../theme';

const PriceCard = ({ 
  symbol, 
  name, 
  price, 
  change, 
  changePercent,
  compact = false,
}) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? colors.success : colors.danger;
  const icon = isPositive ? 'trending-up' : 'trending-down';

  const formatPrice = (p) => {
    if (p >= 1000) return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    return `$${p.toFixed(4)}`;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactSymbol}>{symbol}</Text>
        <Text style={styles.compactPrice}>{formatPrice(price)}</Text>
        <View style={[styles.compactChange, { backgroundColor: `${changeColor}20` }]}>
          <Ionicons name={icon} size={12} color={changeColor} />
          <Text style={[styles.compactChangeText, { color: changeColor }]}>
            {isPositive ? '+' : ''}{changePercent?.toFixed(2)}%
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <Ionicons name={icon} size={24} color={changeColor} />
      </View>
      
      <Text style={styles.price}>{formatPrice(price)}</Text>
      
      <View style={styles.changeRow}>
        <Text style={[styles.changeAmount, { color: changeColor }]}>
          {isPositive ? '+' : ''}{formatPrice(Math.abs(change))}
        </Text>
        <View style={[styles.changeBadge, { backgroundColor: `${changeColor}20` }]}>
          <Text style={[styles.changePercent, { color: changeColor }]}>
            {isPositive ? '+' : ''}{changePercent?.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  symbol: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  name: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  price: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  changeAmount: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  changeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  changePercent: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
  },
  compactSymbol: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    width: 40,
  },
  compactPrice: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  compactChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  compactChangeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});

export default PriceCard;
