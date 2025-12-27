import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useUserAuth } from '../contexts/UserAuthContext';
import OTPVerificationModal from './OTPVerificationModal';

interface UserLoginProps {
  onSwitchToSignup: () => void;
  onBackToRoleSelector: () => void;
}

export default function UserLogin({ onSwitchToSignup, onBackToRoleSelector }: UserLoginProps) {
  const { signIn, loading, error, clearError, sendOTP, verifyOTP, resendOTP } = useUserAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpContactValue, setOtpContactValue] = useState('');
  const [otpContactType, setOtpContactType] = useState<'email' | 'phone'>('email');
  const [enableOTP, setEnableOTP] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // If starts with 63, format as +63
    if (cleaned.startsWith('63') && cleaned.length <= 12) {
      return '+' + cleaned;
    }
    
    // If starts with 0, keep as is (09XX format)
    if (cleaned.startsWith('0') && cleaned.length <= 11) {
      return cleaned;
    }
    
    return text;
  };

  const isPhilippineMobile = (text: string) => {
    // Check for +639XXXXXXXXX (12 digits with +63) or 09XXXXXXXXX (11 digits)
    const cleaned = text.replace(/\D/g, '');
    return (
      (cleaned.startsWith('63') && cleaned.length === 12) ||
      (cleaned.startsWith('09') && cleaned.length === 11)
    );
  };

  const handleLogin = async () => {
    try {
      clearError();
      
      // Convert phone number to standardized format if needed
      let loginIdentifier = emailOrPhone;
      if (isPhilippineMobile(emailOrPhone)) {
        const cleaned = emailOrPhone.replace(/\D/g, '');
        // Convert to +63 format
        if (cleaned.startsWith('09')) {
          loginIdentifier = '+63' + cleaned.substring(1);
        } else if (cleaned.startsWith('63')) {
          loginIdentifier = '+' + cleaned;
        }
      }
      
      await signIn(loginIdentifier, password);
      
      // If OTP is enabled, proceed with OTP verification
      if (enableOTP) {
        const contactValue = emailOrPhone.includes('@') ? emailOrPhone : loginIdentifier;
        const contactType = emailOrPhone.includes('@') ? 'email' as const : 'phone' as const;
        setOtpContactValue(contactValue);
        setOtpContactType(contactType);
        await sendOTP(contactValue, contactType);
        setShowOTPModal(true);
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Please check your credentials');
    }
  };

  const handleOTPVerificationSuccess = () => {
    setShowOTPModal(false);
    Alert.alert('Success', 'Login verified successfully!');
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(otpContactValue, otpContactType);
      Alert.alert('OTP Resent', `A new OTP has been sent to your ${otpContactType}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend OTP');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>💊</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>MediDelivery</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com or +639XXXXXXXXX"
                placeholderTextColor="#95A5A6"
                value={emailOrPhone}
                onChangeText={(text) => {
                  // Auto-format phone numbers
                  const cleaned = text.replace(/\D/g, '');
                  if (cleaned.length > 0 && /^[0-9]/.test(text)) {
                    setEmailOrPhone(formatPhoneNumber(text));
                  } else {
                    setEmailOrPhone(text);
                  }
                }}
                autoCapitalize="none"
                keyboardType="default"
                editable={!loading}
              />
              {emailOrPhone && isPhilippineMobile(emailOrPhone) && (
                <Text style={styles.helperText}>📱 Philippine mobile number detected</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={[styles.input, styles.passwordInput]} placeholder="Enter your password" placeholderTextColor="#95A5A6" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" editable={!loading} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.loginButton, loading && styles.loginButtonDisabled]} onPress={handleLogin} disabled={loading || !emailOrPhone || !password}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.otpToggleSection}>
              <TouchableOpacity 
                style={[styles.otpCheckbox, enableOTP && styles.otpCheckboxChecked]}
                onPress={() => setEnableOTP(!enableOTP)}
              >
                {enableOTP && <Text style={styles.otpCheckmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.otpToggleText}>Verify with OTP (Optional)</Text>
            </View>

            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>Email: user@epharma.com</Text>
              <Text style={styles.demoText}>Password: user123</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onSwitchToSignup} disabled={loading}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onBackToRoleSelector} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Role Selection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <OTPVerificationModal
        visible={showOTPModal}
        contactValue={otpContactValue}
        contactType={otpContactType}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onClose={() => setShowOTPModal(false)}
        onResendOTP={handleResendOTP}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  content: { maxWidth: 400, width: '100%', alignSelf: 'center', position: 'relative' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#7F8C8D' },
  errorContainer: { backgroundColor: '#FADBD8', borderRadius: 8, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E74C3C' },
  errorText: { color: '#C0392B', fontSize: 14, textAlign: 'center' },
  form: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#DDE1E5', borderRadius: 8, padding: 12, fontSize: 16, color: '#2C3E50', backgroundColor: '#FFF' },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 12, top: 12, padding: 4 },
  eyeIcon: { fontSize: 20 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#96CEB4', fontSize: 14, fontWeight: '500' },
  loginButton: { backgroundColor: '#96CEB4', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  loginButtonDisabled: { backgroundColor: '#BDC3C7' },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  demoBox: { backgroundColor: '#E8F8F5', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#A9DFBF' },
  demoTitle: { fontSize: 12, fontWeight: 'bold', color: '#27AE60', marginBottom: 4 },
  demoText: { fontSize: 11, color: '#229954', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  helperText: { fontSize: 12, color: '#27AE60', marginTop: 4 },
  otpToggleSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingHorizontal: 8 },
  otpCheckbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#BDC3C7', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  otpCheckboxChecked: { backgroundColor: '#45B7D1', borderColor: '#45B7D1' },
  otpCheckmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  otpToggleText: { fontSize: 14, color: '#7F8C8D', flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: '#7F8C8D', fontSize: 14 },
  signupLink: { color: '#96CEB4', fontSize: 14, fontWeight: 'bold' },
  backButton: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  backButtonText: { fontSize: 13, color: '#3498DB', fontWeight: '600' },
});
