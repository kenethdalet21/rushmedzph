import React from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';

type ContactType = 'email' | 'phone';

interface OTPCodeInputProps {
  contactType: ContactType;
  value: string;
  onChangeText: (value: string) => void;
  editable?: boolean;
}

export default function OTPCodeInput({ contactType, value, onChangeText, editable = true }: OTPCodeInputProps) {
  const channelLabel = contactType === 'email' ? 'Email' : 'SMS';

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>OTP ({channelLabel})</Text>
        <Text style={styles.hintLabel}>Enter the 6-digit code we sent via {channelLabel.toLowerCase()}.</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="000000"
        placeholderTextColor="#BDC3C7"
        maxLength={6}
        keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
        inputMode="numeric"
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, ''))}
        editable={editable}
        autoFocus
        textContentType="oneTimeCode"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  labelRow: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
  },
  hintLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  input: {
    borderWidth: 2,
    borderColor: '#DDE1E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#2C3E50',
  },
});
