export interface PaymentMethod {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  logoPath: string;
  color: string;
  accountId: string;
  accountName: string;
  network?: string;
  instructions: string[];
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'binance',
    name: 'Binance Pay / USDT',
    subtitle: 'Cryptocurrency (USDT TRC20 / Binance ID)',
    badge: 'Instant & Global',
    logoPath: '/assets/payments/binance.svg',
    color: 'rgba(240, 185, 11, 0.25)',
    accountId: '294810573 (Binance Pay ID) / TTxY9z...USDT_TRC20',
    accountName: 'AI Store Merchant',
    network: 'USDT (TRC20 / Binance Pay)',
    instructions: [
      'Open your Binance App or Crypto Wallet.',
      'Send the exact order total in USDT via TRC20 network or Binance Pay ID.',
      'Copy the Account ID below for quick transfer.',
      'After completing the transaction, tap "I\'ve Paid" to submit your order verification.'
    ]
  },
  {
    id: 'telebirr',
    name: 'Telebirr',
    subtitle: 'Mobile payment service',
    badge: 'Popular',
    logoPath: '/assets/payments/telebirr.svg',
    color: 'rgba(0, 168, 232, 0.25)',
    accountId: '0911223344',
    accountName: 'AI Store Telebirr Business',
    instructions: [
      'Open Telebirr Mobile App or dial *127#.',
      'Select Transfer Money or Pay Merchant.',
      'Enter the Telebirr phone number listed below.',
      'Enter the exact amount and confirm transaction.',
      'Press "I\'ve Paid" below once transferred.'
    ]
  },
  {
    id: 'cbe',
    name: 'CBE Bank',
    subtitle: 'Commercial Bank of Ethiopia transfer',
    badge: 'Bank Direct',
    logoPath: '/assets/payments/cbe.svg',
    color: 'rgba(147, 51, 234, 0.25)',
    accountId: '1000492817263',
    accountName: 'AI Store Digital Services',
    instructions: [
      'Open CBE Birr, CBE Mobile Banking app, or visit ATM.',
      'Transfer to Account Number listed below.',
      'Make sure the recipient name displays "AI Store Digital Services".',
      'Press "I\'ve Paid" to send your order for instant processing.'
    ]
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    subtitle: 'Other Bank & International Wire',
    badge: 'Standard',
    logoPath: '/assets/payments/bank.svg',
    color: 'rgba(16, 185, 129, 0.25)',
    accountId: 'IBAN / Swift: ET09COMM1000492817263',
    accountName: 'AI Store Global Ltd',
    instructions: [
      'Use online banking or bank app to initiate transfer.',
      'Enter IBAN / Account Number below.',
      'Include your Telegram handle in reference note.',
      'Tap "I\'ve Paid" to complete order submission.'
    ]
  }
];
