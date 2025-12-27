/**
 * WalletTopUpModal
 * Real-time wallet top-up with payment gateway integration
 * Supports GCash, PayMaya, PayPal, and Card payments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { PaymentLogo } from './PaymentMethodCard';
import { realTimePaymentService, TopUpResponse } from '../services/RealTimePaymentService';
import { paymentGatewayService } from '../services/PaymentGatewayService';
import type { LinkedPaymentMethod } from '../types';

// Payment method logos
const PAYMENT_LOGOS = {
  gcash: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/GCash_logo.svg/200px-GCash_logo.svg.png',
  paymaya: 'https://www.maya.ph/hubfs/Maya%20Logo.png',
  paypal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png',
  visa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png',
  mastercard: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png',
};

const BRAND_COLORS: Record<string, string> = {
  gcash: '#007DFE',
  paymaya: '#00D563',
  paypal: '#003087',
  card: '#1A1F71',
};

const TOP_UP_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

type PaymentMethod = 'gcash' | 'paymaya' | 'paypal' | 'card';

interface WalletTopUpModalProps {
  visible: boolean;
  onClose: () => void;
  currentBalance: number;
  userId: string;
  linkedPaymentMethods?: LinkedPaymentMethod[];
  onTopUpComplete?: (newBalance: number, amount: number) => void;
}

export const WalletTopUpModal: React.FC<WalletTopUpModalProps> = ({
  visible,
  onClose,
  currentBalance,
  userId,
  linkedPaymentMethods = [],
  onTopUpComplete,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
  const [processing, setProcessing] = useState(false);
  const [pendingTopUp, setPendingTopUp] = useState<TopUpResponse | null>(null);
  const [step, setStep] = useState<'amount' | 'method' | 'processing' | 'success'>('amount');

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSelectedAmount(500);
      setCustomAmount('');
      setSelectedMethod('gcash');
      setProcessing(false);
      setPendingTopUp(null);
      setStep('amount');
    }
  }, [visible]);

  // Subscribe to real-time balance updates
  useEffect(() => {
    const unsubscribe = realTimePaymentService.onBalanceUpdate((newBalance, prevBalance) => {
      if (pendingTopUp && newBalance > prevBalance) {
        const topUpAmount = newBalance - prevBalance;
        setStep('success');
        setPendingTopUp(prev => prev ? { ...prev, newBalance, status: 'completed' } : null);
        onTopUpComplete?.(newBalance, topUpAmount);
      }
    });

    return () => unsubscribe();
  }, [pendingTopUp, onTopUpComplete]);

  const getTopUpAmount = (): number => {
    if (customAmount) {
      const amount = parseFloat(customAmount);
      if (!isNaN(amount) && amount >= 50) return amount;
    }
    return selectedAmount || 0;
  };

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text.replace(/[^0-9.]/g, ''));
    setSelectedAmount(null);
  };

  const validateAmount = (): boolean => {
    const amount = getTopUpAmount();
    if (amount < 50) {
      Alert.alert('Invalid Amount', 'Minimum top-up amount is ₱50');
      return false;
    }
    if (amount > 50000) {
      Alert.alert('Invalid Amount', 'Maximum top-up amount is ₱50,000');
      return false;
    }
    return true;
  };

  const handleProceedToMethod = () => {
    if (validateAmount()) {
      setStep('method');
    }
  };

  const handleTopUp = async () => {
    const amount = getTopUpAmount();
    if (!validateAmount()) return;

    setProcessing(true);
    setStep('processing');

    try {
      // Find linked payment method
      const linkedMethod = linkedPaymentMethods.find(m => m.type === selectedMethod);

      // Process top-up via RealTimePaymentService
      const response = await realTimePaymentService.topUpWallet({
        userId,
        amount,
        paymentMethod: selectedMethod,
        linkedPaymentMethodId: linkedMethod?.id,
        mobileNumber: linkedMethod?.mobileNumber,
        email: selectedMethod === 'paypal' ? linkedMethod?.email : undefined,
      });

      setPendingTopUp(response);

      if (response.success) {
        if (response.paymentUrl) {
          // Open payment gateway
          const canOpen = await Linking.canOpenURL(response.paymentUrl);
          if (canOpen) {
            await Linking.openURL(response.paymentUrl);
            Alert.alert(
              'Complete Payment',
              'Please complete your payment in the browser. Your balance will update automatically once payment is confirmed.',
              [{ text: 'OK' }]
            );
          } else {
            // Fallback: Show payment instructions
            Alert.alert(
              'Payment Link Ready',
              `Transaction ID: ${response.transactionId}\n\nPlease open your ${selectedMethod.toUpperCase()} app to complete the payment.`,
              [{ text: 'OK' }]
            );
          }
        } else {
          // Simulate immediate success for demo
          setTimeout(() => {
            setStep('success');
            setPendingTopUp(prev => prev ? { ...prev, status: 'completed', newBalance: currentBalance + amount } : null);
            onTopUpComplete?.(currentBalance + amount, amount);
          }, 2000);
        }
      } else {
        Alert.alert('Top-Up Failed', response.message || 'Unable to process top-up');
        setStep('method');
      }
    } catch (error: any) {
      console.error('[WalletTopUp] Error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
      setStep('method');
    } finally {
      setProcessing(false);
    }
  };

  const renderAmountStep = () => (
    <>
      <Text style={styles.sectionTitle}>Select Amount</Text>
      
      {/* Quick Amount Buttons */}
      <View style={styles.amountGrid}>
        {TOP_UP_AMOUNTS.map(amount => (
          <TouchableOpacity
            key={amount}
            style={[
              styles.amountButton,
              selectedAmount === amount && styles.amountButtonSelected,
            ]}
            onPress={() => handleSelectAmount(amount)}
          >
            <Text style={[
              styles.amountButtonText,
              selectedAmount === amount && styles.amountButtonTextSelected,
            ]}>
              ₱{amount.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Custom Amount */}
      <Text style={styles.orDivider}>— or enter custom amount —</Text>
      <View style={styles.customAmountContainer}>
        <Text style={styles.currencySymbol}>₱</Text>
        <TextInput
          style={styles.customAmountInput}
          placeholder="0.00"
          keyboardType="numeric"
          value={customAmount}
          onChangeText={handleCustomAmountChange}
          placeholderTextColor="#95A5A6"
        />
      </View>
      <Text style={styles.amountNote}>Minimum: ₱50 • Maximum: ₱50,000</Text>

      {/* Current Balance */}
      <View style={styles.balanceInfo}>
        <Text style={styles.balanceLabel}>Current Balance:</Text>
        <Text style={styles.balanceAmount}>₱{currentBalance.toLocaleString()}</Text>
      </View>

      {/* Proceed Button */}
      <TouchableOpacity
        style={[styles.proceedButton, getTopUpAmount() < 50 && styles.proceedButtonDisabled]}
        onPress={handleProceedToMethod}
        disabled={getTopUpAmount() < 50}
      >
        <Text style={styles.proceedButtonText}>
          Continue - ₱{getTopUpAmount().toLocaleString()}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderMethodStep = () => (
    <>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      <Text style={styles.amountSummary}>Amount: ₱{getTopUpAmount().toLocaleString()}</Text>

      {/* Payment Methods */}
      <View style={styles.methodsList}>
        {(['gcash', 'paymaya', 'paypal', 'card'] as PaymentMethod[]).map(method => {
          const isSelected = selectedMethod === method;
          const color = BRAND_COLORS[method];
          
          return (
            <TouchableOpacity
              key={method}
              style={[
                styles.methodCard,
                isSelected && styles.methodCardSelected,
                isSelected && { borderColor: color },
              ]}
              onPress={() => setSelectedMethod(method)}
            >
              <View style={styles.methodLogoContainer}>
                <PaymentLogo type={method} size="medium" />
              </View>
              <View style={styles.methodInfo}>
                <Text style={[styles.methodName, isSelected && { color }]}>
                  {method === 'paymaya' ? 'Maya' : method === 'card' ? 'Credit/Debit Card' : method.toUpperCase()}
                </Text>
                {method === 'card' && (
                  <View style={styles.cardLogosRow}>
                    <Image source={{ uri: PAYMENT_LOGOS.visa }} style={styles.miniLogo} resizeMode="contain" />
                    <Image source={{ uri: PAYMENT_LOGOS.mastercard }} style={styles.miniLogo} resizeMode="contain" />
                  </View>
                )}
              </View>
              {isSelected && (
                <View style={[styles.radioSelected, { backgroundColor: color }]}>
                  <Text style={styles.radioCheck}>✓</Text>
                </View>
              )}
              {!isSelected && <View style={styles.radioUnselected} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Back and Proceed Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('amount')}
          disabled={processing}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topUpButton, { backgroundColor: BRAND_COLORS[selectedMethod] }]}
          onPress={handleTopUp}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.topUpButtonText}>Top Up Now</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderProcessingStep = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={BRAND_COLORS[selectedMethod]} />
      <Text style={styles.processingTitle}>Processing Top-Up</Text>
      <Text style={styles.processingSubtitle}>
        Please wait while we connect to {selectedMethod === 'paymaya' ? 'Maya' : selectedMethod.toUpperCase()}...
      </Text>
      {pendingTopUp?.transactionId && (
        <Text style={styles.transactionId}>
          Transaction ID: {pendingTopUp.transactionId}
        </Text>
      )}
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.successContainer}>
      <View style={[styles.successIcon, { backgroundColor: BRAND_COLORS[selectedMethod] }]}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      <Text style={styles.successTitle}>Top-Up Successful!</Text>
      <Text style={styles.successAmount}>+₱{getTopUpAmount().toLocaleString()}</Text>
      <View style={styles.successBalanceRow}>
        <Text style={styles.successBalanceLabel}>New Balance:</Text>
        <Text style={styles.successBalanceAmount}>
          ₱{(pendingTopUp?.newBalance || currentBalance + getTopUpAmount()).toLocaleString()}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: BRAND_COLORS[selectedMethod] }]}
        onPress={onClose}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {step === 'success' ? '🎉 Success!' : '💰 Top Up Wallet'}
            </Text>
            {step !== 'processing' && step !== 'success' && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {step === 'amount' && renderAmountStep()}
            {step === 'method' && renderMethodStep()}
            {step === 'processing' && renderProcessingStep()}
            {step === 'success' && renderSuccessStep()}
          </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#95A5A6',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  amountButton: {
    width: '30%',
    marginHorizontal: '1.66%',
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  amountButtonSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#3498DB',
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  amountButtonTextSelected: {
    color: '#3498DB',
  },
  orDivider: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 13,
    marginBottom: 12,
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    marginRight: 8,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    paddingVertical: 16,
  },
  amountNote: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#27AE60',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#27AE60',
  },
  proceedButton: {
    backgroundColor: '#3498DB',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  proceedButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  proceedButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  amountSummary: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  methodsList: {
    marginBottom: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    padding: 16,
    marginBottom: 12,
  },
  methodCardSelected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
  },
  methodLogoContainer: {
    width: 50,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  cardLogosRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  miniLogo: {
    width: 30,
    height: 20,
    marginRight: 6,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCheck: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BDC3C7',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#E9ECEF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
  topUpButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  topUpButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 24,
  },
  processingSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
  },
  transactionId: {
    fontSize: 12,
    color: '#95A5A6',
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  successAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#27AE60',
    marginBottom: 20,
  },
  successBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 30,
  },
  successBalanceLabel: {
    fontSize: 14,
    color: '#27AE60',
    marginRight: 8,
  },
  successBalanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#27AE60',
  },
  doneButton: {
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default WalletTopUpModal;
