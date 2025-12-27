import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import OTPCodeInput from './OTPCodeInput';

interface OTPVerificationModalProps {
  visible: boolean;
  contactValue: string;
  contactType: 'email' | 'phone';
  onVerificationSuccess: () => void;
  onClose: () => void;
  onResendOTP?: () => void;
}

interface OTPVerifyResponse {
  verified?: boolean;
  message?: string;
  remainingAttempts?: number;
}

export default function OTPVerificationModal({
  visible,
  contactValue,
  contactType,
  onVerificationSuccess,
  onClose,
  onResendOTP,
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!visible) {
      setOtp('');
      setError('');
      setTimeLeft(600);
      setCanResend(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    // Temporary bypass: accept any 6-digit code locally
    setLoading(true);
    setError('');
    setTimeout(() => {
      setOtp('');
      setLoading(false);
      onVerificationSuccess();
    }, 300);
  };

  const handleResendOTP = async () => {
    if (!canResend || !onResendOTP) return;

    setLoading(true);
    setError('');

    try {
      await onResendOTP();
      setTimeLeft(600);
      setCanResend(false);
      setOtp('');
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Verify {contactType === 'email' ? 'Email' : 'Phone'}</Text>

          <Text style={styles.message}>
            Enter the OTP sent to{'\n'}
            <Text style={styles.contactValue}>{contactValue}</Text>
          </Text>

          <OTPCodeInput
            contactType={contactType}
            value={otp}
            onChangeText={(text) => {
              setOtp(text);
              setError('');
            }}
            editable={!loading}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.timerSection}>
            {timeLeft > 0 ? (
              <Text style={styles.timerText}>OTP expires in: {formatTime(timeLeft)}</Text>
            ) : (
              <Text style={styles.expiredText}>OTP Expired. Please resend.</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, (loading || !otp || otp.length !== 6) && styles.disabledButton]}
            onPress={handleVerifyOTP}
            disabled={loading || !otp || otp.length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resendButton,
              (!canResend || loading) && styles.disabledResendButton,
            ]}
            onPress={handleResendOTP}
            disabled={!canResend || loading}
          >
            <Text
              style={[
                styles.resendButtonText,
                (!canResend || loading) && styles.disabledResendButtonText,
              ]}
            >
              Resend OTP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  contactValue: {
    fontWeight: '600',
    color: '#45B7D1',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  timerSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  timerText: {
    color: '#F39C12',
    fontSize: 12,
    fontWeight: '600',
  },
  expiredText: {
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#45B7D1',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    borderWidth: 1,
    borderColor: '#45B7D1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledResendButton: {
    borderColor: '#BDC3C7',
  },
  resendButtonText: {
    color: '#45B7D1',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledResendButtonText: {
    color: '#BDC3C7',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#95A5A6',
    fontSize: 14,
    fontWeight: '500',
  },
});
