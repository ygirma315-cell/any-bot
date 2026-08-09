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
    name: 'Binance Pay',
    subtitle: 'Cryptocurrency (Binance Pay ID)',
    badge: 'Instant & Global',
    logoPath: '/assets/payments/binance.png',
    color: 'rgba(240, 185, 11, 0.25)',
    accountId: '891029481',
    accountName: 'AI Store Merchant',
    network: 'Binance Pay',
    instructions: [
      'Open your Binance App.',
      'Go to Binance Pay and enter Pay ID listed below.',
      'Enter the exact order total in USDT.',
      'Tap "I\'ve Paid" below once transferred.'
    ]
  },
  {
    id: 'usdt-crypto',
    name: 'USDT (BEP20 / TRC20)',
    subtitle: 'USDT Crypto Wallet Transfer',
    badge: 'BEP20 / TRC20',
    logoPath: '/assets/payments/usdt.png',
    color: 'rgba(38, 161, 123, 0.25)',
    accountId: '0x71C76543219876543210BEP20',
    accountName: 'AI Store Crypto Wallet',
    network: 'USDT (BEP20 / TRC20)',
    instructions: [
      'Open your Trust Wallet, Metamask, or Crypto Exchange.',
      'Send exact USDT total to the BEP20 address below.',
      'Double check network selection before sending.',
      'Tap "I\'ve Paid" below after broadcasting transaction.'
    ]
  },
  {
    id: 'telebirr',
    name: 'Telebirr',
    subtitle: 'Mobile payment service',
    badge: 'Popular',
    logoPath: '/assets/payments/telebirr.jpg',
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
    logoPath: '/assets/payments/cbe.jpg',
    color: 'rgba(147, 51, 234, 0.25)',
    accountId: '1000492817263',
    accountName: 'AI Store Digital Services',
    instructions: [
      'Open CBE Birr, CBE Mobile Banking app, or visit ATM.',
      'Transfer to Account Number listed below.',
      'Make sure recipient name displays "AI Store Digital Services".',
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
    accountId: 'ET09COMM1000492817263',
    accountName: 'AI Store Global Ltd',
    instructions: [
      'Use online banking or bank app to initiate transfer.',
      'Enter IBAN / Account Number below.',
      'Include your Telegram handle in reference note.',
      'Tap "I\'ve Paid" to complete order submission.'
    ]
  }
];
