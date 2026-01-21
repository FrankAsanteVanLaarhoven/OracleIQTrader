// Portfolio Screen - Holdings and performance
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, NeonButton } from '../components/ui';
import { portfolioService, tradingService } from '../services/api';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const PortfolioScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [portfolioRes, tradesRes] = await Promise.all([
        portfolioService.getSummary(),
        tradingService.getHistory(10),
      ]);
      setPortfolio(portfolioRes.data);
      setTrades(tradesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.background, '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Portfolio</Text>
          <NeonButton variant="white" size="sm" onPress={fetchData}>
            <Ionicons name="refresh" size={18} color={colors.text} />
          </NeonButton>
        </View>

        {/* Total Value Card */}
        {portfolio && (
          <GlassCard style={styles.valueCard}>
            <Text style={styles.valueLabel}>Total Portfolio Value</Text>
            <Text style={styles.totalValue}>
              ${portfolio.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <View style={styles.changeRow}>
              <View style={[
                styles.changeBadge,
                { backgroundColor: portfolio.daily_pnl >= 0 ? `${colors.success}20` : `${colors.danger}20` }
              ]}>
                <Ionicons 
                  name={portfolio.daily_pnl >= 0 ? 'trending-up' : 'trending-down'} 
                  size={14} 
                  color={portfolio.daily_pnl >= 0 ? colors.success : colors.danger} 
                />
                <Text style={[
                  styles.changeText,
                  { color: portfolio.daily_pnl >= 0 ? colors.success : colors.danger }
                ]}>
                  {portfolio.daily_pnl >= 0 ? '+' : ''}${portfolio.daily_pnl?.toFixed(2)} ({portfolio.daily_pnl_percent?.toFixed(2)}%)
                </Text>
              </View>
              <Text style={styles.period}>24h</Text>
            </View>
          </GlassCard>
        )}

        {/* Holdings */}
        <GlassCard title="Holdings" icon="💼" accent="teal" style={styles.section}>
          {portfolio?.positions?.map((position, index) => (
            <View key={index} style={styles.positionRow}>
              <View style={styles.positionLeft}>
                <Text style={styles.positionSymbol}>{position.symbol}</Text>
                <Text style={styles.positionQty}>{position.quantity} units</Text>
              </View>
              <View style={styles.positionRight}>
                <Text style={styles.positionValue}>
                  ${position.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.positionPrice}>
                  @ ${position.price?.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
          
          {/* Cash Balance */}
          <View style={[styles.positionRow, styles.cashRow]}>
            <View style={styles.positionLeft}>
              <Text style={styles.positionSymbol}>Cash</Text>
              <Text style={styles.positionQty}>Available</Text>
            </View>
            <View style={styles.positionRight}>
              <Text style={styles.positionValue}>
                ${portfolio?.cash_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Recent Trades */}
        <GlassCard title="Recent Trades" icon="📜" accent="purple" style={styles.section}>
          {trades.length > 0 ? trades.map((trade, index) => (
            <View key={index} style={styles.tradeRow}>
              <View style={styles.tradeLeft}>
                <View style={[
                  styles.tradeAction,
                  { backgroundColor: trade.action === 'BUY' ? `${colors.success}20` : `${colors.danger}20` }
                ]}>
                  <Text style={[
                    styles.tradeActionText,
                    { color: trade.action === 'BUY' ? colors.success : colors.danger }
                  ]}>
                    {trade.action}
                  </Text>
                </View>
                <View>
                  <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
                  <Text style={styles.tradeDate}>{formatDate(trade.timestamp)}</Text>
                </View>
              </View>
              <View style={styles.tradeRight}>
                <Text style={styles.tradeQty}>{trade.quantity} × ${trade.price?.toFixed(2)}</Text>
                <Text style={styles.tradeTotal}>
                  ${(trade.quantity * trade.price)?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyTrades}>
              <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No recent trades</Text>
            </View>
          )}
        </GlassCard>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <NeonButton 
            variant="success" 
            onPress={() => navigation.navigate('Trade', { action: 'buy' })}
            style={styles.actionButton}
          >
            <Ionicons name="add-circle" size={18} color="#fff" /> Buy
          </NeonButton>
          <NeonButton 
            variant="danger" 
            onPress={() => navigation.navigate('Trade', { action: 'sell' })}
            style={styles.actionButton}
          >
            <Ionicons name="remove-circle" size={18} color="#fff" /> Sell
          </NeonButton>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  valueCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
    padding: spacing.lg,
  },
  valueLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  totalValue: {
    color: colors.text,
    fontSize: fontSize['4xl'],
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  changeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  period: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  section: {
    marginBottom: spacing.md,
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  cashRow: {
    borderBottomWidth: 0,
    paddingTop: spacing.md,
  },
  positionLeft: {},
  positionSymbol: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  positionQty: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  positionRight: {
    alignItems: 'flex-end',
  },
  positionValue: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  positionPrice: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  tradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tradeAction: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tradeActionText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  tradeSymbol: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  tradeDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  tradeRight: {
    alignItems: 'flex-end',
  },
  tradeQty: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  tradeTotal: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  emptyTrades: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default PortfolioScreen;
