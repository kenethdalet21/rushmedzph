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
import { doctorAuth } from '../services/auth';

interface DoctorSignupProps {
  onSwitchToMerchantSignup: () => void;
  onBackToRoleSelector: () => void;
  onSwitchToLogin?: () => void;
}

export default function DoctorSignup({ onSwitchToMerchantSignup, onBackToRoleSelector, onSwitchToLogin }: DoctorSignupProps) {
  const { loading, error, clearError } = useMerchantAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    specialization: '',
    licenseNumber: '',
    email: '',
    phone: '',
    hospitalName: '',
    hospitalAddress: '',
    clinicName: '',
    clinicAddress: '',
    registrationType: 'individual' as 'individual' | 'clinic' | 'hospital',
    onlineServiceType: 'consultation' as 'consultation' | 'prescriptions' | 'both',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const specializations = [
    'General Medicine',
    'Cardiology',
    'Pediatrics',
    'Dermatology',
    'Orthopedics',
    'Psychiatry',
    'Neurology',
    'Oncology',
    'Rheumatology',
    'Gastroenterology',
    'Pulmonology',
    'Nephrology',
    'Endocrinology',
    'Other',
  ];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (formData.firstName.length < 2) errors.push('First name is required');
    if (formData.lastName.length < 2) errors.push('Last name is required');
    if (!formData.specialization) errors.push('Specialization is required');
    if (formData.licenseNumber.length < 3) errors.push('License number is required');
    if (!formData.email.includes('@')) errors.push('Valid email required');
    if (formData.phone.length < 10) errors.push('Valid phone number required');
    
    if (formData.registrationType === 'clinic' && formData.clinicName.length < 2) {
      errors.push('Clinic name is required');
    }
    if (formData.registrationType === 'clinic' && formData.clinicAddress.length < 5) {
      errors.push('Clinic address is required');
    }
    if (formData.registrationType === 'hospital' && formData.hospitalName.length < 2) {
      errors.push('Hospital name is required');
    }
    if (formData.registrationType === 'hospital' && formData.hospitalAddress.length < 5) {
      errors.push('Hospital address is required');
    }
    
    if (formData.password.length < 1) errors.push('Password is required');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSendOTP = async (type: 'email' | 'phone') => {
    // OTP verification disabled - no action needed
    Alert.alert('Notice', 'OTP verification is not required. You can proceed with registration.');
  };

  const handleSignup = async () => {
    try {
      clearError();
      if (!validateForm()) return;
      
      // Prepare doctor registration data
      const doctorData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        email: formData.email,
        phone: formData.phone,
        registrationType: formData.registrationType,
        organization: formData.registrationType === 'clinic' 
          ? formData.clinicName 
          : formData.registrationType === 'hospital'
          ? formData.hospitalName
          : `${formData.firstName} ${formData.lastName}'s Practice`,
        organizationAddress: formData.registrationType === 'clinic' 
          ? formData.clinicAddress 
          : formData.registrationType === 'hospital'
          ? formData.hospitalAddress
          : '',
        onlineServiceType: formData.onlineServiceType,
        password: formData.password,
      };

      // Call API to register doctor using auth service
      const result = await doctorAuth.register(doctorData as any);

      setSignupSuccess(true);
      
      // Registration successful - show success message
      Alert.alert(
        'Registration Successful',
        'Your doctor account has been created successfully. You can now log in.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSwitchToLogin) {
                onSwitchToLogin();
              }
            }
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'Please try again');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Doctor Registration</Text>
          <Text style={styles.headerSubtitle}>Register to provide medical services online</Text>
        </View>

        {/* Registration Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registration Type</Text>
          <View style={styles.typeButtonGroup}>
            {(['individual', 'clinic', 'hospital'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formData.registrationType === type && styles.typeButtonActive,
                ]}
                onPress={() => updateField('registrationType', type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.registrationType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type === 'individual' ? 'Individual Doctor' : type === 'clinic' ? 'Clinic' : 'Hospital'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(text) => updateField('firstName', text)}
            placeholderTextColor="#999"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={formData.lastName}
            onChangeText={(text) => updateField('lastName', text)}
            placeholderTextColor="#999"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Specialization *</Text>
            <ScrollView 
              style={styles.specPicker}
              scrollEnabled={true}
            >
              {specializations.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.specOption,
                    formData.specialization === spec && styles.specOptionSelected,
                  ]}
                  onPress={() => updateField('specialization', spec)}
                >
                  <Text
                    style={[
                      styles.specOptionText,
                      formData.specialization === spec && styles.specOptionTextSelected,
                    ]}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.pickerHint}>Can’t find yours? Specify below.</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your specialization"
              value={formData.specialization}
              onChangeText={(text) => updateField('specialization', text)}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* License & Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>License & Credentials</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Medical License Number"
            value={formData.licenseNumber}
            onChangeText={(text) => updateField('licenseNumber', text)}
            placeholderTextColor="#999"
          />
        </View>

        {/* Organization Details */}
        {(formData.registrationType === 'clinic' || formData.registrationType === 'hospital') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {formData.registrationType === 'clinic' ? 'Clinic' : 'Hospital'} Information
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder={formData.registrationType === 'clinic' ? 'Clinic Name' : 'Hospital Name'}
              value={formData.registrationType === 'clinic' ? formData.clinicName : formData.hospitalName}
              onChangeText={(text) => updateField(
                formData.registrationType === 'clinic' ? 'clinicName' : 'hospitalName',
                text
              )}
              placeholderTextColor="#999"
            />
            
            <TextInput
              style={[styles.input, styles.addressInput]}
              placeholder={formData.registrationType === 'clinic' ? 'Clinic Address' : 'Hospital Address'}
              value={formData.registrationType === 'clinic' ? formData.clinicAddress : formData.hospitalAddress}
              onChangeText={(text) => updateField(
                formData.registrationType === 'clinic' ? 'clinicAddress' : 'hospitalAddress',
                text
              )}
              placeholderTextColor="#999"
              multiline={true}
              numberOfLines={3}
            />
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            keyboardType="email-address"
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={formData.phone}
            onChangeText={(text) => updateField('phone', text)}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />
        </View>

        {/* Online Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Online Services</Text>
          <Text style={styles.sectionDescription}>What services will you provide?</Text>
          
          <View style={styles.typeButtonGroup}>
            {(['consultation', 'prescriptions', 'both'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formData.onlineServiceType === type && styles.typeButtonActive,
                ]}
                onPress={() => updateField('onlineServiceType', type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.onlineServiceType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type === 'consultation' ? 'Consultation' : type === 'prescriptions' ? 'Prescriptions' : 'Both'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Password */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password (8+ characters)"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordToggle}
            >
              <Text style={styles.passwordToggleText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <View style={styles.errorContainer}>
            {validationErrors.map((error, index) => (
              <Text key={index} style={styles.errorText}>• {error}</Text>
            ))}
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.signupButton, loading && styles.signupButtonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.signupButtonText}>Sign Up as Doctor</Text>
          )}
        </TouchableOpacity>

        {/* Switch to Merchant */}
        <TouchableOpacity onPress={onSwitchToMerchantSignup} style={styles.switchContainer}>
          <Text style={styles.switchText}>
            Want to register a pharmacy instead?{' '}
            <Text style={styles.switchLink}>Sign up as Merchant</Text>
          </Text>
        </TouchableOpacity>

        {/* Sign In Option */}
        <TouchableOpacity onPress={onSwitchToLogin} style={styles.signinContainer}>
          <Text style={styles.signinText}>
            Already have an account?{' '}
            <Text style={styles.signinLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity 
          onPress={onBackToRoleSelector}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back to Role Selection</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#27AE60',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  addressInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#27AE60',
    backgroundColor: '#E8F8F0',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#27AE60',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputGrow: {
    flex: 1,
    marginBottom: 0,
  },
  sendOtpButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
  },
  sendOtpButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  sendOtpText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  pickerHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 6,
  },
  specPicker: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    maxHeight: 150,
  },
  specOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specOptionSelected: {
    backgroundColor: '#E8F8F0',
  },
  specOptionText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  specOptionTextSelected: {
    fontWeight: '600',
    color: '#27AE60',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    paddingVertical: 10,
  },
  inlineOtpContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inlineOtpLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  inlineOtpHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#7F8C8D',
  },
  passwordToggleText: {
    fontSize: 18,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    marginBottom: 4,
  },
  signupButton: {
    backgroundColor: '#27AE60',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 3,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
  },
  switchText: {
    fontSize: 13,
    color: '#666',
  },
  switchLink: {
    color: '#27AE60',
    fontWeight: '600',
  },
  signinContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
  },
  signinText: {
    fontSize: 13,
    color: '#666',
  },
  signinLink: {
    color: '#27AE60',
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  backButtonText: {
    fontSize: 13,
    color: '#3498DB',
    fontWeight: '600',
  },
});
