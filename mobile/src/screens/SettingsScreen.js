// Settings Screen - API Keys & Preferences (Binance-style UI with QR Scanner + Biometrics)
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TextInput,
  Switch,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { GlassCard, NeonButton } from '../components/ui';
import QRScanner from '../components/QRScanner';
import BiometricService from '../services/BiometricService';
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
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState([]);
  const [showSecrets, setShowSecrets] = useState(false);
  
  // QR Scanner
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanningExchange, setScanningExchange] = useState('Binance');
  
  // Save states
  const [saving, setSaving] = useState({});

  useEffect(() => {
    checkBiometrics();
    loadSavedKeys();
  }, []);

  const checkBiometrics = async () => {
    const available = await BiometricService.isAvailable();
    setBiometricsAvailable(available);
    
    if (available) {
      const types = await BiometricService.getBiometricTypes();
      setBiometricTypes(types);
      const enabled = await BiometricService.isEnabled();
      setBiometricsEnabled(enabled);
    }
  };

  const loadSavedKeys = async () => {
    try {
      const binanceKey = await SecureStore.getItemAsync('binance_api_key');
      const binanceSecret = await SecureStore.getItemAsync('binance_secret_key');
      if (binanceKey) setBinanceApiKey(binanceKey);
      if (binanceSecret) setBinanceSecretKey(binanceSecret);
      
      const coinbaseKey = await SecureStore.getItemAsync('coinbase_api_key');
      const coinbaseSecret = await SecureStore.getItemAsync('coinbase_secret_key');
      if (coinbaseKey) setCoinbaseApiKey(coinbaseKey);
      if (coinbaseSecret) setCoinbaseSecretKey(coinbaseSecret);
      
      const krakenKey = await SecureStore.getItemAsync('kraken_api_key');
      const krakenSecret = await SecureStore.getItemAsync('kraken_secret_key');
      if (krakenKey) setKrakenApiKey(krakenKey);
      if (krakenSecret) setKrakenSecretKey(krakenSecret);
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
  };

  const handleBiometricToggle = async (value) => {
    if (value) {
      const result = await BiometricService.enable();
      if (result.success) {
        setBiometricsEnabled(true);
        Alert.alert('Success', 'Biometric login enabled');
      } else {
        Alert.alert('Failed', result.error || 'Could not enable biometrics');
      }
    } else {
      const result = await BiometricService.disable();
      if (result.success) {
        setBiometricsEnabled(false);
      }
    }
  };

  const openQRScanner = async (exchange) => {
    // Require biometric auth if enabled
    if (biometricsEnabled) {
      const authResult = await BiometricService.authenticateForSensitiveOperation('scan API keys');
      if (!authResult.success) {
        Alert.alert('Authentication Required', authResult.error);
        return;
      }
    }
    setScanningExchange(exchange);
    setScannerVisible(true);
  };

  const handleQRScan = (data) => {
    const { apiKey, secretKey, exchange } = data;
    
    switch (exchange.toLowerCase()) {
      case 'binance':
        setBinanceApiKey(apiKey);
        setBinanceSecretKey(secretKey);
        break;
      case 'coinbase':
        setCoinbaseApiKey(apiKey);
        setCoinbaseSecretKey(secretKey);
        break;
      case 'kraken':
        setKrakenApiKey(apiKey);
        setKrakenSecretKey(secretKey);
        break;
    }
    
    Alert.alert('Success', `${exchange} API keys imported successfully!`);
  };

  const saveApiKey = async (exchange, apiKey, secretKey) => {
    // Require biometric auth if enabled
    if (biometricsEnabled) {
      const authResult = await BiometricService.authenticateForSensitiveOperation('save API keys');
      if (!authResult.success) {
        Alert.alert('Authentication Required', authResult.error);
        return;
      }
    }
    
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

  const toggleShowSecrets = async () => {
    if (!showSecrets && biometricsEnabled) {
      const authResult = await BiometricService.authenticateForSensitiveOperation('view secret keys');
      if (!authResult.success) {
        Alert.alert('Authentication Required', authResult.error);
        return;
      }
    }
    setShowSecrets(!showSecrets);
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
          { backgroundColor: `${color}20` }
        ]}>
          <Text style={[styles.statusText, { color }]}>
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
            onPress={toggleShowSecrets}
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
          variant="purple"
          size="sm"
          onPress={() => openQRScanner(name)}
          style={styles.actionBtn}
        >
          <Ionicons name="qr-code" size={14} color="#fff" /> Scan QR
        </NeonButton>
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

        {/* Security Settings */}
        <Text style={styles.sectionTitle}>Security</Text>
        
        <GlassCard style={styles.section}>
          {/* Biometric Auth */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.settingTitleRow}>
                <Ionicons 
                  name={Platform.OS === 'ios' ? 'scan' : 'finger-print'} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={styles.settingTitle}>
                  {biometricTypes.join(' / ') || 'Biometric Login'}
                </Text>
              </View>
              <Text style={styles.settingDesc}>
                {biometricsAvailable 
                  ? 'Require biometrics for sensitive actions' 
                  : 'Not available on this device'}
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!biometricsAvailable}
              trackColor={{ false: colors.textMuted, true: colors.primary }}
              thumbColor={biometricsEnabled ? colors.text : colors.textSecondary}
            />
          </View>
        </GlassCard>

        {/* Network Mode */}
        <GlassCard title="Network Mode" icon="🌐" accent="amber" style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Testnet</Text>
              <Text style={styles.settingDesc}>
                Trade with test funds (recommended)
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
                Mainnet uses real funds. Trade at your own risk.
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
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
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
        </GlassCard>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Your API keys are encrypted using device-level security. 
            {biometricsEnabled && ' Biometric authentication protects all sensitive operations.'}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScan={handleQRScan}
        exchange={scanningExchange}
      />
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
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
