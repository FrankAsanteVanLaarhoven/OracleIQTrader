// Dashboard Screen - Main trading dashboard
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, PriceCard, NeonButton } from '../components/ui';
import { marketService, portfolioService } from '../services/api';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [prices, setPrices] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [pricesRes, portfolioRes] = await Promise.all([
        marketService.getPrices(),
        portfolioService.getSummary(),
      ]);
      setPrices(pricesRes.data || []);
      setPortfolio(portfolioRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const cryptoPrices = prices.filter(p => ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE'].includes(p.symbol));
  const stockPrices = prices.filter(p => ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'SPY'].includes(p.symbol));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.background, '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="flash" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.appName}>ORACLE</Text>
            <Text style={styles.appTag}>AI Trading</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        </View>
      </View>

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
        {/* Portfolio Summary */}
        {portfolio && (
          <GlassCard title="Portfolio" icon="💰" accent="teal" style={styles.section}>
            <View style={styles.portfolioValue}>
              <Text style={styles.portfolioLabel}>Total Value</Text>
              <Text style={styles.portfolioAmount}>
                ${portfolio.total_value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.portfolioStats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>24h P&L</Text>
                <Text style={[
                  styles.statValue,
                  { color: portfolio.daily_pnl >= 0 ? colors.success : colors.danger }
                ]}>
                  {portfolio.daily_pnl >= 0 ? '+' : ''}${portfolio.daily_pnl?.toFixed(2)}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Change</Text>
                <Text style={[
                  styles.statValue,
                  { color: portfolio.daily_pnl_percent >= 0 ? colors.success : colors.danger }
                ]}>
                  {portfolio.daily_pnl_percent >= 0 ? '+' : ''}{portfolio.daily_pnl_percent?.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Cash</Text>
                <Text style={styles.statValue}>
                  ${portfolio.cash_balance?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <NeonButton 
            variant="success" 
            onPress={() => navigation.navigate('Trade', { action: 'buy' })}
            style={styles.actionButton}
          >
            <Ionicons name="trending-up" size={16} color="#fff" /> BUY
          </NeonButton>
          <NeonButton 
            variant="danger" 
            onPress={() => navigation.navigate('Trade', { action: 'sell' })}
            style={styles.actionButton}
          >
            <Ionicons name="trending-down" size={16} color="#fff" /> SELL
          </NeonButton>
        </View>

        {/* Crypto Markets */}
        <GlassCard title="Crypto Markets" icon="₿" accent="amber" style={styles.section}>
          {cryptoPrices.slice(0, 4).map((item) => (
            <PriceCard
              key={item.symbol}
              symbol={item.symbol}
              name={item.name}
              price={item.price}
              change={item.change_24h}
              changePercent={item.change_percent}
              compact
            />
          ))}
          <NeonButton 
            variant="white" 
            size="sm"
            onPress={() => navigation.navigate('Markets')}
            style={styles.viewAllButton}
          >
            View All Markets →
          </NeonButton>
        </GlassCard>

        {/* Stocks */}
        <GlassCard title="Stocks" icon="📊" accent="blue" style={styles.section}>
          {stockPrices.slice(0, 3).map((item) => (
            <PriceCard
              key={item.symbol}
              symbol={item.symbol}
              name={item.name}
              price={item.price}
              change={item.change_24h}
              changePercent={item.change_percent}
              compact
            />
          ))}
        </GlassCard>

        {/* AI Features Quick Access */}
        <View style={styles.aiFeatures}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <View style={styles.featureGrid}>
            <FeatureButton
              icon="analytics"
              label="ML Predict"
              color={colors.purple}
              onPress={() => navigation.navigate('Predictions')}
            />
            <FeatureButton
              icon="trophy"
              label="Compete"
              color={colors.amber}
              onPress={() => navigation.navigate('Competitions')}
            />
            <FeatureButton
              icon="hardware-chip"
              label="AI Bot"
              color={colors.cyan}
              onPress={() => navigation.navigate('Bot')}
            />
            <FeatureButton
              icon="school"
              label="Training"
              color={colors.success}
              onPress={() => navigation.navigate('Training')}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const FeatureButton = ({ icon, label, color, onPress }) => (
  <View style={styles.featureButton}>
    <NeonButton variant="white" onPress={onPress} style={styles.featureButtonInner}>
      <View style={[styles.featureIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </NeonButton>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 2,
  },
  appTag: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: `${colors.success}20`,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: `${colors.success}40`,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginTop: spacing.md,
  },
  portfolioValue: {
    marginBottom: spacing.md,
  },
  portfolioLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: 4,
  },
  portfolioAmount: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {},
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  viewAllButton: {
    marginTop: spacing.md,
  },
  aiFeatures: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureButton: {
    width: (width - spacing.md * 2 - spacing.sm * 3) / 4,
  },
  featureButtonInner: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  featureLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
});

export default DashboardScreen;
