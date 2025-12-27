/**
 * Payment Assets - Brand Logos and Icons
 * Official payment method logos for GCash, PayMaya, PayPal, Visa, Mastercard, and COD
 */

// Payment method logo URLs (CDN-hosted or local assets)
export const PAYMENT_LOGOS = {
  // GCash Logo (Philippines)
  gcash: {
    primary: 'https://www.gcash.com/wp-content/uploads/2019/04/gcash-logo.png',
    icon: 'https://cdn.worldvectorlogo.com/logos/gcash-logo.svg',
    localPath: require('../assets/payment-logos/gcash.png'),
    color: '#007DFE',
    name: 'GCash',
    tagline: 'Cashless, hassle-free payments',
  },
  
  // PayMaya/Maya Logo (Philippines)
  paymaya: {
    primary: 'https://www.maya.ph/hubfs/Maya%20Logo.png',
    icon: 'https://cdn.worldvectorlogo.com/logos/paymaya.svg',
    localPath: require('../assets/payment-logos/maya.png'),
    color: '#00D563',
    name: 'Maya',
    tagline: 'Your everyday money app',
  },
  
  // PayPal Logo
  paypal: {
    primary: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg',
    icon: 'https://cdn.worldvectorlogo.com/logos/paypal-icon.svg',
    localPath: require('../assets/payment-logos/paypal.png'),
    color: '#003087',
    name: 'PayPal',
    tagline: 'The safer, easier way to pay',
  },
  
  // Visa Logo
  visa: {
    primary: 'https://cdn.worldvectorlogo.com/logos/visa.svg',
    icon: 'https://cdn.worldvectorlogo.com/logos/visa-2.svg',
    localPath: require('../assets/payment-logos/visa.png'),
    color: '#1A1F71',
    name: 'Visa',
    tagline: 'Everywhere you want to be',
  },
  
  // Mastercard Logo
  mastercard: {
    primary: 'https://cdn.worldvectorlogo.com/logos/mastercard-2.svg',
    icon: 'https://cdn.worldvectorlogo.com/logos/mastercard-4.svg',
    localPath: require('../assets/payment-logos/mastercard.png'),
    color: '#EB001B',
    name: 'Mastercard',
    tagline: 'Priceless possibilities',
  },
  
  // American Express Logo
  amex: {
    primary: 'https://cdn.worldvectorlogo.com/logos/american-express-1.svg',
    icon: 'https://cdn.worldvectorlogo.com/logos/amex-4.svg',
    localPath: require('../assets/payment-logos/amex.png'),
    color: '#006FCF',
    name: 'American Express',
    tagline: 'Don\'t leave home without it',
  },
  
  // Cash on Delivery
  cod: {
    primary: 'https://cdn-icons-png.flaticon.com/512/2331/2331941.png',
    icon: 'https://cdn-icons-png.flaticon.com/512/2489/2489756.png',
    localPath: require('../assets/payment-logos/cod.png'),
    color: '#27AE60',
    name: 'Cash on Delivery',
    tagline: 'Pay when you receive',
  },
  
  // Wallet/Balance
  wallet: {
    primary: 'https://cdn-icons-png.flaticon.com/512/584/584026.png',
    icon: 'https://cdn-icons-png.flaticon.com/512/3572/3572582.png',
    localPath: require('../assets/payment-logos/wallet.png'),
    color: '#9B59B6',
    name: 'RushMedz Wallet',
    tagline: 'Your prepaid balance',
  },
  
  // Bank Transfer
  bank: {
    primary: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
    icon: 'https://cdn-icons-png.flaticon.com/512/3062/3062634.png',
    localPath: require('../assets/payment-logos/bank.png'),
    color: '#34495E',
    name: 'Bank Transfer',
    tagline: 'Direct bank payment',
  },
};

// Card brand detection patterns
export const CARD_BRAND_PATTERNS = {
  visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
  mastercard: /^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/,
  amex: /^3[47][0-9]{13}$/,
  discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
  diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
  jcb: /^(?:2131|1800|35\d{3})\d{11}$/,
  unionpay: /^(62|88)\d{14,17}$/,
};

/**
 * Detect card brand from card number
 */
export function detectCardBrand(cardNumber: string): keyof typeof PAYMENT_LOGOS | 'unknown' {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  // Check first digits for quick detection
  if (cleaned.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  
  // Full pattern matching
  for (const [brand, pattern] of Object.entries(CARD_BRAND_PATTERNS)) {
    if (pattern.test(cleaned)) {
      return brand as keyof typeof PAYMENT_LOGOS;
    }
  }
  
  return 'unknown';
}

/**
 * Get logo info for a payment method
 */
export function getPaymentLogo(method: keyof typeof PAYMENT_LOGOS) {
  return PAYMENT_LOGOS[method] || PAYMENT_LOGOS.wallet;
}

/**
 * Get card brand logo from card number
 */
export function getCardBrandLogo(cardNumber: string) {
  const brand = detectCardBrand(cardNumber);
  if (brand === 'unknown') return PAYMENT_LOGOS.visa; // Default to Visa
  return PAYMENT_LOGOS[brand] || PAYMENT_LOGOS.visa;
}

// Payment method config with logos
export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: 'ewallet' | 'card' | 'bank' | 'cod' | 'wallet';
  logo: typeof PAYMENT_LOGOS.gcash;
  enabled: boolean;
  processingFee: number; // Percentage
  fixedFee: number; // Fixed amount in PHP
  minAmount: number;
  maxAmount: number;
  supportedCurrencies: string[];
}

// Available payment methods with full configuration
export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'gcash',
    name: 'GCash',
    type: 'ewallet',
    logo: PAYMENT_LOGOS.gcash,
    enabled: true,
    processingFee: 2.5,
    fixedFee: 0,
    minAmount: 1,
    maxAmount: 100000,
    supportedCurrencies: ['PHP'],
  },
  {
    id: 'paymaya',
    name: 'Maya',
    type: 'ewallet',
    logo: PAYMENT_LOGOS.paymaya,
    enabled: true,
    processingFee: 2.5,
    fixedFee: 0,
    minAmount: 1,
    maxAmount: 100000,
    supportedCurrencies: ['PHP'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    type: 'ewallet',
    logo: PAYMENT_LOGOS.paypal,
    enabled: true,
    processingFee: 3.4,
    fixedFee: 15,
    minAmount: 50,
    maxAmount: 500000,
    supportedCurrencies: ['PHP', 'USD'],
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    logo: PAYMENT_LOGOS.visa, // Default to Visa, changes based on card number
    enabled: true,
    processingFee: 3.0,
    fixedFee: 0,
    minAmount: 50,
    maxAmount: 500000,
    supportedCurrencies: ['PHP', 'USD'],
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    type: 'cod',
    logo: PAYMENT_LOGOS.cod,
    enabled: true,
    processingFee: 0,
    fixedFee: 0,
    minAmount: 1,
    maxAmount: 10000,
    supportedCurrencies: ['PHP'],
  },
  {
    id: 'wallet',
    name: 'RushMedz Wallet',
    type: 'wallet',
    logo: PAYMENT_LOGOS.wallet,
    enabled: true,
    processingFee: 0,
    fixedFee: 0,
    minAmount: 1,
    maxAmount: 50000,
    supportedCurrencies: ['PHP'],
  },
];

/**
 * Get payment method config by ID
 */
export function getPaymentMethodConfig(methodId: string): PaymentMethodConfig | undefined {
  return PAYMENT_METHODS.find(m => m.id === methodId);
}

/**
 * Calculate processing fee for a payment
 */
export function calculateProcessingFee(methodId: string, amount: number): number {
  const method = getPaymentMethodConfig(methodId);
  if (!method) return 0;
  
  return (amount * method.processingFee / 100) + method.fixedFee;
}

/**
 * Get enabled payment methods
 */
export function getEnabledPaymentMethods(): PaymentMethodConfig[] {
  return PAYMENT_METHODS.filter(m => m.enabled);
}

export default {
  PAYMENT_LOGOS,
  PAYMENT_METHODS,
  detectCardBrand,
  getPaymentLogo,
  getCardBrandLogo,
  getPaymentMethodConfig,
  calculateProcessingFee,
  getEnabledPaymentMethods,
};
