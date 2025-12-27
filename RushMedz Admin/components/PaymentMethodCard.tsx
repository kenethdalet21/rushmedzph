/**
 * PaymentMethodCard Component
 * Reusable component displaying payment method with official brand logos
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { PAYMENT_LOGOS, detectCardBrand } from '../constants/PaymentAssets';

type PaymentMethodType = 'gcash' | 'paymaya' | 'maya' | 'paypal' | 'visa' | 'mastercard' | 'amex' | 'card' | 'cod' | 'wallet' | 'bank';

// Payment logo URLs (CDN-hosted for reliable access)
const LOGO_URLS: Record<PaymentMethodType, string> = {
  gcash: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/GCash_logo.svg/200px-GCash_logo.svg.png',
  paymaya: 'https://www.maya.ph/hubfs/Maya%20Logo.png',
  maya: 'https://www.maya.ph/hubfs/Maya%20Logo.png',
  paypal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png',
  visa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png',
  mastercard: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png',
  amex: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/200px-American_Express_logo_%282018%29.svg.png',
  card: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png', // Default to Visa
  cod: 'https://cdn-icons-png.flaticon.com/128/2331/2331941.png',
  wallet: 'https://cdn-icons-png.flaticon.com/128/584/584026.png',
  bank: 'https://cdn-icons-png.flaticon.com/128/2830/2830284.png',
};

// Brand colors
const BRAND_COLORS: Record<PaymentMethodType, string> = {
  gcash: '#007DFE',
  paymaya: '#00D563',
  maya: '#00D563',
  paypal: '#003087',
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#006FCF',
  card: '#1A1F71', // Default to Visa color
  cod: '#27AE60',
  wallet: '#9B59B6',
  bank: '#34495E',
};

interface PaymentMethodCardProps {
  type: PaymentMethodType;
  name?: string;
  subtitle?: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  showCheckmark?: boolean;
  isDefault?: boolean;
  rightComponent?: React.ReactNode;
  cardNumber?: string; // For detecting card brand
  compact?: boolean;
  style?: any;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  type,
  name,
  subtitle,
  selected = false,
  onPress,
  disabled = false,
  showCheckmark = true,
  isDefault = false,
  rightComponent,
  cardNumber,
  compact = false,
  style,
}) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

  // Determine the actual type for cards (detect brand from card number)
  let displayType = type;
  if (type === 'card' && cardNumber) {
    const detectedBrand = detectCardBrand(cardNumber);
    if (detectedBrand !== 'unknown') {
      displayType = detectedBrand as PaymentMethodType;
    }
  }

  const logoUrl = LOGO_URLS[displayType] || LOGO_URLS.wallet;
  const brandColor = BRAND_COLORS[displayType] || '#2C3E50';

  const displayName = name || getDefaultName(displayType);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        compact && styles.containerCompact,
        selected && styles.containerSelected,
        disabled && styles.containerDisabled,
        { borderColor: selected ? brandColor : '#E0E0E0' },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Logo */}
      <View style={[styles.logoContainer, compact && styles.logoContainerCompact]}>
        {imageLoading && !imageError && (
          <ActivityIndicator size="small" color={brandColor} style={styles.loadingIndicator} />
        )}
        <Image
          source={{ uri: logoUrl }}
          style={[
            styles.logo,
            compact && styles.logoCompact,
            imageLoading && styles.logoHidden,
          ]}
          resizeMode="contain"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
        />
        {imageError && (
          <View style={[styles.fallbackLogo, { backgroundColor: brandColor }]}>
            <Text style={styles.fallbackText}>{displayType.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, disabled && styles.nameDisabled]}>{displayName}</Text>
          {isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: brandColor }]}>
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, disabled && styles.subtitleDisabled]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right side */}
      <View style={styles.rightContainer}>
        {rightComponent || (
          showCheckmark && selected && (
            <View style={[styles.checkmark, { backgroundColor: brandColor }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )
        )}
      </View>
    </TouchableOpacity>
  );
};

// Payment method logo only (for inline display)
interface PaymentLogoProps {
  type: PaymentMethodType;
  size?: 'small' | 'medium' | 'large';
  cardNumber?: string;
  style?: any;
}

export const PaymentLogo: React.FC<PaymentLogoProps> = ({
  type,
  size = 'medium',
  cardNumber,
  style,
}) => {
  const [imageError, setImageError] = React.useState(false);

  let displayType = type;
  if (type === 'card' && cardNumber) {
    const detectedBrand = detectCardBrand(cardNumber);
    if (detectedBrand !== 'unknown') {
      displayType = detectedBrand as PaymentMethodType;
    }
  }

  const logoUrl = LOGO_URLS[displayType] || LOGO_URLS.wallet;
  const brandColor = BRAND_COLORS[displayType] || '#2C3E50';

  const sizeMap = {
    small: { width: 24, height: 16 },
    medium: { width: 40, height: 28 },
    large: { width: 60, height: 40 },
  };

  const dimensions = sizeMap[size];

  if (imageError) {
    return (
      <View style={[{ ...dimensions, backgroundColor: brandColor, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text style={{ color: '#FFF', fontSize: dimensions.height * 0.5, fontWeight: 'bold' }}>
          {displayType.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: logoUrl }}
      style={[dimensions, { borderRadius: 4 }, style]}
      resizeMode="contain"
      onError={() => setImageError(true)}
    />
  );
};

// Payment method selector grid
interface PaymentMethodSelectorProps {
  methods: PaymentMethodType[];
  selectedMethod: PaymentMethodType | null;
  onSelect: (method: PaymentMethodType) => void;
  disabledMethods?: PaymentMethodType[];
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods,
  selectedMethod,
  onSelect,
  disabledMethods = [],
}) => {
  return (
    <View style={styles.selectorGrid}>
      {methods.map((method) => (
        <TouchableOpacity
          key={method}
          style={[
            styles.selectorItem,
            selectedMethod === method && styles.selectorItemSelected,
            disabledMethods.includes(method) && styles.selectorItemDisabled,
          ]}
          onPress={() => onSelect(method)}
          disabled={disabledMethods.includes(method)}
        >
          <PaymentLogo type={method} size="medium" />
          <Text style={[
            styles.selectorItemText,
            selectedMethod === method && styles.selectorItemTextSelected,
          ]}>
            {getDefaultName(method)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Accepted payment methods display
interface AcceptedPaymentsProps {
  methods?: PaymentMethodType[];
  size?: 'small' | 'medium' | 'large';
}

export const AcceptedPayments: React.FC<AcceptedPaymentsProps> = ({
  methods = ['gcash', 'paymaya', 'paypal', 'visa', 'mastercard', 'cod'],
  size = 'small',
}) => {
  return (
    <View style={styles.acceptedContainer}>
      <Text style={styles.acceptedLabel}>We accept:</Text>
      <View style={styles.acceptedLogos}>
        {methods.map((method) => (
          <PaymentLogo key={method} type={method} size={size} style={styles.acceptedLogo} />
        ))}
      </View>
    </View>
  );
};

// Helper function for default names
function getDefaultName(type: PaymentMethodType): string {
  const names: Record<PaymentMethodType, string> = {
    gcash: 'GCash',
    paymaya: 'Maya',
    maya: 'Maya',
    paypal: 'PayPal',
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    card: 'Credit/Debit Card',
    cod: 'Cash on Delivery',
    wallet: 'RushMedz Wallet',
    bank: 'Bank Transfer',
  };
  return names[type] || type.toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
    marginVertical: 6,
  },
  containerCompact: {
    padding: 10,
    marginVertical: 4,
  },
  containerSelected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
  },
  containerDisabled: {
    opacity: 0.5,
    backgroundColor: '#F5F5F5',
  },
  logoContainer: {
    width: 56,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoContainerCompact: {
    width: 44,
    height: 32,
    marginRight: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoCompact: {
    width: 40,
    height: 28,
  },
  logoHidden: {
    opacity: 0,
  },
  loadingIndicator: {
    position: 'absolute',
  },
  fallbackLogo: {
    width: 44,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  nameDisabled: {
    color: '#95A5A6',
  },
  subtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 3,
  },
  subtitleDisabled: {
    color: '#BDC3C7',
  },
  defaultBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  rightContainer: {
    marginLeft: 10,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Selector styles
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  selectorItem: {
    width: '30%',
    margin: '1.66%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    padding: 12,
    alignItems: 'center',
  },
  selectorItemSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#3498DB',
  },
  selectorItemDisabled: {
    opacity: 0.4,
  },
  selectorItemText: {
    fontSize: 11,
    color: '#6C757D',
    marginTop: 6,
    textAlign: 'center',
  },
  selectorItemTextSelected: {
    color: '#3498DB',
    fontWeight: '600',
  },
  // Accepted payments styles
  acceptedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  acceptedLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginRight: 8,
  },
  acceptedLogos: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptedLogo: {
    marginHorizontal: 4,
  },
});

export default PaymentMethodCard;
