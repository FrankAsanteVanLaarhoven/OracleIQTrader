// Settings Screen - API Keys & Preferences (Binance-style UI)
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TextInput,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { GlassCard, NeonButton } from '../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  // Exchange API Keys
  const [binanceApiKey, setBinanceApiKey] = useState('');
  const [binanceSecretKey, setBinanceSecretKey] = useState('');
  const [coinbaseApiKey, setCoinbaseApiKey] = useState('');
  const [coinbaseSecretKey, setCoinbaseSecretKey] = useState('');
  const [krakenApiKey, setKrakenApiKey] = useState('');
  const [krakenSecretKey, setKrakenSecretKey] = useState('');
  
  // Settings
  const [useTestnet, setUseTestnet] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  
  // Save states
  const [saving, setSaving] = useState({});

  const saveApiKey = async (exchange, apiKey, secretKey) => {
    setSaving(prev => ({ ...prev, [exchange]: true }));
    try {
      await SecureStore.setItemAsync(`${exchange}_api_key`, apiKey);
      await SecureStore.setItemAsync(`${exchange}_secret_key`, secretKey);
      Alert.alert('Success', `${exchange} API keys saved securely`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save API keys');
    } finally {
      setSaving(prev => ({ ...prev, [exchange]: false }));
    }
  };

  const testConnection = async (exchange) => {
    Alert.alert(
      'Connection Test',
      `Testing ${exchange} connection...\n\nNote: Using ${useTestnet ? 'TESTNET' : 'MAINNET'} mode`,
      [{ text: 'OK' }]
    );
  };

  const ExchangeCard = ({ 
    name, 
    icon, 
    color, 
    apiKey, 
    setApiKey, 
    secretKey, 
    setSecretKey 
  }) => (
    <GlassCard style={styles.exchangeCard}>
      <View style={styles.exchangeHeader}>
        <View style={styles.exchangeInfo}>
          <View style={[styles.exchangeIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <View>
            <Text style={styles.exchangeName}>{name}</Text>
            <Text style={styles.exchangeStatus}>
              {apiKey ? '● Connected' : '○ Not configured'}
            </Text>
          </View>
        </View>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: apiKey ? `${colors.success}20` : `${colors.textMuted}20` }
        ]}>
          <Text style={[
            styles.statusText,
            { color: apiKey ? colors.success : colors.textMuted }
          ]}>
            {useTestnet ? 'TESTNET' : 'MAINNET'}
          </Text>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>API Key</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter API Key"
            placeholderTextColor={colors.textMuted}
            value={apiKey}
            onChangeText={setApiKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.inputIcon}
            onPress={() => setApiKey('')}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Secret Key</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter Secret Key"
            placeholderTextColor={colors.textMuted}
            value={secretKey}
            onChangeText={setSecretKey}
            secureTextEntry={!showSecrets}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity 
            style={styles.inputIcon}
            onPress={() => setShowSecrets(!showSecrets)}
          >
            <Ionicons 
              name={showSecrets ? 'eye-off' : 'eye'} 
              size={18} 
              color={colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.exchangeActions}>
        <NeonButton
          variant="white"
          size="sm"
          onPress={() => testConnection(name)}
          style={styles.actionBtn}
        >
          <Ionicons name="pulse" size={14} color={colors.text} /> Test
        </NeonButton>
        <NeonButton
          variant="teal"
          size="sm"
          onPress={() => saveApiKey(name.toLowerCase(), apiKey, secretKey)}
          loading={saving[name.toLowerCase()]}
          style={styles.actionBtn}
        >
          <Ionicons name="save" size={14} color="#fff" /> Save
        </NeonButton>
      </View>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.background, '#0a0a0a']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Network Mode */}
        <GlassCard title="Network Mode" icon="🌐" accent="amber" style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Testnet</Text>
              <Text style={styles.settingDesc}>
                Trade with test funds (recommended for testing)
              </Text>
            </View>
            <Switch
              value={useTestnet}
              onValueChange={setUseTestnet}
              trackColor={{ false: colors.textMuted, true: colors.primary }}
              thumbColor={useTestnet ? colors.text : colors.textSecondary}
            />
          </View>
          
          {!useTestnet && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={styles.warningText}>
                Mainnet mode uses real funds. Trade at your own risk.
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Exchange API Keys */}
        <Text style={styles.sectionTitle}>Exchange Connections</Text>
        
        <ExchangeCard
          name="Binance"
          icon="logo-bitcoin"
          color="#F0B90B"
          apiKey={binanceApiKey}
          setApiKey={setBinanceApiKey}
          secretKey={binanceSecretKey}
          setSecretKey={setBinanceSecretKey}
        />

        <ExchangeCard
          name="Coinbase"
          icon="wallet"
          color="#0052FF"
          apiKey={coinbaseApiKey}
          setApiKey={setCoinbaseApiKey}
          secretKey={coinbaseSecretKey}
          setSecretKey={setCoinbaseSecretKey}
        />

        <ExchangeCard
          name="Kraken"
          icon="water"
          color="#5741D9"
          apiKey={krakenApiKey}
          setApiKey={setKrakenApiKey}
          secretKey={krakenSecretKey}
          setSecretKey={setKrakenSecretKey}
        />

        {/* App Settings */}
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <GlassCard style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Price alerts and trade updates</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.textMuted, true: colors.primary }}
              thumbColor={notifications ? colors.text : colors.textSecondary}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Biometric Login</Text>
              <Text style={styles.settingDesc}>Use Face ID or fingerprint</Text>
            </View>
            <Switch
              value={biometrics}
              onValueChange={setBiometrics}
              trackColor={{ false: colors.textMuted, true: colors.primary }}
              thumbColor={biometrics ? colors.text : colors.textSecondary}
            />
          </View>
        </GlassCard>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your API keys are stored securely using device encryption. 
            We never transmit or store your keys on external servers.
          </Text>
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
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  exchangeCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  exchangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exchangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exchangeIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exchangeName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  exchangeStatus: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  statusIndicator: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    padding: spacing.sm,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputIcon: {
    padding: spacing.sm,
  },
  exchangeActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: '500',
  },
  settingDesc: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: `${colors.warning}15`,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  warningText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    marginTop: spacing.md,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    flex: 1,
    lineHeight: 18,
  },
});

export default SettingsScreen;
