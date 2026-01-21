// Biometric Authentication Service
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_AUTH_KEY = 'biometric_auth_token';

export const BiometricService = {
  // Check if device supports biometrics
  async isAvailable() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  },

  // Get available biometric types
  async getBiometricTypes() {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const typeNames = types.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
    return typeNames;
  },

  // Check if biometric is enabled by user
  async isEnabled() {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  },

  // Enable biometric authentication
  async enable() {
    try {
      // First verify the user can authenticate
      const result = await this.authenticate('Enable biometric login');
      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        // Store a verification token
        await SecureStore.setItemAsync(BIOMETRIC_AUTH_KEY, Date.now().toString());
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Disable biometric authentication
  async disable() {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_AUTH_KEY);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Authenticate user with biometrics
  async authenticate(promptMessage = 'Authenticate to continue') {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return { success: false, error: 'Biometrics not available' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow PIN fallback
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        return { success: true };
      } else {
        let errorMessage = 'Authentication failed';
        switch (result.error) {
          case 'user_cancel':
            errorMessage = 'Authentication cancelled';
            break;
          case 'user_fallback':
            errorMessage = 'Fallback requested';
            break;
          case 'system_cancel':
            errorMessage = 'System cancelled authentication';
            break;
          case 'not_enrolled':
            errorMessage = 'No biometrics enrolled';
            break;
          case 'lockout':
            errorMessage = 'Too many failed attempts';
            break;
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Authenticate for sensitive operations (like viewing API keys)
  async authenticateForSensitiveOperation(operation = 'this action') {
    const isEnabled = await this.isEnabled();
    if (!isEnabled) {
      return { success: true }; // Skip if not enabled
    }
    return this.authenticate(`Authenticate to ${operation}`);
  },
};

export default BiometricService;
