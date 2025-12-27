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
import { useMerchantAuth } from '../contexts/MerchantAuthContext';

interface MerchantSignupProps {
  onSwitchToLogin: () => void;
  onBackToRoleSelector: () => void;
}

export default function MerchantSignup({ onSwitchToLogin, onBackToRoleSelector }: MerchantSignupProps) {
  const { signUp, loading, error, clearError } = useMerchantAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    password: '',
    confirmPassword: '',
    businessType: 'pharmacy' as 'pharmacy' | 'clinic' | 'hospital',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (formData.businessName.length < 2) errors.push('Business name is required');
    if (formData.ownerName.length < 2) errors.push('Owner name is required');
    if (!formData.email.includes('@')) errors.push('Valid email required');
    if (formData.phone.length < 10) errors.push('Valid phone number required');
    if (!formData.licenseNumber) errors.push('License number is required');
    if (formData.password.length < 1) errors.push('Password is required');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSignup = async () => {
    try {
      clearError();
      if (!validateForm()) return;
      
      await signUp(formData.email, formData.password, formData.businessName, formData.ownerName, formData.phone, formData.licenseNumber, formData.businessType);
      setSignupSuccess(true);
      
      // Registration successful - show success message and go to login
      Alert.alert(
        'Registration Successful',
        'Your merchant account has been created successfully. You can now log in.',
        [
          {
            text: 'OK',
            onPress: onSwitchToLogin
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'Please try again');
    }
  };

  // OTP verification removed - no longer needed

  const allErrors = [...validationErrors, ...(error ? [error] : [])];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🏪</Text>
            <Text style={styles.title}>Register Your Business</Text>
            <Text style={styles.subtitle}>Join Epharma Network</Text>
          </View>

          {allErrors.length > 0 && (
            <View style={styles.errorContainer}>
              {allErrors.map((err, index) => (<Text key={index} style={styles.errorText}>❌ {err}</Text>))}
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name</Text>
              <TextInput style={styles.input} placeholder="ABC Pharmacy" value={formData.businessName} onChangeText={(v) => updateField('businessName', v)} editable={!loading} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Name</Text>
              <TextInput style={styles.input} placeholder="John Doe" value={formData.ownerName} onChangeText={(v) => updateField('ownerName', v)} autoCapitalize="words" editable={!loading} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="business@example.com" value={formData.email} onChangeText={(v) => updateField('email', v)} autoCapitalize="none" keyboardType="email-address" editable={!loading} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} placeholder="+1234567890" value={formData.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" editable={!loading} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Number</Text>
              <TextInput style={styles.input} placeholder="PH123456" value={formData.licenseNumber} onChangeText={(v) => updateField('licenseNumber', v)} autoCapitalize="characters" editable={!loading} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Type</Text>
              <View style={styles.typeContainer}>
                {(['pharmacy', 'clinic', 'hospital'] as const).map((type) => (
                  <TouchableOpacity key={type} style={[styles.typeButton, formData.businessType === type && styles.typeButtonActive]} onPress={() => updateField('businessType', type)} disabled={loading}>
                    <Text style={[styles.typeButtonText, formData.businessType === type && styles.typeButtonTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput style={[styles.input, styles.passwordInput]} placeholder="Min. 8 characters" value={formData.password} onChangeText={(v) => updateField('password', v)} secureTextEntry={!showPassword} autoCapitalize="none" editable={!loading} />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput style={styles.input} placeholder="Re-enter password" value={formData.confirmPassword} onChangeText={(v) => updateField('confirmPassword', v)} secureTextEntry autoCapitalize="none" editable={!loading} />
            </View>

            <TouchableOpacity style={[styles.signupButton, loading && styles.signupButtonDisabled]} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.signupButtonText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onSwitchToLogin} disabled={loading}>
              <Text style={styles.loginLink}>Sign In</Text>
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
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D' },
  errorContainer: { backgroundColor: '#FADBD8', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E74C3C' },
  errorText: { color: '#C0392B', fontSize: 13, marginBottom: 4 },
  form: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#DDE1E5', borderRadius: 8, padding: 12, fontSize: 16, color: '#2C3E50' },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 12, top: 12, padding: 4 },
  eyeIcon: { fontSize: 20 },
  typeContainer: { flexDirection: 'row', gap: 8 },
  typeButton: { flex: 1, borderWidth: 1, borderColor: '#DDE1E5', borderRadius: 8, padding: 12, alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' },
  typeButtonText: { fontSize: 12, color: '#7F8C8D' },
  typeButtonTextActive: { color: '#FFF', fontWeight: 'bold' },
  signupButton: { backgroundColor: '#4ECDC4', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  signupButtonDisabled: { backgroundColor: '#BDC3C7' },
  signupButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: '#7F8C8D', fontSize: 14 },
  loginLink: { color: '#4ECDC4', fontSize: 14, fontWeight: 'bold' },
  backButton: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  backButtonText: { fontSize: 13, color: '#3498DB', fontWeight: '600' },
});
