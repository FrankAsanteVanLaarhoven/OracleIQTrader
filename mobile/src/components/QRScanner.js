// QR Code Scanner for API Key Import
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
  Alert,
  Vibration,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const QRScanner = ({ visible, onClose, onScan, exchange = 'Binance' }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      requestPermission();
      setScanned(false);
    }
  }, [visible]);

  const requestPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    Vibration.vibrate(100);

    try {
      // Try to parse as JSON (Binance exports API keys as JSON)
      const parsed = JSON.parse(data);
      
      if (parsed.apiKey && parsed.secretKey) {
        onScan({
          apiKey: parsed.apiKey,
          secretKey: parsed.secretKey,
          exchange: parsed.exchange || exchange,
        });
        onClose();
      } else if (parsed.key && parsed.secret) {
        // Alternative format
        onScan({
          apiKey: parsed.key,
          secretKey: parsed.secret,
          exchange: parsed.exchange || exchange,
        });
        onClose();
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid API credentials.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
      }
    } catch (e) {
      // Not JSON, might be a simple key format
      if (data.includes(':')) {
        const [apiKey, secretKey] = data.split(':');
        if (apiKey && secretKey) {
          onScan({ apiKey, secretKey, exchange });
          onClose();
          return;
        }
      }
      
      Alert.alert(
        'Invalid Format',
        'Could not parse API credentials from QR code. Expected JSON format with apiKey and secretKey.',
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, '#0a0a0a']}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan {exchange} QR Code</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Scanner Area */}
        <View style={styles.scannerContainer}>
          {hasPermission === null ? (
            <View style={styles.permissionBox}>
              <Ionicons name="camera" size={48} color={colors.textMuted} />
              <Text style={styles.permissionText}>Requesting camera permission...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.permissionBox}>
              <Ionicons name="camera-off" size={48} color={colors.danger} />
              <Text style={styles.permissionText}>Camera access denied</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={requestPermission}
              >
                <Text style={styles.retryText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scannerWrapper}>
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
                barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
              />
              
              {/* Scanner Overlay */}
              <View style={styles.overlay}>
                <View style={styles.overlayTop} />
                <View style={styles.overlayMiddle}>
                  <View style={styles.overlaySide} />
                  <View style={styles.scanArea}>
                    {/* Corner markers */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                  <View style={styles.overlaySide} />
                </View>
                <View style={styles.overlayBottom} />
              </View>
            </View>
          )}
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="qr-code" size={20} color={colors.primary} />
            </View>
            <Text style={styles.instructionText}>
              Point camera at your {exchange} API QR code
            </Text>
          </View>
          
          <View style={styles.instructionItem}>
            <View style={styles.instructionIcon}>
              <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            </View>
            <Text style={styles.instructionText}>
              Your credentials are stored securely on device
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color={colors.info} />
            <Text style={styles.infoText}>
              Generate QR code from {exchange} API Management → Create API → Show QR Code
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const SCAN_AREA_SIZE = 250;

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
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBox: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.text,
    fontWeight: '600',
  },
  scannerWrapper: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  instructions: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  instructionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: `${colors.info}15`,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    flex: 1,
    lineHeight: 18,
  },
});

export default QRScanner;
