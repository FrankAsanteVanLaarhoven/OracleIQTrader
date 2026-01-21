// Trade Screen - Buy/Sell interface
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard, NeonButton } from '../components/ui';
import { marketService, tradingService } from '../services/api';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'AAPL', 'NVDA', 'TSLA'];

const TradeScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { symbol: initialSymbol, action: initialAction } = route.params || {};
  
  const [action, setAction] = useState(initialAction || 'buy');
  const [symbol, setSymbol] = useState(initialSymbol || 'BTC');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchPrice = async () => {
    try {
      setLoading(true);
      const response = await marketService.getPrice(symbol);
      setPrice(response.data);
    } catch (error) {
      console.error('Error fetching price:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!quantity || !price?.price) return 0;
    return parseFloat(quantity) * price.price;
  };

  const executeTrade = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setExecuting(true);
    try {
      const response = await tradingService.executeTrade(action.toUpperCase(), symbol, parseFloat(quantity));
      
      Alert.alert(
        'Trade Executed',
        `${action.toUpperCase()} ${quantity} ${symbol} at $${price?.price?.toFixed(2)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to execute trade');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[colors.background, '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView 
        style={[styles.content, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <NeonButton variant="white" size="sm" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </NeonButton>
          <Text style={styles.title}>Trade</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Action Toggle */}
        <View style={styles.actionToggle}>
          <NeonButton
            variant={action === 'buy' ? 'success' : 'white'}
            onPress={() => setAction('buy')}
            style={styles.toggleButton}
          >
            <Ionicons name="trending-up" size={18} color={action === 'buy' ? '#fff' : colors.success} />
            <Text style={{ color: action === 'buy' ? '#fff' : colors.success, fontWeight: '600' }}>BUY</Text>
          </NeonButton>
          <NeonButton
            variant={action === 'sell' ? 'danger' : 'white'}
            onPress={() => setAction('sell')}
            style={styles.toggleButton}
          >
            <Ionicons name="trending-down" size={18} color={action === 'sell' ? '#fff' : colors.danger} />
            <Text style={{ color: action === 'sell' ? '#fff' : colors.danger, fontWeight: '600' }}>SELL</Text>
          </NeonButton>
        </View>

        {/* Symbol Selection */}
        <GlassCard title="Symbol" icon="💱" accent="teal" style={styles.section}>
          <View style={styles.symbolGrid}>
            {SYMBOLS.map((s) => (
              <NeonButton
                key={s}
                variant={symbol === s ? 'teal' : 'white'}
                size="sm"
                onPress={() => setSymbol(s)}
                style={styles.symbolButton}
              >
                {s}
              </NeonButton>
            ))}
          </View>
        </GlassCard>

        {/* Current Price */}
        {price && (
          <GlassCard title="Current Price" icon="📊" accent="blue" style={styles.section}>
            <View style={styles.priceDisplay}>
              <Text style={styles.currentPrice}>
                ${price.price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <View style={[
                styles.changeBadge,
                { backgroundColor: price.change_percent >= 0 ? `${colors.success}20` : `${colors.danger}20` }
              ]}>
                <Ionicons 
                  name={price.change_percent >= 0 ? 'trending-up' : 'trending-down'} 
                  size={14} 
                  color={price.change_percent >= 0 ? colors.success : colors.danger} 
                />
                <Text style={[
                  styles.changeText,
                  { color: price.change_percent >= 0 ? colors.success : colors.danger }
                ]}>
                  {price.change_percent >= 0 ? '+' : ''}{price.change_percent?.toFixed(2)}%
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Quantity Input */}
        <GlassCard title="Quantity" icon="🔢" accent="purple" style={styles.section}>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
          />
          <View style={styles.quickAmounts}>
            {['10', '50', '100', '500'].map((amt) => (
              <NeonButton
                key={amt}
                variant="white"
                size="sm"
                onPress={() => setQuantity(amt)}
                style={styles.quickButton}
              >
                {amt}
              </NeonButton>
            ))}
          </View>
        </GlassCard>

        {/* Order Summary */}
        <GlassCard title="Order Summary" icon="📋" accent="amber" style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Action</Text>
            <Text style={[styles.summaryValue, { color: action === 'buy' ? colors.success : colors.danger }]}>
              {action.toUpperCase()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Symbol</Text>
            <Text style={styles.summaryValue}>{symbol}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Quantity</Text>
            <Text style={styles.summaryValue}>{quantity || '0'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Price</Text>
            <Text style={styles.summaryValue}>
              ${price?.price?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Value</Text>
            <Text style={styles.totalValue}>
              ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </GlassCard>

        {/* Execute Button */}
        <NeonButton
          variant={action === 'buy' ? 'success' : 'danger'}
          size="lg"
          onPress={executeTrade}
          loading={executing}
          disabled={!quantity || executing}
          style={styles.executeButton}
        >
          <Ionicons 
            name={action === 'buy' ? 'checkmark-circle' : 'close-circle'} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.executeText}>
            {action === 'buy' ? 'EXECUTE BUY ORDER' : 'EXECUTE SELL ORDER'}
          </Text>
        </NeonButton>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  actionToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toggleButton: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.md,
  },
  symbolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  symbolButton: {
    minWidth: 60,
  },
  priceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentPrice: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: spacing.md,
  },
  totalLabel: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  totalValue: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  executeButton: {
    marginTop: spacing.md,
  },
  executeText: {
    color: '#fff',
    fontSize: fontSize.base,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default TradeScreen;
