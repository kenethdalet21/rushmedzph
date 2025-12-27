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
import { doctorAuth } from '../services/auth';

interface DoctorLoginProps {
  onSwitchToSignup: () => void;
  onBackToRoleSelector: () => void;
  onLoginSuccess?: (doctorData: any) => void;
}

export default function DoctorLogin({ onSwitchToSignup, onBackToRoleSelector, onLoginSuccess }: DoctorLoginProps) {
  const { signIn, loading, error, clearError } = useMerchantAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.startsWith('63') && cleaned.length <= 12) {
      return '+' + cleaned;
    }
    if (cleaned.startsWith('0') && cleaned.length <= 11) {
      return cleaned;
    }
    return text;
  };

  const isPhilippineMobile = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    return (
      (cleaned.startsWith('63') && cleaned.length === 12) ||
      (cleaned.startsWith('09') && cleaned.length === 11)
    );
  };

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

      let doctorData;
      
      try {
        const data = await doctorAuth.login({
          emailOrPhone: emailOrPhone,
          password,
        });
        
        doctorData = {
          id: data.doctorId,
          email: data.email || (emailOrPhone.includes('@') ? emailOrPhone : ''),
          phone: data.phone || (!emailOrPhone.includes('@') ? emailOrPhone : ''),
          name: data.fullName || 'Doctor',
          role: 'doctor',
          token: data.token,
        };
      } catch (apiErr: any) {
        console.log('Backend unavailable, using demo mode:', apiErr.message);
        
        // Demo doctor accounts with proper IDs matching AVAILABLE_DOCTORS
        const demoDoctors: { [key: string]: { id: string; name: string; specialization: string } } = {
          'maria@epharma.com': { id: 'doc1', name: 'Maria Santos', specialization: 'General Medicine' },
          'jose@epharma.com': { id: 'doc2', name: 'Jose Reyes', specialization: 'Internal Medicine' },
          'ana@epharma.com': { id: 'doc3', name: 'Ana Cruz', specialization: 'Family Medicine' },
          'miguel@epharma.com': { id: 'doc4', name: 'Miguel Torres', specialization: 'General Practice' },
          'patricia@epharma.com': { id: 'doc5', name: 'Patricia Lim', specialization: 'Emergency Medicine' },
          'doctor@epharma.com': { id: 'doc1', name: 'Maria Santos', specialization: 'General Medicine' },
        };
        
        const demoDoctor = demoDoctors[emailOrPhone.toLowerCase()];
        const isValidPassword = password.length >= 1;
        
        if (!demoDoctor || !isValidPassword) {
          throw new Error('Invalid credentials. Demo accounts:\n• maria@epharma.com\n• jose@epharma.com\n• ana@epharma.com\n• miguel@epharma.com\n• patricia@epharma.com');
        }
        
        doctorData = {
          id: demoDoctor.id,
          email: emailOrPhone,
          phone: '',
          name: demoDoctor.name,
          specialization: demoDoctor.specialization,
          role: 'doctor',
          token: `demo_token_${Math.random().toString(36).substring(7)}`,
        };
      }
      
      if (onLoginSuccess) {
        onLoginSuccess(doctorData);
      } else {
        Alert.alert('Login Successful', `Welcome back, ${doctorData.name}!`);
      }
    } catch (err: any) {
      Alert.alert('Login Error', err.message || 'Please try again');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>👨‍⚕️</Text>
            <Text style={styles.title}>Doctor Portal</Text>
            <Text style={styles.subtitle}>Epharma Medical Services</Text>
          </View>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <View style={styles.errorContainer}>
              {validationErrors.map((err, index) => (
                <Text key={index} style={styles.errorText}>• {err}</Text>
              ))}
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com or +639XXXXXXXXX"
                placeholderTextColor="#95A5A6"
                value={emailOrPhone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '');
                  if (cleaned.length > 0 && /^[0-9]/.test(text)) {
                    setEmailOrPhone(formatPhoneNumber(text));
                  } else {
                    setEmailOrPhone(text);
                  }
                  setValidationErrors([]);
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

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading || !emailOrPhone || !password}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Demo Credentials */}
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>Email: doctor@epharma.com</Text>
              <Text style={styles.demoText}>Password: doctor123</Text>
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onSwitchToSignup} disabled={loading}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
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
  forgotPasswordText: { color: '#27AE60', fontSize: 14, fontWeight: '500' },
  loginButton: { backgroundColor: '#27AE60', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 16 },
  loginButtonDisabled: { backgroundColor: '#BDC3C7' },
  loginButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  demoBox: { backgroundColor: '#E8F8F5', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#A9DFBF' },
  demoTitle: { fontSize: 12, fontWeight: 'bold', color: '#27AE60', marginBottom: 4 },
  demoText: { fontSize: 11, color: '#229954', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  helperText: { fontSize: 12, color: '#27AE60', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: '#7F8C8D', fontSize: 14 },
  signupLink: { color: '#27AE60', fontSize: 14, fontWeight: 'bold' },
  backButton: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  backButtonText: { fontSize: 13, color: '#3498DB', fontWeight: '600' },
});
