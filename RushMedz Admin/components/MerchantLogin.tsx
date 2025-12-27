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
} from 'react-native';
import { useMerchantAuth } from '../contexts/MerchantAuthContext';

interface MerchantLoginProps {
  onSwitchToSignup: () => void;
  onBackToRoleSelector: () => void;
}

export default function MerchantLogin({ onSwitchToSignup, onBackToRoleSelector }: MerchantLoginProps) {
  const { signIn, loading, error, clearError } = useMerchantAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const isEmail = emailOrPhone.includes('@');
    const isPhone = /^(\+63|63|0)?9\d{9}$/.test(emailOrPhone.replace(/\s|-/g, ''));
    
    if (!isEmail && !isPhone) {
      errors.push('Valid email or Philippine phone number required');
    }
    if (password.length < 1) errors.push('Password required');
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleLogin = async () => {
    try {
      clearError();
      if (!validateForm()) return;

      await signIn(emailOrPhone, password);
      Alert.alert('Success', 'Login successful!');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Please check your credentials');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🏪</Text>
            <Text style={styles.title}>Merchant Portal</Text>
            <Text style={styles.subtitle}>Epharma Business</Text>
          </View>

          {validationErrors.length > 0 && (
            <View style={styles.errorContainer}>
              {validationErrors.map((error, index) => (
                <Text key={index} style={styles.errorText}>• {error}</Text>
              ))}
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Phone Number</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter your email or phone number" 
                placeholderTextColor="#95A5A6" 
                value={emailOrPhone} 
                onChangeText={(text) => {
                  setEmailOrPhone(text);
                  setValidationErrors([]);
                }}
                autoCapitalize="none" 
                keyboardType="default" 
                editable={!loading} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput 
                  style={[styles.input, styles.passwordInput]} 
                  placeholder="Enter your password" 
                  placeholderTextColor="#95A5A6" 
                  value={password} 
                  onChangeText={(text) => {
                    setPassword(text);
                    setValidationErrors([]);
                  }}
                  secureTextEntry={!showPassword} 
                  autoCapitalize="none" 
                  editable={!loading} 
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>Email: merchant@epharma.com</Text>
              <Text style={styles.demoText}>Password: merchant123</Text>
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
  forgotPasswordText: { color: '#4ECDC4', fontSize: 14, fontWeight: '500' },
  loginButton: { backgroundColor: '#4ECDC4', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  loginButtonDisabled: { backgroundColor: '#BDC3C7' },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  demoBox: { backgroundColor: '#E8F8F5', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#A9DFBF' },
  demoTitle: { fontSize: 12, fontWeight: 'bold', color: '#27AE60', marginBottom: 4 },
  demoText: { fontSize: 11, color: '#229954', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: '#7F8C8D', fontSize: 14 },
  signupLink: { color: '#4ECDC4', fontSize: 14, fontWeight: 'bold' },
  backButton: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  backButtonText: { fontSize: 13, color: '#3498DB', fontWeight: '600' },
});
